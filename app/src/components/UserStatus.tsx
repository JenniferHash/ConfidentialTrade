import { useAccount, useReadContract } from 'wagmi'
import { ANONYMOUS_AUTH_ABI } from '../types/contracts'
import { useContractAddresses } from '../hooks/useContracts'
import { CheckCircle, Clock, XCircle } from 'lucide-react'

export const UserStatus = () => {
  const { address } = useAccount()
  const contractAddresses = useContractAddresses()

  const { data: registrationData, isLoading } = useReadContract({
    address: contractAddresses.ANONYMOUS_AUTH,
    abi: ANONYMOUS_AUTH_ABI,
    functionName: 'getUserRegistration',
    args: address ? [address] : undefined,
  })

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-400 animate-spin" />
          <span className="text-gray-300">检查注册状态...</span>
        </div>
      </div>
    )
  }

  const [isRegistered, registrationTime] = registrationData || [false, 0n]

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-semibold mb-4">用户状态 / User Status</h2>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {isRegistered ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400" />
          )}
          <span className="text-gray-300">
            注册状态: {isRegistered ? '已注册' : '未注册'} / 
            Registration Status: {isRegistered ? 'Registered' : 'Not Registered'}
          </span>
        </div>
        
        {isRegistered && registrationTime > 0n && (
          <div className="text-sm text-gray-400">
            注册时间 / Registration Time: {new Date(Number(registrationTime) * 1000).toLocaleString()}
          </div>
        )}
        
        <div className="text-sm text-gray-400">
          钱包地址 / Wallet Address: {address}
        </div>
      </div>
    </div>
  )
}