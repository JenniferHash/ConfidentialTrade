// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, eaddress, externalEaddress, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    function transfer(address to, uint256 amount) external returns (bool);

    function balanceOf(address account) external view returns (uint256);
}

contract ConfidentialTrade is SepoliaConfig {
    // Structure for user registration with encrypted proxy address
    struct UserRegistration {
        eaddress encryptedProxyAddress; // Encrypted address that will operate on user's behalf
        bool isRegistered;
        uint256 registrationTime;
    }

    // Structure for user balances (pseudo tokens)
    struct UserBalance {
        uint256 eth; // Pseudo ETH balance
        uint256 zama; // Pseudo ZAMA balance
    }

    // Structure for pending withdrawals
    struct PendingWithdrawal {
        address user;
        uint256 timestamp;
        bool complete;
    }

    // Storage mappings
    mapping(address => UserRegistration) public userRegistrations;
    mapping(address => UserBalance) public userBalances;
    mapping(uint256 => PendingWithdrawal) private pendingWithdrawals;

    // Contract configuration
    address public owner;
    address public usdtToken; // Mock USDT contract address

    // Supported token prices (in USDT, with 6 decimals)
    uint256 public constant ETH_PRICE = 3000 * 10 ** 6; // 3000 USDT per ETH
    uint256 public constant ZAMA_PRICE = 10 * 10 ** 6; // 10 USDT per ZAMA

    // Events
    event UserRegistered(address indexed user, uint256 timestamp);
    event AnonymousPurchase(address indexed user, string tokenSymbol, uint256 amount, uint256 usdtSpent);
    event WithdrawalRequested(address indexed user, uint256 requestId);
    event WithdrawalCompleted(
        uint256 indexed requestId,
        address decryptedAddress,
        uint256 ethAmount,
        uint256 zamaAmount
    );

    // Errors
    error OnlyOwner();
    error UserAlreadyRegistered();
    error UserNotRegistered();
    error InsufficientUSDTBalance();
    error InvalidTokenSymbol();
    error InvalidAmount();
    error InvalidWithdrawalRequest();
    error WithdrawalAlreadyCompleted();

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlyRegistered() {
        if (!userRegistrations[msg.sender].isRegistered) revert UserNotRegistered();
        _;
    }

    constructor(address _usdtToken) {
        owner = msg.sender;
        usdtToken = _usdtToken;
    }

    /**
     * @dev Register encrypted proxy address for anonymous operations
     * @param encryptedProxyAddress The encrypted address that will operate on user's behalf
     * @param addressProof Proof for the encrypted address
     */
    function registerProxyAddress(externalEaddress encryptedProxyAddress, bytes calldata addressProof) external {
        if (userRegistrations[msg.sender].isRegistered) revert UserAlreadyRegistered();

        eaddress encryptedAddr = FHE.fromExternal(encryptedProxyAddress, addressProof);

        userRegistrations[msg.sender] = UserRegistration({
            encryptedProxyAddress: encryptedAddr,
            isRegistered: true,
            registrationTime: block.timestamp
        });

        // Grant access control permissions
        FHE.allowThis(encryptedAddr);
        FHE.allow(encryptedAddr, msg.sender);

        emit UserRegistered(msg.sender, block.timestamp);
    }

    /**
     * @dev Anonymous purchase function - buy tokens using USDT but store in user treasury
     * @param tokenSymbol "ETH" or "ZAMA"
     * @param usdtAmount Amount of USDT to spend (with 6 decimals)
     */
    function anonymousPurchase(string calldata tokenSymbol, uint256 usdtAmount) external onlyRegistered {
        if (usdtAmount == 0) revert InvalidAmount();

        // Check user's USDT balance
        IERC20 usdt = IERC20(usdtToken);
        if (usdt.balanceOf(msg.sender) < usdtAmount) revert InsufficientUSDTBalance();

        // Calculate token amount based on symbol
        uint256 tokenAmount;
        if (keccak256(abi.encodePacked(tokenSymbol)) == keccak256(abi.encodePacked("ETH"))) {
            tokenAmount = (usdtAmount * 10 ** 18) / ETH_PRICE; // ETH has 18 decimals
            userBalances[msg.sender].eth += tokenAmount;
        } else if (keccak256(abi.encodePacked(tokenSymbol)) == keccak256(abi.encodePacked("ZAMA"))) {
            tokenAmount = (usdtAmount * 10 ** 18) / ZAMA_PRICE; // ZAMA has 18 decimals
            userBalances[msg.sender].zama += tokenAmount;
        } else {
            revert InvalidTokenSymbol();
        }

        // Transfer USDT from user to contract (consuming USDT)
        require(usdt.transferFrom(msg.sender, address(this), usdtAmount), "USDT transfer failed");

        emit AnonymousPurchase(msg.sender, tokenSymbol, tokenAmount, usdtAmount);
    }


    /**
     * @dev Request decryption of proxy address to enable withdrawal
     * @return requestId The ID of the decryption request
     */
    function requestDecryption() external onlyRegistered returns (uint256) {
        UserRegistration memory registration = userRegistrations[msg.sender];

        // Prepare ciphertext for decryption
        bytes32[] memory handles = new bytes32[](1);
        handles[0] = FHE.toBytes32(registration.encryptedProxyAddress);

        // Request decryption
        uint256 requestId = FHE.requestDecryption(handles, this.revealAndWithdraw.selector);

        // Store pending withdrawal
        pendingWithdrawals[requestId] = PendingWithdrawal({
            user: msg.sender,
            timestamp: block.timestamp,
            complete: false
        });

        emit WithdrawalRequested(msg.sender, requestId);
        return requestId;
    }

    /**
     * @dev Complete withdrawal after decryption (callback function)
     * @param requestId The decryption request ID
     * @param decryptedProxyAddress The decrypted proxy address
     * @param signatures Cryptographic signatures for verification
     */
    function revealAndWithdraw(uint256 requestId, address decryptedProxyAddress, bytes[] calldata signatures) external {
        // Verify signatures to prevent fake results
        FHE.checkSignatures(requestId, signatures);

        PendingWithdrawal storage pending = pendingWithdrawals[requestId];

        if (pending.user == address(0)) revert InvalidWithdrawalRequest();
        if (pending.complete) revert WithdrawalAlreadyCompleted();

        pending.complete = true;

        // Get user balances
        UserBalance storage balance = userBalances[pending.user];
        uint256 ethAmount = balance.eth;
        uint256 zamaAmount = balance.zama;

        // Clear user balances (simulate withdrawal)
        balance.eth = 0;
        balance.zama = 0;

        // The decrypted proxy address can now claim these tokens
        // In a real implementation, this would transfer actual tokens to the proxy address
        // For now, we just emit an event showing the proxy address can claim the amounts

        emit WithdrawalCompleted(requestId, decryptedProxyAddress, ethAmount, zamaAmount);
    }

    /**
     * @dev View functions
     */
    function getUserRegistration(address user) external view returns (UserRegistration memory) {
        return userRegistrations[user];
    }

    function getUserBalance(address user) external view returns (UserBalance memory) {
        return userBalances[user];
    }

    function getPendingWithdrawal(uint256 requestId) external view returns (PendingWithdrawal memory) {
        return pendingWithdrawals[requestId];
    }

    function getTokenPrices() external pure returns (uint256 ethPrice, uint256 zamaPrice) {
        return (ETH_PRICE, ZAMA_PRICE);
    }

    /**
     * @dev Owner functions
     */
    function setUSDTToken(address _usdtToken) external onlyOwner {
        usdtToken = _usdtToken;
    }


    /**
     * @dev Emergency function to withdraw any stuck tokens
     */
    function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).transfer(to, amount);
    }
}
