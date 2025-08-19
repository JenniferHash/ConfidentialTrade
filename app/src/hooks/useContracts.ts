import { useChainId } from 'wagmi'
import { getContractAddresses } from '../config/contracts'

export const useContractAddresses = () => {
  const chainId = useChainId()
  
  try {
    return getContractAddresses(chainId)
  } catch (error) {
    console.warn(`Unsupported chain ID: ${chainId}, falling back to localhost addresses`)
    return getContractAddresses(31337) // fallback to localhost
  }
}