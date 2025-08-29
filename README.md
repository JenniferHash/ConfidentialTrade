# Anonymous Shadow Operating System

A privacy-preserving NFT verification and airdrop system built with Zama's Fully Homomorphic Encryption (FHE) technology. This system allows users to anonymously prove NFT ownership and claim airdrops without revealing their actual wallet addresses.

## 🎯 Overview

The Anonymous Shadow Operating System enables users to:
- Register encrypted "shadow" addresses using FHE
- Mint test NFTs for experimentation
- Verify NFT ownership anonymously
- Record airdrop eligibility while maintaining privacy
- Keep their actual wallet addresses completely confidential

## ✨ Key Features

### 🔐 Privacy-First Design
- **Encrypted Address Registration**: User addresses are encrypted using Zama's FHE technology
- **Anonymous Verification**: NFT ownership verification without revealing wallet addresses
- **Confidential Airdrops**: Record airdrop eligibility while maintaining complete privacy

### 🎨 NFT Minting System
- **Free NFT Minting**: Anyone can mint test NFTs for experimentation
- **Standard ERC721**: Full compatibility with existing NFT infrastructure
- **Multi-recipient Support**: Mint to your own address or specify custom recipients

### 🛡️ FHE-Powered Security
- **Zero Knowledge Proofs**: Verify ownership without data exposure
- **Encrypted Computations**: All sensitive data remains encrypted on-chain
- **Decentralized Privacy**: No central authority can access private data

### 🌐 User-Friendly Interface
- **Modern Web UI**: Built with React, TypeScript, and Tailwind CSS
- **Wallet Integration**: Support for MetaMask and other Web3 wallets
- **Real-time Updates**: Live transaction status and confirmation tracking

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│  │ NFT Minting │ │ Registration │ │ Verification &      │ │
│  │   Module    │ │   Module     │ │ Airdrop Module      │ │
│  └─────────────┘ └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                Smart Contracts (Sepolia)               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│  │ SimpleNFT   │ │ AnonymousAuth│ │    Airdrop          │ │
│  │ Contract    │ │   Contract   │ │   Contract          │ │
│  └─────────────┘ └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                 Zama FHE Infrastructure                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│  │  Gateway    │ │     KMS     │ │      Relayer        │ │
│  │   Chain     │ │   Service   │ │     Service         │ │
│  └─────────────┘ └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Tech Stack

### Smart Contracts
- **Solidity**: ^0.8.24
- **Hardhat**: Development framework
- **OpenZeppelin**: Secure contract libraries
- **Zama FHEVM**: Fully homomorphic encryption
- **TypeChain**: TypeScript bindings

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **Wagmi**: Ethereum React hooks
- **RainbowKit**: Wallet connection
- **React Hot Toast**: Notifications

### Infrastructure
- **Sepolia Testnet**: Ethereum test network
- **Zama Gateway Chain**: FHE infrastructure
- **IPFS**: Decentralized storage (future)
- **Etherscan**: Contract verification

## 📦 Project Structure

```
Confidential-Identity/
├── contracts/                 # Smart contract source files
│   ├── AnonymousAuth.sol      # Main FHE authentication contract
│   ├── Airdrop.sol           # Airdrop management contract
│   ├── SimpleNFT.sol         # Test NFT minting contract
│   └── FHECounter.sol        # Example FHE contract
├── deploy/                   # Deployment scripts
│   ├── deployAnonymousAuth.ts
│   ├── deployAirdrop.ts
│   └── deploySimpleNFT.ts
├── test/                     # Contract tests
│   ├── AnonymousAuth.ts
│   ├── Airdrop.ts
│   └── FHECounter.ts
├── tasks/                    # Hardhat custom tasks
├── app/                      # Frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── AddressRegistration.tsx
│   │   │   ├── NFTVerification.tsx
│   │   │   ├── NFTMinting.tsx
│   │   │   ├── AirdropClaiming.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── config/           # Configuration files
│   │   │   ├── contracts.ts  # Contract addresses & ABIs
│   │   │   └── wagmi.ts      # Wallet configuration
│   │   ├── hooks/            # Custom React hooks
│   │   └── utils/            # Utility functions
│   ├── dist/                 # Built frontend
│   └── package.json
├── docs/                     # Documentation
├── hardhat.config.ts         # Hardhat configuration
└── package.json              # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Package manager
- **MetaMask**: Browser wallet extension
- **Sepolia ETH**: For testing (get from faucet)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Confidential-Identity.git
   cd Confidential-Identity
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Set your mnemonic phrase
   npx hardhat vars set MNEMONIC
   
   # Set your Infura API key for Sepolia access
   npx hardhat vars set INFURA_API_KEY
   
   # Optional: Set Etherscan API key for verification
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

4. **Compile contracts**
   ```bash
   npm run compile
   ```

5. **Run tests**
   ```bash
   npm run test
   ```

### Deployment

#### Deploy to Sepolia Testnet

1. **Deploy all contracts**
   ```bash
   npx hardhat deploy --network sepolia
   ```

2. **Deploy individual contracts**
   ```bash
   # Deploy SimpleNFT for testing
   npx hardhat deploy --network sepolia --tags SimpleNFT
   
   # Deploy AnonymousAuth system
   npx hardhat deploy --network sepolia --tags AnonymousAuth
   
   # Deploy Airdrop system
   npx hardhat deploy --network sepolia --tags Airdrop
   ```

3. **Verify contracts on Etherscan**
   ```bash
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd app
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

