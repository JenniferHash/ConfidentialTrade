// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, eaddress, externalEaddress} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

interface IERC721 {
    function balanceOf(address owner) external view returns (uint256 balance);

    function ownerOf(uint256 tokenId) external view returns (address owner);
}

contract AnonymousAuth is SepoliaConfig {
    struct UserRegistration {
        eaddress encryptedAddress;
        bool isRegistered;
        uint256 registrationTime;
    }

    struct NFTVerificationRecord {
        address nftContract;
        bool hasNFT;
    }

    struct PendingVerification {
        address user;
        address nftContract;
        uint256 timestamp;
    }

    mapping(address => UserRegistration) public userRegistrations;
    mapping(bytes32 => NFTVerificationRecord) public nftVerifications;
    mapping(bytes32 => PendingVerification) private pendingVerifications;
    mapping(uint256 => bytes32) private requestToVerificationId;

    address public owner;
    mapping(address => bool) public authorizedNFTContracts;

    event UserRegistered(address indexed user, uint256 timestamp);
    event NFTVerificationRequested(address indexed user, address indexed nftContract, bytes32 verificationId);
    event NFTVerificationCompleted(bytes32 indexed verificationId, bool hasNFT, address verifiedAddress);
    event AirdropClaimed(address indexed user, address indexed nftContract, uint256 amount);

    error OnlyOwner();
    error UserAlreadyRegistered();
    error UserNotRegistered();
    error NFTContractNotAuthorized();
    error InvalidVerificationRequest();
    error NoAirdropAvailable();
    error AirdropAlreadyClaimed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerEncryptedAddress(externalEaddress encryptedAddress, bytes calldata addressProof) external {
        if (userRegistrations[msg.sender].isRegistered) revert UserAlreadyRegistered();

        eaddress encryptedAddr = FHE.fromExternal(encryptedAddress, addressProof);

        userRegistrations[msg.sender] = UserRegistration({
            encryptedAddress: encryptedAddr,
            isRegistered: true,
            registrationTime: block.timestamp
        });

        FHE.allowThis(encryptedAddr);
        FHE.allow(encryptedAddr, msg.sender);

        emit UserRegistered(msg.sender, block.timestamp);
    }

    function authorizeNFTContract(address nftContract, bool authorized) external onlyOwner {
        authorizedNFTContracts[nftContract] = authorized;
    }

    function requestNFTVerification(address nftContract) external returns (bytes32) {
        if (!userRegistrations[msg.sender].isRegistered) revert UserNotRegistered();
        if (!authorizedNFTContracts[nftContract]) revert NFTContractNotAuthorized();

        bytes32 verificationId = keccak256(abi.encodePacked(msg.sender, nftContract, block.timestamp));

        // Store pending verification data
        pendingVerifications[verificationId] = PendingVerification({
            user: msg.sender,
            nftContract: nftContract,
            timestamp: block.timestamp
        });

        // Convert encrypted address to handle and request decryption
        eaddress encryptedAddr = userRegistrations[msg.sender].encryptedAddress;
        bytes32[] memory handles = new bytes32[](1);
        handles[0] = FHE.toBytes32(encryptedAddr);

        uint256 requestId = FHE.requestDecryption(handles, this.completeNFTVerification.selector);
        requestToVerificationId[requestId] = verificationId;

        emit NFTVerificationRequested(msg.sender, nftContract, verificationId);

        return verificationId;
    }

    function completeNFTVerification(
        uint256 requestId,
        address decryptedAddress,
        bytes[] calldata signatures
    ) external {
        // Verify signatures to prevent fake results
        FHE.checkSignatures(requestId, signatures);
        bytes32 verificationId = requestToVerificationId[requestId];
        PendingVerification memory pending = pendingVerifications[verificationId];

        if (pending.user == address(0)) revert InvalidVerificationRequest();

        // Check if decrypted address owns the NFT
        IERC721 nft = IERC721(pending.nftContract);
        uint256 balance = nft.balanceOf(decryptedAddress);
        bool hasNFT = balance > 0;

        nftVerifications[verificationId] = NFTVerificationRecord({nftContract: pending.nftContract, hasNFT: hasNFT});

        // Clean up pending verification
        delete pendingVerifications[verificationId];
        delete requestToVerificationId[requestId];

        emit NFTVerificationCompleted(verificationId, hasNFT, address(0));
    }

    function getAirdropAmount(address nftContract) public view returns (uint256) {
        // 简单实现：每个授权的NFT合约对应1000个代币的空投
        if (authorizedNFTContracts[nftContract]) {
            return 1000 * 10 ** 18; // 假设18位小数
        }
        return 0;
    }

    function getUserRegistration(address user) external view returns (bool, uint256) {
        UserRegistration memory reg = userRegistrations[user];
        return (reg.isRegistered, reg.registrationTime);
    }

    function getNFTVerification(bytes32 verificationId) external view returns (address, bool) {
        NFTVerificationRecord memory record = nftVerifications[verificationId];
        return (record.nftContract, record.hasNFT);
    }
}
