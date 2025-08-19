import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { AIRDROP_ABI } from '../types/contracts'
import { useContractAddresses } from '../hooks/useContracts'
import { isAddress, formatEther } from 'viem'
import { Gift, Loader2, Coins } from 'lucide-react'

export const AirdropClaiming = () => {
  const { address } = useAccount()
  const contractAddresses = useContractAddresses()
  const [nftContract, setNftContract] = useState('')
  const [queryAddress, setQueryAddress] = useState('')
  
  const { writeContract, data: hash } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Get user's total airdrops
  const { data: totalAirdrops } = useReadContract({
    address: contractAddresses.AIRDROP,
    abi: AIRDROP_ABI,
    functionName: 'getUserTotalAirdrops',
    args: address ? [address] : undefined,
  })

  // Check specific airdrop record
  const { data: airdropRecord } = useReadContract({
    address: contractAddresses.AIRDROP,
    abi: AIRDROP_ABI,
    functionName: 'getAirdropRecord',
    args: queryAddress && isAddress(queryAddress) && isAddress(nftContract) 
      ? [queryAddress as `0x${string}`, nftContract as `0x${string}`] 
      : undefined,
  })

  // Check if user has unclaimed airdrop
  const { data: hasUnclaimedAirdrop } = useReadContract({
    address: contractAddresses.AIRDROP,
    abi: AIRDROP_ABI,
    functionName: 'hasUnclaimedAirdrop',
    args: address && isAddress(nftContract) 
      ? [address, nftContract as `0x${string}`] 
      : undefined,
  })

  const handleRecordAirdrop = async () => {
    if (!isAddress(nftContract)) {
      alert('请输入有效的 NFT 合约地址 / Please enter a valid NFT contract address')
      return
    }

    try {
      writeContract({
        address: contractAddresses.AIRDROP,
        abi: AIRDROP_ABI,
        functionName: 'recordAirdrop',
        args: [nftContract as `0x${string}`],
      })
    } catch (error) {
      console.error('Airdrop recording failed:', error)
      alert('空投记录失败 / Airdrop recording failed')
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <Gift className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-semibold">空投领取 / Airdrop Claiming</h2>
      </div>
      
      <div className="space-y-6">
        {/* User's Total Airdrops */}
        {address && totalAirdrops !== undefined && (
          <div className="bg-purple-900/20 border border-purple-700 rounded-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-medium text-purple-400">我的总空投 / My Total Airdrops</h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatEther(totalAirdrops)} 代币
            </p>
            <p className="text-sm text-gray-400">
              Total tokens available for claiming
            </p>
          </div>
        )}

        {/* Record Airdrop Section */}
        <div>
          <h3 className="text-lg font-medium mb-3">记录空投 / Record Airdrop</h3>
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
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-400">
                输入已验证的 NFT 合约地址来记录空投资格
              </p>
              <p className="text-xs text-gray-400">
                Enter verified NFT contract address to record airdrop eligibility
              </p>
            </div>
            
            {hasUnclaimedAirdrop !== undefined && isAddress(nftContract) && (
              <div className={`p-3 rounded-md border ${
                hasUnclaimedAirdrop 
                  ? 'bg-green-900/20 border-green-700' 
                  : 'bg-yellow-900/20 border-yellow-700'
              }`}>
                <p className={`text-sm font-medium ${
                  hasUnclaimedAirdrop ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {hasUnclaimedAirdrop 
                    ? '✅ 您有未领取的空投!' 
                    : '⚠️ 暂无可领取的空投'
                  }
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {hasUnclaimedAirdrop
                    ? 'You have unclaimed airdrops available!'
                    : 'No unclaimed airdrops available'
                  }
                </p>
              </div>
            )}
            
            <button
              onClick={handleRecordAirdrop}
              disabled={!nftContract || isConfirming}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              {isConfirming && <Loader2 className="w-4 h-4 animate-spin" />}
              {isConfirming ? '记录中...' : '记录空投'}
            </button>
          </div>
        </div>

        {/* Query Airdrop Record Section */}
        <div className="border-t border-gray-700 pt-6">
          <h3 className="text-lg font-medium mb-3">查询空投记录 / Query Airdrop Record</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                用户地址 / User Address
              </label>
              <input
                type="text"
                value={queryAddress}
                onChange={(e) => setQueryAddress(e.target.value)}
                placeholder="0x... (留空使用当前钱包地址)"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-400">
                输入要查询的用户地址，留空使用当前连接的钱包地址
              </p>
            </div>
            
            {airdropRecord && airdropRecord[1] > 0n && (
              <div className="bg-gray-900 p-4 rounded-md">
                <h4 className="text-sm font-medium text-gray-300 mb-2">空投记录详情 / Airdrop Record Details:</h4>
                <div className="space-y-1 text-sm text-gray-400">
                  <p>NFT 合约 / NFT Contract: {airdropRecord[0]}</p>
                  <p>空投数量 / Amount: {formatEther(airdropRecord[1])} 代币</p>
                  <p>是否已领取 / Claimed: {airdropRecord[2] ? '✅ 是' : '❌ 否'}</p>
                  <p>记录时间 / Timestamp: {new Date(Number(airdropRecord[3]) * 1000).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {isSuccess && (
          <div className="p-3 bg-green-900/20 border border-green-700 rounded-md">
            <p className="text-green-400 text-sm">
              ✅ 空投记录成功! / Airdrop recorded successfully!
            </p>
          </div>
        )}
        
        <div className="bg-gray-900 p-3 rounded-md">
          <h3 className="text-sm font-medium text-gray-300 mb-2">空投说明 / Airdrop Information:</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• 只有通过 NFT 验证的用户才能记录空投</li>
            <li>• 每个 NFT 合约每个用户只能记录一次空投</li>
            <li>• 空投将记录在链上，但实际分发将在未来实现</li>
            <li>• 当前空投金额为 1000 代币 (1000 * 10^18 wei)</li>
            <li>• Only users who pass NFT verification can record airdrops</li>
            <li>• Each user can only record one airdrop per NFT contract</li>
            <li>• Airdrops are recorded on-chain, but actual distribution will be implemented in the future</li>
            <li>• Current airdrop amount is 1000 tokens (1000 * 10^18 wei)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}