The frontend will be available at `http://localhost:3001`

## 📋 Usage Guide

### For Users

#### 1. **Mint Test NFTs**
- Connect your wallet to Sepolia testnet
- Navigate to the "Mint NFT" tab
- Click "Mint NFT" to create test tokens
- Use these NFTs for verification testing

#### 2. **Register Shadow Address**
- Go to the "Register" tab
- Enter the address you want to keep private
- Confirm the transaction to encrypt and register
- Your address is now protected by FHE

#### 3. **Verify NFT Ownership**
- Navigate to "Verify NFTs" tab
- Enter the NFT contract address
- The system will anonymously verify ownership
- Results are recorded without revealing your address

#### 4. **Claim Airdrops**
- Go to "Airdrops" tab
- Enter NFT contract addresses for verification
- Record your airdrop eligibility
- Your shadow address remains completely private

### For Developers

#### Smart Contract Interaction

```javascript
// Example: Register encrypted address
const instance = await createInstance(SepoliaConfig);
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.addAddress(shadowAddress);
const encryptedInput = await input.encrypt();

await anonymousAuthContract.registerEncryptedAddress(
  encryptedInput.handles[0], 
  encryptedInput.inputProof
);
```

#### Testing Contracts

```bash
# Run all tests
npm run test

# Run specific test file
npx hardhat test test/AnonymousAuth.ts

# Run tests on Sepolia
npm run test:sepolia
```

#### Custom Tasks

```bash
# Check user registration status
npx hardhat getUserRegistration --user <USER_ADDRESS> --network sepolia

# Verify NFT ownership
npx hardhat verifyNFT --user <USER_ADDRESS> --nft <NFT_CONTRACT> --network sepolia
```

## 📄 Contract Addresses (Sepolia)

### Core Contracts
- **AnonymousAuth**: `0x8E93aD33bf22CCF3e8e45C87Ff07685D920eFb34`
- **Airdrop**: `0x5109E225594b779063B4A268f4E48ed3b366694f`
- **SimpleNFT**: `0x125E65Ab721f7ee07976301aeC928319186f090E`

### Zama Infrastructure
- **ACL Contract**: `0x687820221192C5B662b25367F70076A37bc79b6c`
- **KMS Contract**: `0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC`
- **Input Verifier**: `0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4`
- **Decryption Oracle**: `0xa02Cda4Ca3a71D7C46997716F4283aa851C28812`

## 🔍 Contract APIs

### AnonymousAuth Contract

#### Core Functions
```solidity
// Register encrypted shadow address
function registerEncryptedAddress(
    externalEaddress encryptedAddress, 
    bytes calldata addressProof
) external;

// Request NFT ownership verification
function requestNFTVerification(address nftContract) 
    external returns (uint256);

// Get user registration status
function getUserRegistration(address user) 
    external view returns (UserRegistration memory);

// Check NFT verification result
function getNFTVerification(address user, address nft) 
    external view returns (bool);
```

#### Events
```solidity
event UserRegistered(address indexed user, uint256 timestamp);
event NFTVerificationRequested(address indexed user, address indexed nftContract, bytes32 verificationId);
event NFTVerificationCompleted(bytes32 indexed verificationId, bool hasNFT, address verifiedAddress);
```

### SimpleNFT Contract

#### Minting Functions
```solidity
// Mint NFT to specific address
function mint(address to) external returns (uint256);

// Mint NFT to caller
function mint() external returns (uint256);

// Get total supply
function totalSupply() external view returns (uint256);
```

