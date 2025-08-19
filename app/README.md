# Confidential Identity Frontend

This is the frontend application for the Anonymous Shadow Operating System, built with React, TypeScript, Vite, and integrating Zama's FHE technology.

## Features

- **Anonymous Address Registration**: Register encrypted shadow addresses using Zama FHE
- **NFT Verification**: Verify NFT ownership anonymously without revealing the shadow address
- **Airdrop Claiming**: Record airdrop eligibility based on verified NFT ownership
- **Wallet Integration**: Connect with various wallets using RainbowKit
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Wallet Connection**: RainbowKit + Wagmi
- **FHE Integration**: Zama Relayer SDK
- **State Management**: TanStack Query (React Query)
- **Notifications**: React Hot Toast

## Setup Instructions

### Prerequisites

- Node.js >= 20
- npm >= 7.0.0

### Installation

1. Navigate to the app directory:
   ```bash
   cd app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update configuration:
   - Edit `src/config/contracts.ts` with your deployed contract addresses
   - Update the WalletConnect project ID in `src/config/wagmi.ts`
   - Update the Infura API key in `src/config/contracts.ts`

### Development

Start the development server:
```bash
npm run dev
```

### Build

Build for production:
```bash
npm run build
```

### Lint

Run linting:
```bash
npm run lint
```

## Project Structure

```
src/
├── components/          # React components
│   ├── AddressRegistration.tsx
│   ├── NFTVerification.tsx
│   ├── AirdropClaiming.tsx
│   ├── Dashboard.tsx
│   └── Header.tsx
├── config/             # Configuration files
│   ├── contracts.ts    # Contract addresses and ABIs
│   └── wagmi.ts       # Wallet configuration
├── hooks/             # Custom React hooks
│   └── useFhevmInstance.ts
├── types/             # TypeScript type definitions
│   └── index.ts
├── utils/             # Utility functions
│   └── encryption.ts  # FHE encryption utilities
├── App.tsx            # Main App component
├── App.css           # Global styles
└── main.tsx          # Entry point
```

## How It Works

### 1. Address Registration
- Users register a "shadow address" that will be encrypted using Zama's FHE
- The encrypted address is stored on-chain but remains confidential
- Only the user and authorized contracts can access it

### 2. NFT Verification
- Users can verify NFT ownership using their encrypted shadow address
- The system decrypts the address off-chain securely
- Verification results are stored on-chain without revealing the shadow address

### 3. Airdrop Claiming
- Users can record their eligibility for airdrops based on verified NFT ownership
- The process remains anonymous throughout
- Airdrop records are stored for future distribution

## Configuration

### Contract Addresses

Update the contract addresses in `src/config/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  ANONYMOUS_AUTH: '0xYOUR_ANONYMOUS_AUTH_CONTRACT',
  AIRDROP: '0xYOUR_AIRDROP_CONTRACT',
};
```

### Wallet Configuration

Set your WalletConnect project ID in `src/config/wagmi.ts`:

```typescript
projectId: 'YOUR_WALLETCONNECT_PROJECT_ID'
```

### Network Configuration

Update the Infura API key in `src/config/contracts.ts`:

```typescript
network: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY'
```

## Security Considerations

- Always verify contract addresses before deployment
- Never commit private keys or sensitive API keys to version control
- Ensure proper validation of user inputs
- Test thoroughly on testnets before mainnet deployment

## Troubleshooting

### Common Issues

1. **FHEVM SDK not loaded**: Ensure the script tag is included in `index.html`
2. **Contract not found**: Verify contract addresses are correct and deployed
3. **Wallet connection issues**: Check WalletConnect project ID configuration
4. **Network errors**: Verify Infura API key and network configuration

### Development Tips

- Use browser dev tools to monitor network requests and errors
- Check the console for detailed error messages
- Verify wallet is connected to the correct network (Sepolia)
- Ensure contracts are deployed and accessible

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the same license as the parent project.