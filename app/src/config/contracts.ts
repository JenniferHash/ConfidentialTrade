import { sepolia } from 'wagmi/chains'

export const getContractAddresses = (chainId: number) => {
  switch (chainId) {
    case sepolia.id:
      return {
        ANONYMOUS_AUTH: '0x251E596994bf85992341Ff1bbd6E9643c6671fa0' as `0x${string}`,
        AIRDROP: '0xC5cfd4262F96dADb9fCD894074bB273Ac0CAc898' as `0x${string}`,
      }
    case 31337: // localhost
      return {
        ANONYMOUS_AUTH: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as `0x${string}`, // Common localhost address
        AIRDROP: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' as `0x${string}`,         // Common localhost address
      }
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`)
  }
}

export const SUPPORTED_CHAINS = [sepolia.id, 31337] as const