### Airdrop Contract

#### Airdrop Functions
```solidity
// Record airdrop eligibility
function recordAirdrop(address nftContract) external;

// Check airdrop record
function getAirdropRecord(address user, address nftContract) 
    external view returns (AirdropInfo memory);

// Get total user airdrops
function getUserTotalAirdrops(address user) 
    external view returns (uint256);
```

## 🔒 Security Features

### FHE Encryption
- **End-to-End Encryption**: All sensitive data encrypted with FHE
- **No Trusted Setup**: Decentralized key management
- **Computational Privacy**: Perform operations on encrypted data

### Access Control
- **Permission Management**: Granular access control for encrypted data
- **Time-Based Access**: Optional time-limited permissions
- **Multi-Party Control**: Shared access to encrypted information

### Audit Trail
- **Immutable Records**: All operations recorded on blockchain
- **Verification Proofs**: Cryptographic proofs of ownership
- **Privacy Preservation**: Audit without compromising privacy

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
npm run test

# Run with coverage
npm run coverage

# Test specific functionality
npx hardhat test test/AnonymousAuth.ts --grep "registration"
```

### Integration Tests
```bash
# Test on Sepolia testnet
npm run test:sepolia

# Test frontend integration
cd app && npm run test
```

### Manual Testing
1. Deploy contracts to Sepolia
2. Start frontend development server
3. Connect wallet and test each feature
4. Verify transactions on Etherscan

## 📊 Performance Metrics

### Gas Costs (Sepolia)
- **User Registration**: ~150,000 gas
- **NFT Verification**: ~200,000 gas
- **Airdrop Recording**: ~100,000 gas
- **NFT Minting**: ~80,000 gas

### Transaction Times
- **Registration**: ~15-30 seconds
- **Verification**: ~30-60 seconds (includes decryption)
- **Airdrop**: ~15-30 seconds
- **Minting**: ~10-20 seconds

## 🛣️ Roadmap

### Phase 1 - Core Infrastructure ✅
- [x] FHE-based address registration
- [x] Anonymous NFT verification
- [x] Basic airdrop recording
- [x] Test NFT minting system

### Phase 2 - Enhanced Features 🔄
- [ ] Batch verification operations
- [ ] Advanced airdrop distribution
- [ ] Multi-chain support
- [ ] IPFS metadata integration

### Phase 3 - Ecosystem Expansion 📋
- [ ] Third-party integrations
- [ ] Mobile application
- [ ] Advanced analytics
- [ ] Governance features

### Phase 4 - Mainnet Deployment 📋
- [ ] Security audits
- [ ] Mainnet contracts
- [ ] Production frontend
- [ ] Documentation portal

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes and test thoroughly
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open Pull Request

### Code Standards
- Follow TypeScript/Solidity best practices
- Write comprehensive tests
- Update documentation
- Use conventional commit messages

## 📚 Documentation

### Developer Resources
- [Smart Contract Documentation](docs/contracts.md)
- [Frontend Development Guide](docs/frontend.md)
- [FHE Integration Guide](docs/fhe-guide.md)
- [API Reference](docs/api.md)

### Tutorials
- [Getting Started Tutorial](docs/tutorials/getting-started.md)
- [Advanced Usage Examples](docs/tutorials/advanced-usage.md)
- [Integration Patterns](docs/tutorials/integration.md)

## 🐛 Troubleshooting

### Common Issues

#### Contract Deployment Failures
```bash
# Check network connection
npx hardhat node --fork https://sepolia.infura.io/v3/YOUR_KEY

# Verify gas price
npx hardhat deploy --network sepolia --gas-price 20000000000
```

#### Frontend Connection Issues
```bash
# Clear browser cache
# Check MetaMask network (should be Sepolia)
# Verify contract addresses in config/contracts.ts
```

#### FHE Encryption Errors
```bash
# Ensure proper initialization
# Check relayer service status
# Verify input formatting
```

### Support Resources
- **GitHub Issues**: [Report bugs](https://github.com/zama-ai/fhevm/issues)
- **Discord**: [Zama Community](https://discord.gg/zama)
- **Documentation**: [FHEVM Docs](https://docs.zama.ai)

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Zama Team**: For providing the FHEVM technology
- **OpenZeppelin**: For secure smart contract libraries
- **Ethereum Foundation**: For the underlying blockchain infrastructure
- **Community Contributors**: For testing and feedback

---

**Built with ❤️ using Zama's FHE Technology**

*Empowering privacy-preserving decentralized applications*