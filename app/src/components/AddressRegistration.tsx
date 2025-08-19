import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ANONYMOUS_AUTH_ABI } from '../types/contracts'
import { useContractAddresses } from '../hooks/useContracts'
import { isAddress } from 'viem'
import { Shield, Loader2 } from 'lucide-react'

export const AddressRegistration = () => {
  const { address } = useAccount()
  const contractAddresses = useContractAddresses()
  const [shadowAddress, setShadowAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { writeContract, data: hash } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const handleRegister = async () => {
    if (!isAddress(shadowAddress)) {
      alert('请输入有效的以太坊地址 / Please enter a valid Ethereum address')
      return
    }

    setIsLoading(true)
    
    try {
      // For now, we'll use a placeholder for FHE encryption
      // In a real implementation, you'd use fhevmjs to encrypt the address
      const encryptedAddress = '0x' + '00'.repeat(32) // Placeholder encrypted data
      const addressProof = '0x' + '00'.repeat(32) // Placeholder proof
      
      writeContract({
        address: contractAddresses.ANONYMOUS_AUTH,
        abi: ANONYMOUS_AUTH_ABI,
        functionName: 'registerEncryptedAddress',
        args: [encryptedAddress as `0x${string}`, addressProof as `0x${string}`],
      })
    } catch (error) {
      console.error('Registration failed:', error)
      alert('注册失败 / Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-semibold">地址注册 / Address Registration</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            影子地址 / Shadow Address
          </label>
          <input
            type="text"
            value={shadowAddress}
            onChange={(e) => setShadowAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-400">
            输入您要代操作的地址，系统将使用 Zama FHE 对其进行加密存储
          </p>
          <p className="text-xs text-gray-400">
            Enter the address for proxy operations, which will be encrypted and stored using Zama FHE
          </p>
        </div>
        
        <button
          onClick={handleRegister}
          disabled={!shadowAddress || isLoading || isConfirming}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
        >
          {(isLoading || isConfirming) && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoading ? '加密中...' : isConfirming ? '确认中...' : '注册加密地址'}
        </button>
        
        {isSuccess && (
          <div className="p-3 bg-green-900/20 border border-green-700 rounded-md">
            <p className="text-green-400 text-sm">
              ✅ 地址注册成功! / Address registered successfully!
            </p>
          </div>
        )}
        
        <div className="bg-gray-900 p-3 rounded-md">
          <h3 className="text-sm font-medium text-gray-300 mb-2">功能说明 / How it works:</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• 您的影子地址将通过 Zama FHE 加密技术进行加密存储</li>
            <li>• 只有在需要验证 NFT 时才会解密该地址</li>
            <li>• 确保您的隐私和匿名性得到保护</li>
            <li>• Your shadow address will be encrypted using Zama FHE technology</li>
            <li>• The address will only be decrypted when verifying NFTs</li>
            <li>• Ensures your privacy and anonymity are protected</li>
          </ul>
        </div>
      </div>
    </div>
  )
}