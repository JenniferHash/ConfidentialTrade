import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { ANONYMOUS_AUTH_ABI } from '../types/contracts'
import { useContractAddresses } from '../hooks/useContracts'
import { isAddress } from 'viem'
import { Search, Loader2, CheckCircle, XCircle } from 'lucide-react'

export const NFTVerification = () => {
  const { address } = useAccount()
  const contractAddresses = useContractAddresses()
  const [nftContract, setNftContract] = useState('')
  const [verificationAddress, setVerificationAddress] = useState('')
  
  const { writeContract, data: hash } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Check verification result
  const { data: verificationResult } = useReadContract({
    address: contractAddresses.ANONYMOUS_AUTH,
    abi: ANONYMOUS_AUTH_ABI,
    functionName: 'getNFTVerification',
    args: verificationAddress && isAddress(verificationAddress) && isAddress(nftContract) 
      ? [verificationAddress as `0x${string}`, nftContract as `0x${string}`] 
      : undefined,
  })

  const handleRequestVerification = async () => {
    if (!isAddress(nftContract)) {
      alert('请输入有效的 NFT 合约地址 / Please enter a valid NFT contract address')
      return
    }

    try {
      writeContract({
        address: contractAddresses.ANONYMOUS_AUTH,
        abi: ANONYMOUS_AUTH_ABI,
        functionName: 'requestNFTVerification',
        args: [nftContract as `0x${string}`],
      })
    } catch (error) {
      console.error('Verification request failed:', error)
      alert('验证请求失败 / Verification request failed')
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <Search className="w-6 h-6 text-green-400" />
        <h2 className="text-xl font-semibold">NFT 验证系统 / NFT Verification System</h2>
      </div>
      
      <div className="space-y-6">
        {/* Request Verification Section */}
        <div>
          <h3 className="text-lg font-medium mb-3">请求验证 / Request Verification</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                NFT 合约地址 / NFT Contract Address
              </label>
              <input
                type="text"
                value={nftContract}
                onChange={(e) => setNftContract(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-400">
                输入要验证的 NFT 合约地址 / Enter the NFT contract address to verify
              </p>
            </div>
            
            <button
              onClick={handleRequestVerification}
              disabled={!nftContract || isConfirming}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              {isConfirming && <Loader2 className="w-4 h-4 animate-spin" />}
              {isConfirming ? '请求中...' : '请求 NFT 验证'}
            </button>
          </div>
        </div>

        {/* Check Verification Result Section */}
        <div className="border-t border-gray-700 pt-6">
          <h3 className="text-lg font-medium mb-3">查询验证结果 / Check Verification Result</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                用户地址 / User Address
              </label>
              <input
                type="text"
                value={verificationAddress}
                onChange={(e) => setVerificationAddress(e.target.value)}
                placeholder="0x... (留空使用当前钱包地址)"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-400">
                输入要查询的用户地址，留空使用当前连接的钱包地址
              </p>
            </div>
            
            {verificationResult !== undefined && isAddress(nftContract) && (
              <div className={`p-3 rounded-md border ${
                verificationResult 
                  ? 'bg-green-900/20 border-green-700' 
                  : 'bg-red-900/20 border-red-700'
              }`}>
                <div className="flex items-center gap-2">
                  {verificationResult ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    verificationResult ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {verificationResult ? '✅ 验证通过' : '❌ 未通过验证'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {verificationResult 
                    ? '该地址拥有指定 NFT / This address owns the specified NFT'
                    : '该地址不拥有指定 NFT / This address does not own the specified NFT'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {isSuccess && (
          <div className="p-3 bg-green-900/20 border border-green-700 rounded-md">
            <p className="text-green-400 text-sm">
              ✅ 验证请求已提交! 请等待 FHE 解密完成 / Verification request submitted! Please wait for FHE decryption to complete
            </p>
          </div>
        )}
        
        <div className="bg-gray-900 p-3 rounded-md">
          <h3 className="text-sm font-medium text-gray-300 mb-2">工作原理 / How it works:</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• 系统使用 FHE.requestDecryption 解密您的影子地址</li>
            <li>• 验证解密后的地址是否拥有指定的 NFT</li>
            <li>• 验证结果将被记录在链上，用于后续的空投领取</li>
            <li>• System uses FHE.requestDecryption to decrypt your shadow address</li>
            <li>• Verifies if the decrypted address owns the specified NFT</li>
            <li>• Results are recorded on-chain for future airdrop claiming</li>
          </ul>
        </div>
      </div>
    </div>
  )
}