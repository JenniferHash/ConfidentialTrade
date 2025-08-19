import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { AddressRegistration } from './components/AddressRegistration'
import { NFTVerification } from './components/NFTVerification'
import { AirdropClaiming } from './components/AirdropClaiming'
import { UserStatus } from './components/UserStatus'

function App() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            匿名影子操作系统
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Anonymous Shadow Operating System
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </header>

        {isConnected ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <UserStatus />
            
            <div className="grid md:grid-cols-1 gap-8">
              <div className="space-y-8">
                <AddressRegistration />
                <NFTVerification />
                <AirdropClaiming />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold mb-4">开始使用</h2>
              <p className="text-gray-300 mb-6">
                连接您的钱包以开始使用匿名影子操作系统
              </p>
              <p className="text-sm text-gray-400">
                Connect your wallet to start using the Anonymous Shadow Operating System
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App