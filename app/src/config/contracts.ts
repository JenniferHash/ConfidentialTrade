// Contract addresses - Deployed on Sepolia testnet
export const CONTRACT_ADDRESSES = {
  ANONYMOUS_AUTH: '0x251E596994bf85992341Ff1bbd6E9643c6671fa0',
  AIRDROP: '0xC5cfd4262F96dADb9fCD894074bB273Ac0CAc898',
} as const;

// Sepolia configuration for FHEVM
export const SEPOLIA_CONFIG = {
  aclContractAddress: '0x687820221192C5B662b25367F70076A37bc79b6c',
  kmsContractAddress: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC',
  inputVerifierContractAddress: '0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4',
  verifyingContractAddressDecryption: '0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1',
  verifyingContractAddressInputVerification: '0x7048C39f048125eDa9d678AEbaDfB22F7900a29F',
  chainId: 11155111,
  gatewayChainId: 55815,
  network: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY', // Update with your Infura key
  relayerUrl: 'https://relayer.testnet.zama.cloud',
};

// Contract ABIs - Simplified for the main functions
export const ANONYMOUS_AUTH_ABI = [
  {
    inputs: [
      { name: 'encryptedAddress', type: 'bytes32', internalType: 'externalEaddress' },
      { name: 'addressProof', type: 'bytes' }
    ],
    name: 'registerEncryptedAddress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'nftContract', type: 'address' }],
    name: 'requestNFTVerification',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserRegistration',
    outputs: [
      { name: '', type: 'bool' },
      { name: '', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'nft', type: 'address' }
    ],
    name: 'getNFTVerification',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

export const AIRDROP_ABI = [
  {
    inputs: [{ name: 'nftContract', type: 'address' }],
    name: 'recordAirdrop',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'nftContract', type: 'address' }
    ],
    name: 'getAirdropRecord',
    outputs: [{
      components: [
        { name: 'nftContract', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'claimed', type: 'bool' },
        { name: 'timestamp', type: 'uint256' }
      ],
      name: '',
      type: 'tuple'
    }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserTotalAirdrops',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'nftContract', type: 'address' }
    ],
    name: 'hasUnclaimedAirdrop',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;