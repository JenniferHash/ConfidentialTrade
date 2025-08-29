import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import toast from 'react-hot-toast';
import { CONTRACT_ADDRESSES, CONFIDENTIAL_TRADE_ABI, MOCK_USDT_ABI } from '../config/contracts';

interface Token {
  symbol: string;
  name: string;
  icon: string;
  address: string;
  decimals: number;
  color: string;
}

const TOKENS: Token[] = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: '⟡',
    address: '0x0000000000000000000000000000000000000001',
    decimals: 18,
    color: 'from-blue-400 to-cyan-400'
  },
  {
    symbol: 'ZAMA',
    name: 'Zama',
    icon: '⬢',
    address: '0x0000000000000000000000000000000000000002',
    decimals: 18,
    color: 'from-green-400 to-emerald-400'
  },
  {
    symbol: 'UNI',
    name: 'Uniswap',
    icon: '◈',
    address: '0x0000000000000000000000000000000000000003',
    decimals: 18,
    color: 'from-pink-400 to-purple-400'
  },
  {
    symbol: 'PEPE',
    name: 'Pepe',
    icon: '🐸',
    address: '0x0000000000000000000000000000000000000004',
    decimals: 18,
    color: 'from-yellow-400 to-orange-400'
  }
];

export const TokenPurchase = () => {
  const { address } = useAccount();
  const [selectedToken, setSelectedToken] = useState<Token>(TOKENS[0]);
  const [buyAmount, setBuyAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get token price
  const { data: tokenPrice } = useReadContract({
    address: CONTRACT_ADDRESSES.CONFIDENTIAL_TRADE as `0x${string}`,
    abi: CONFIDENTIAL_TRADE_ABI,
    functionName: 'getTokenPrice',
    args: [selectedToken.address],
    query: {
      enabled: !!selectedToken.address
    }
  });

  // Get user's USDT balance
  const { data: usdtBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.MOCK_USDT as `0x${string}`,
    abi: MOCK_USDT_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: !!address
    }
  });

  // Get user registration status
  const { data: registrationData } = useReadContract({
    address: CONTRACT_ADDRESSES.CONFIDENTIAL_TRADE as `0x${string}`,
    abi: CONFIDENTIAL_TRADE_ABI,
    functionName: 'getUserRegistration',
    args: [address!],
    query: {
      enabled: !!address
    }
  });

  // Purchase transaction
  const { writeContract: purchaseToken, data: purchaseHash, isPending: isPurchasePending } = useWriteContract();
  
  const { isLoading: isPurchaseLoading } = useWaitForTransactionReceipt({
    hash: purchaseHash,
  });

  const handlePurchase = async () => {
    if (!buyAmount || !tokenPrice || parseFloat(buyAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!registrationData?.isRegistered) {
      toast.error('Please register your proxy address first');
      return;
    }

    const amount = parseFloat(buyAmount);
    const totalCost = Number(tokenPrice) * amount;
    
    if (usdtBalance && totalCost > Number(usdtBalance)) {
      toast.error('Insufficient USDT balance');
      return;
    }

    setIsLoading(true);
    try {
      await purchaseToken({
        address: CONTRACT_ADDRESSES.CONFIDENTIAL_TRADE as `0x${string}`,
        abi: CONFIDENTIAL_TRADE_ABI,
        functionName: 'anonymousPurchase',
        args: [selectedToken.address, parseUnits(buyAmount, 0)],
      });
      toast.success(`Purchase initiated for ${buyAmount} ${selectedToken.symbol}`);
      setBuyAmount('');
    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error('Purchase failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculatedCost = buyAmount && tokenPrice ? 
    (parseFloat(buyAmount) * Number(tokenPrice) / 1e6).toFixed(6) : '0.000000';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-2 h-8 bg-gradient-to-b from-cyan-400 to-magenta-400 rounded-full"></div>
          <h2 className="text-3xl font-cyber font-bold text-cyan-400">
            ANONYMOUS TOKEN PURCHASE
          </h2>
          <div className="w-2 h-8 bg-gradient-to-b from-magenta-400 to-cyan-400 rounded-full"></div>
        </div>
        <p className="text-gray-300 font-mono text-sm">
          Purchase tokens using USDT • Stored in encrypted treasury • Anonymous operations enabled
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Token Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-cyber p-6">
            <h3 className="text-xl font-cyber font-bold text-cyan-400 mb-6 flex items-center">
              <span className="mr-3">⚡</span>
              SELECT TOKEN
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {TOKENS.map((token) => (
                <div
                  key={token.symbol}
                  onClick={() => setSelectedToken(token)}
                  className={`relative p-6 rounded-lg cursor-pointer transition-all duration-300 border-2 ${
                    selectedToken.symbol === token.symbol
                      ? 'border-cyan-400 bg-cyan-400/10 scale-105'
                      : 'border-gray-600 hover:border-cyan-500/50 hover:scale-102'
                  }`}
                >
                  {/* Selection indicator */}
                  {selectedToken.symbol === token.symbol && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-black text-sm font-bold">✓</span>
                    </div>
                  )}
                  
                  <div className="text-center space-y-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${token.color} flex items-center justify-center text-2xl font-bold mx-auto animate-pulse`}>
                      {token.icon}
                    </div>
                    <div>
                      <div className="font-cyber font-bold text-lg text-cyan-400">
                        {token.symbol}
                      </div>
                      <div className="text-sm text-gray-400 font-mono">
                        {token.name}
                      </div>
                    </div>
                    
                    {/* Price display */}
                    <div className="text-xs font-mono">
                      <span className="text-gray-500">Price: </span>
                      <span className="text-yellow-400">
                        {tokenPrice ? `${(Number(tokenPrice) / 1e6).toFixed(6)} USDT` : 'Loading...'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Purchase Form */}
          <div className="card-cyber p-6">
            <h3 className="text-xl font-cyber font-bold text-cyan-400 mb-6 flex items-center">
              <span className="mr-3">💳</span>
              PURCHASE DETAILS
            </h3>
            
            <div className="space-y-6">
              {/* Amount Input */}
              <div className="space-y-3">
                <label className="block text-sm font-mono text-gray-300">
                  Purchase Amount ({selectedToken.symbol})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-black/50 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                    min="0"
                    step="0.000001"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400 font-cyber text-sm">
                    {selectedToken.symbol}
                  </div>
                </div>
              </div>

              {/* Cost Calculation */}
              <div className="glass-strong rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center font-mono text-sm">
                  <span className="text-gray-400">Unit Price:</span>
                  <span className="text-yellow-400">
                    {tokenPrice ? `${(Number(tokenPrice) / 1e6).toFixed(6)} USDT` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center font-mono text-sm">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-cyan-400">{buyAmount || '0'} {selectedToken.symbol}</span>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                <div className="flex justify-between items-center font-cyber">
                  <span className="text-white">Total Cost:</span>
                  <span className="text-neon-gold text-lg">{calculatedCost} USDT</span>
                </div>
              </div>

              {/* Purchase Button */}
              <button
                onClick={handlePurchase}
                disabled={isLoading || isPurchasePending || isPurchaseLoading || !registrationData?.isRegistered}
                className="w-full btn-primary py-4 text-lg font-cyber font-bold disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                {isLoading || isPurchasePending || isPurchaseLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>PROCESSING...</span>
                  </div>
                ) : !registrationData?.isRegistered ? (
                  'REGISTER PROXY ADDRESS FIRST'
                ) : (
                  <>
                    <span className="relative z-10">EXECUTE ANONYMOUS PURCHASE</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-magenta-400/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Account Info Sidebar */}
        <div className="space-y-6">
          {/* Registration Status */}
          <div className="card-cyber p-6">
            <h3 className="text-lg font-cyber font-bold text-cyan-400 mb-4 flex items-center">
              <span className="mr-2">🛡️</span>
              STATUS
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-mono text-sm">Registration:</span>
                <div className={`px-3 py-1 rounded-full text-xs font-mono ${
                  registrationData?.isRegistered 
                    ? 'bg-green-400/20 text-green-400 border border-green-400/30' 
                    : 'bg-red-400/20 text-red-400 border border-red-400/30'
                }`}>
                  {registrationData?.isRegistered ? 'ACTIVE' : 'INACTIVE'}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-mono text-sm">USDT Balance:</span>
                <span className="text-yellow-400 font-mono">
                  {usdtBalance ? `${(Number(usdtBalance) / 1e6).toFixed(6)}` : '0.000000'}
                </span>
              </div>
            </div>
          </div>

          {/* Selected Token Info */}
          <div className="card-cyber p-6">
            <h3 className="text-lg font-cyber font-bold text-cyan-400 mb-4 flex items-center">
              <span className="mr-2">📊</span>
              TOKEN INFO
            </h3>
            
            <div className="text-center space-y-4">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${selectedToken.color} flex items-center justify-center text-3xl font-bold mx-auto animate-pulse`}>
                {selectedToken.icon}
              </div>
              
              <div>
                <div className="font-cyber font-bold text-xl text-cyan-400">
                  {selectedToken.symbol}
                </div>
                <div className="text-sm text-gray-400 font-mono">
                  {selectedToken.name}
                </div>
              </div>
              
              <div className="glass-strong rounded-lg p-3">
                <div className="text-xs text-gray-400 font-mono uppercase">Current Price</div>
                <div className="text-lg font-cyber font-bold text-neon-gold">
                  {tokenPrice ? `${(Number(tokenPrice) / 1e6).toFixed(6)} USDT` : 'Loading...'}
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="card-cyber p-4 border border-yellow-500/30 bg-yellow-400/5">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 border border-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-yellow-400 text-sm">!</span>
              </div>
              <div className="text-yellow-400 font-mono text-xs leading-relaxed">
                <div className="font-bold mb-1">SECURITY NOTICE:</div>
                Purchased tokens are stored in your encrypted treasury and associated with your anonymous proxy address. Use the Reveal function to enable withdrawal.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};