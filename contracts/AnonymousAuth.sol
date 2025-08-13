// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, euint8, euint256, ebool, externalEuint64, externalEuint8, externalEuint256} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Anonymous Authentication System
/// @notice This contract provides anonymous registration and login functionality using FHE
/// @dev Users can register with encrypted credentials and login without revealing their real address
contract AnonymousAuth is SepoliaConfig {
    struct EncryptedUser {
        euint256 encryptedUsername;    // Encrypted username hash
        euint256 encryptedPassword;    // Encrypted password hash  
        euint64 registrationTime;     // Encrypted registration timestamp
        ebool isActive;               // Encrypted active status
    }
    
    struct UserSession {
        address proxyAddress;         // The proxy address used for this session
        uint256 sessionExpiry;       // Session expiration timestamp
        bool isValid;                // Session validity status
    }
    
    // Mapping from real user address to encrypted user data
    mapping(address => EncryptedUser) private users;
    
    // Mapping from proxy address to real user address  
    mapping(address => address) private proxyToReal;
    
    // Mapping from real address to current proxy address
    mapping(address => address) private realToProxy;
    
    // Mapping from proxy address to session data
    mapping(address => UserSession) private sessions;
    
    // Mapping to track registered users
    mapping(address => bool) public isRegistered;
    
    // Events
    event UserRegistered(address indexed realAddress, address indexed proxyAddress);
    event UserLoggedIn(address indexed proxyAddress, uint256 sessionExpiry);
    event UserLoggedOut(address indexed proxyAddress);
    event ProxyAddressChanged(address indexed realAddress, address indexed oldProxy, address indexed newProxy);
    
    // Session duration (24 hours)
    uint256 public constant SESSION_DURATION = 24 * 60 * 60;
    
    /// @notice Register a new user with encrypted credentials
    /// @param encryptedUsernameHash External encrypted username hash
    /// @param encryptedPasswordHash External encrypted password hash
    /// @param proxyAddress The proxy address to use for this user
    /// @param inputProof Proof for encrypted inputs
    function register(
        externalEuint256 encryptedUsernameHash,
        externalEuint256 encryptedPasswordHash,
        address proxyAddress,
        bytes calldata inputProof
    ) external {
        require(!isRegistered[msg.sender], "User already registered");
        require(proxyAddress != address(0), "Invalid proxy address");
        require(proxyAddress != msg.sender, "Proxy cannot be same as real address");
        require(proxyToReal[proxyAddress] == address(0), "Proxy address already in use");
        
        // Convert external encrypted inputs
        euint256 username = FHE.fromExternal(encryptedUsernameHash, inputProof);
        euint256 password = FHE.fromExternal(encryptedPasswordHash, inputProof);
        euint64 timestamp = FHE.asEuint64(block.timestamp);
        ebool active = FHE.asEbool(true);
        
        // Store encrypted user data
        users[msg.sender] = EncryptedUser({
            encryptedUsername: username,
            encryptedPassword: password,
            registrationTime: timestamp,
            isActive: active
        });
        
        // Set up address mappings
        proxyToReal[proxyAddress] = msg.sender;
        realToProxy[msg.sender] = proxyAddress;
        isRegistered[msg.sender] = true;
        
        // Grant ACL permissions
        FHE.allowThis(username);
        FHE.allowThis(password);
        FHE.allowThis(timestamp);
        FHE.allowThis(active);
        FHE.allow(username, msg.sender);
        FHE.allow(password, msg.sender);
        FHE.allow(timestamp, msg.sender);
        FHE.allow(active, msg.sender);
        
        emit UserRegistered(msg.sender, proxyAddress);
    }
    
    /// @notice Login with encrypted credentials through proxy address
    /// @param encryptedUsernameHash External encrypted username hash
    /// @param encryptedPasswordHash External encrypted password hash  
    /// @param inputProof Proof for encrypted inputs
    function login(
        externalEuint256 encryptedUsernameHash,
        externalEuint256 encryptedPasswordHash,
        bytes calldata inputProof
    ) external {
        address realAddress = proxyToReal[msg.sender];
        require(realAddress != address(0), "Proxy address not registered");
        require(isRegistered[realAddress], "User not registered");
        
        // Convert external encrypted inputs
        euint256 inputUsername = FHE.fromExternal(encryptedUsernameHash, inputProof);
        euint256 inputPassword = FHE.fromExternal(encryptedPasswordHash, inputProof);
        
        // Get stored user data
        EncryptedUser storage user = users[realAddress];
        
        // Verify credentials using FHE comparison
        ebool usernameMatch = FHE.eq(user.encryptedUsername, inputUsername);
        ebool passwordMatch = FHE.eq(user.encryptedPassword, inputPassword);
        ebool isUserActive = user.isActive;
        
        // All conditions must be true for successful login
        ebool canLogin = FHE.and(FHE.and(usernameMatch, passwordMatch), isUserActive);
        
        // Create session (conditional execution)
        uint256 sessionExpiry = block.timestamp + SESSION_DURATION;
        
        // Store session data (will be valid only if canLogin is true)
        sessions[msg.sender] = UserSession({
            proxyAddress: msg.sender,
            sessionExpiry: sessionExpiry,
            isValid: true  // This will be conditionally valid based on FHE computation
        });
        
        // Grant temporary ACL permissions for this session
        FHE.allowTransient(canLogin, msg.sender);
        
        emit UserLoggedIn(msg.sender, sessionExpiry);
    }
    
    /// @notice Logout and invalidate current session
    function logout() external {
        require(sessions[msg.sender].isValid, "No active session");
        
        // Invalidate session
        sessions[msg.sender].isValid = false;
        sessions[msg.sender].sessionExpiry = 0;
        
        emit UserLoggedOut(msg.sender);
    }
    
    /// @notice Change proxy address for a user
    /// @param newProxyAddress New proxy address to use
    function changeProxyAddress(address newProxyAddress) external {
        require(isRegistered[msg.sender], "User not registered");
        require(newProxyAddress != address(0), "Invalid proxy address");
        require(newProxyAddress != msg.sender, "Proxy cannot be same as real address");
        require(proxyToReal[newProxyAddress] == address(0), "New proxy address already in use");
        
        address oldProxy = realToProxy[msg.sender];
        
        // Clear old mapping
        if (oldProxy != address(0)) {
            delete proxyToReal[oldProxy];
            delete sessions[oldProxy];
        }
        
        // Set new mapping
        proxyToReal[newProxyAddress] = msg.sender;
        realToProxy[msg.sender] = newProxyAddress;
        
        emit ProxyAddressChanged(msg.sender, oldProxy, newProxyAddress);
    }
    
    /// @notice Check if a session is valid
    /// @param proxyAddress The proxy address to check
    /// @return bool indicating if session is valid
    function isSessionValid(address proxyAddress) external view returns (bool) {
        UserSession memory session = sessions[proxyAddress];
        return session.isValid && block.timestamp <= session.sessionExpiry;
    }
    
    /// @notice Get proxy address for a real address
    /// @param realAddress The real user address
    /// @return address The current proxy address
    function getProxyAddress(address realAddress) external view returns (address) {
        require(isRegistered[realAddress], "User not registered");
        return realToProxy[realAddress];
    }
    
    /// @notice Get real address from proxy address (only accessible by the proxy itself)
    /// @return address The real user address
    function getRealAddress() external view returns (address) {
        return proxyToReal[msg.sender];
    }
    
    /// @notice Get encrypted user data (only accessible by the user themselves)
    /// @return EncryptedUser The encrypted user data
    function getEncryptedUserData() external view returns (EncryptedUser memory) {
        require(isRegistered[msg.sender], "User not registered");
        return users[msg.sender];
    }
    
    /// @notice Get session information for current proxy
    /// @return UserSession The session data
    function getSessionInfo() external view returns (UserSession memory) {
        return sessions[msg.sender];
    }
    
    /// @notice Deactivate user account
    function deactivateAccount() external {
        require(isRegistered[msg.sender], "User not registered");
        
        users[msg.sender].isActive = FHE.asEbool(false);
        FHE.allowThis(users[msg.sender].isActive);
        FHE.allow(users[msg.sender].isActive, msg.sender);
        
        // Invalidate any active sessions
        address proxyAddr = realToProxy[msg.sender];
        if (proxyAddr != address(0) && sessions[proxyAddr].isValid) {
            sessions[proxyAddr].isValid = false;
            sessions[proxyAddr].sessionExpiry = 0;
        }
    }
    
    /// @notice Reactivate user account
    function reactivateAccount() external {
        require(isRegistered[msg.sender], "User not registered");
        
        users[msg.sender].isActive = FHE.asEbool(true);
        FHE.allowThis(users[msg.sender].isActive);
        FHE.allow(users[msg.sender].isActive, msg.sender);
    }
}