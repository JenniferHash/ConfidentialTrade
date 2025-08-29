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

    // Structure for pending withdrawals
    struct PendingWithdrawal {
        address user;
        uint256 timestamp;
        bool complete;
    }

    // Storage mappings
    mapping(address => UserRegistration) public userRegistrations;
    mapping(address => mapping(address => uint256)) public userBalances;
    mapping(uint256 => PendingWithdrawal) private pendingWithdrawals;

    // Contract configuration
    address public owner;
    address public usdtToken; // Mock USDT contract address

    mapping(address => uint256) public tokenPrices;

    //user address => decryptedProxyAddress
    mapping(address => address) public decryptedProxyAddresses;

    // Events
    event UserRegistered(address indexed user, uint256 timestamp);
    event AnonymousPurchase(address indexed user, address tokenAddress, uint256 buyAmount, uint256 usdtSpent);
    event WithdrawalRequested(address indexed user, uint256 requestId);
    event WithdrawalCompleted(uint256 indexed requestId, address decryptedAddress);

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

    function setPrice(address tokenAddress, uint256 price) external onlyOwner {
        tokenPrices[tokenAddress] = price;
    }

    /**
     * @dev Anonymous purchase function - buy tokens using USDT but store in user treasury
     * @param tokenAddress buy token address
     * @param buyAmount Amount of token to buy
     */
    function anonymousPurchase(address tokenAddress, uint256 buyAmount) external onlyRegistered {
        if (buyAmount == 0) revert InvalidAmount();
        require(tokenPrices[tokenAddress] > 0, "no this token");
        uint256 usdtAmount = tokenPrices[tokenAddress] * buyAmount / 10 ** 18;
        // Check user's USDT balance
        IERC20 usdt = IERC20(usdtToken);
        if (usdt.balanceOf(msg.sender) < usdtAmount) revert InsufficientUSDTBalance();

        // Calculate token amount based on symbol
        // uint256 tokenAmount;
        // if (keccak256(abi.encodePacked(tokenSymbol)) == keccak256(abi.encodePacked("ETH"))) {
        //     tokenAmount = (usdtAmount * 10 ** 18) / ETH_PRICE; // ETH has 18 decimals
        //     userBalances[msg.sender].eth += tokenAmount;
        // } else if (keccak256(abi.encodePacked(tokenSymbol)) == keccak256(abi.encodePacked("ZAMA"))) {
        //     tokenAmount = (usdtAmount * 10 ** 18) / ZAMA_PRICE; // ZAMA has 18 decimals
        //     userBalances[msg.sender].zama += tokenAmount;
        // } else {
        //     revert InvalidTokenSymbol();
        // }

        // Transfer USDT from user to contract (consuming USDT)
        require(usdt.transferFrom(msg.sender, address(this), usdtAmount), "USDT transfer failed");

        userBalances[msg.sender][tokenAddress] += buyAmount;

        emit AnonymousPurchase(msg.sender, tokenAddress, buyAmount, usdtAmount);
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

        // The decrypted proxy address can now claim these tokens
        // In a real implementation, this would transfer actual tokens to the proxy address
        // For now, we just emit an event showing the proxy address can claim the amounts
        decryptedProxyAddresses[pending.user] = decryptedProxyAddress;
        emit WithdrawalCompleted(requestId, decryptedProxyAddress);
    }

    function decryptWithdrawToken(address user, address tokenAddress) external {
        require(decryptedProxyAddresses[user] == msg.sender, "not proxy address");
        userBalances[msg.sender][tokenAddress] = userBalances[user][tokenAddress];
        userBalances[user][tokenAddress] = 0;
    }

    /**
     * @dev View functions
     */
    function getUserRegistration(address user) external view returns (UserRegistration memory) {
        return userRegistrations[user];
    }

    function getUserBalance(address user, address tokenAddress) external view returns (uint256) {
        return userBalances[user][tokenAddress];
    }

    function getPendingWithdrawal(uint256 requestId) external view returns (PendingWithdrawal memory) {
        return pendingWithdrawals[requestId];
    }

    function getTokenPrice(address tokenAddress) external view returns (uint256) {
        return tokenPrices[tokenAddress];
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
