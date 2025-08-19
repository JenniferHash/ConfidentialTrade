import { createInstance, SepoliaConfig, initSDK } from '@zama-fhe/relayer-sdk/bundle'
import type { FhevmInstance } from '@zama-fhe/relayer-sdk/bundle'

let zamaInstance: FhevmInstance | null = null
let isSDKInitialized = false

export const initializeZama = async (): Promise<FhevmInstance> => {
  if (zamaInstance) {
    return zamaInstance
  }

  try {
    // Initialize SDK first if not done already
    if (!isSDKInitialized) {
      await initSDK()
      isSDKInitialized = true
    }

    const config = {
      ...SepoliaConfig,
      network: window.ethereum,
    }
    
    zamaInstance = await createInstance(config)
    return zamaInstance
  } catch (error) {
    console.error('Failed to initialize Zama instance:', error)
    throw new Error('无法初始化Zama加密实例 / Failed to initialize Zama encryption instance')
  }
}

export const getZamaInstance = (): FhevmInstance => {
  if (!zamaInstance) {
    throw new Error('Zama instance not initialized. Call initializeZama() first.')
  }
  return zamaInstance
}

export const encryptAddress = async (
  address: string,
  contractAddress: string,
  userAddress: string
): Promise<{ encryptedAddress: `0x${string}`; inputProof: `0x${string}` }> => {
  const instance = getZamaInstance()
  
  try {
    const input = instance.createEncryptedInput(contractAddress, userAddress)
    input.addAddress(address as `0x${string}`)
    
    const encryptedInput = await input.encrypt()
    
    return {
      encryptedAddress: encryptedInput.handles[0] as `0x${string}`,
      inputProof: encryptedInput.inputProof as `0x${string}`,
    }
  } catch (error) {
    console.error('Failed to encrypt address:', error)
    throw new Error('地址加密失败 / Address encryption failed')
  }
}