import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { isAddress } from 'viem';
import toast from 'react-hot-toast';
import { CONTRACT_ADDRESSES, CONFIDENTIAL_TRADE_ABI } from '../config/contracts';

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
    symbol: 'DOGE',
    name: 'Doge',
    icon: '🐶',
    address: '0x0000000000000000000000000000000000000004',
    decimals: 18,
    color: 'from-yellow-400 to-orange-400'
  }
];

export const WithdrawPage = () => {
  const { address } = useAccount();
  const [proxyAddress, setProxyAddress] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState<Record<string, boolean>>({});

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

  // Withdraw transaction
  const { writeContract: withdrawToken, data: withdrawHash, isPending: isWithdrawPending } = useWriteContract();
  
  const { isLoading: isWithdrawLoading } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  const handleWithdraw = async (token: Token) => {
    if (!proxyAddress || !isAddress(proxyAddress)) {
      toast.error('Please enter a valid proxy address');
      return;
    }

    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsWithdrawing(prev => ({ ...prev, [token.address]: true }));
    
    try {
      await withdrawToken({
        address: CONTRACT_ADDRESSES.CONFIDENTIAL_TRADE as `0x${string}`,
        abi: CONFIDENTIAL_TRADE_ABI,
        functionName: 'decryptWithdrawToken',
        args: [address as `0x${string}`, token.address as `0x${string}`],
      });
      
      toast.success(`${token.symbol} withdrawal initiated to proxy address`);
    } catch (error) {
      console.error('Withdrawal failed:', error);
      toast.error(`Failed to withdraw ${token.symbol}`);
    } finally {
      setIsWithdrawing(prev => ({ ...prev, [token.address]: false }));
    }
  };

  const isValidProxyAddress = proxyAddress && isAddress(proxyAddress);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">Withdraw</h1>
        <p className="text-gray-400 text-sm">Transfer tokens to your proxy address</p>
      </div>

      {/* Status Bar */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            registrationData?.isRegistered ? 'bg-green-400' : 'bg-red-400'
          }`}></div>
          <span className="text-sm text-gray-300">
            {registrationData?.isRegistered ? 'Registered' : 'Not Registered'}
          </span>
        </div>
      </div>

      {/* Proxy Address Input */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-4">Proxy Address</h2>
        <div className="space-y-2">
          <label className="text-sm text-gray-400">
            Enter the proxy address to receive withdrawn tokens
          </label>
          <input
            type="text"
            value={proxyAddress}
            onChange={(e) => setProxyAddress(e.target.value)}
            placeholder="0x..."
            className="w-full bg-black/30 border border-white/20 rounded-lg p-3 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
          />
          {proxyAddress && !isValidProxyAddress && (
            <p className="text-red-400 text-sm">Please enter a valid Ethereum address</p>
          )}
        </div>
      </div>

      {/* Token List */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-semibold text-white">Available Tokens</h2>
        </div>
        
        <div className="divide-y divide-white/10">
          {TOKENS.map((token) => (
            <TokenWithdrawItem
              key={token.symbol}
              token={token}
              userAddress={address!}
              onWithdraw={() => handleWithdraw(token)}
              isWithdrawing={isWithdrawing[token.address] || isWithdrawPending || isWithdrawLoading}
              canWithdraw={!!registrationData?.isRegistered && isValidProxyAddress}
            />
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
        <h3 className="font-semibold text-blue-400 mb-2">How to withdraw</h3>
        <div className="text-blue-400/80 text-sm space-y-1">
          <p>1. Make sure you are registered with a proxy address</p>
          <p>2. Enter your proxy address above</p>
          <p>3. Click withdraw on any token with a balance</p>
          <p>4. Connect with your proxy wallet to access withdrawn tokens</p>
        </div>
      </div>
    </div>
  );
};

// Token Withdraw Item Component
interface TokenWithdrawItemProps {
  token: Token;
  userAddress: string;
  onWithdraw: () => void;
  isWithdrawing: boolean;
  canWithdraw: boolean;
}

const TokenWithdrawItem = ({ token, userAddress, onWithdraw, isWithdrawing, canWithdraw }: TokenWithdrawItemProps) => {
  // Get user balance for this token
  const { data: userBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.CONFIDENTIAL_TRADE as `0x${string}`,
    abi: CONFIDENTIAL_TRADE_ABI,
    functionName: 'getUserBalance',
    args: [userAddress as `0x${string}`, token.address as `0x${string}`],
    query: {
      enabled: !!userAddress
    }
  });

  // Get token price
  const { data: tokenPrice } = useReadContract({
    address: CONTRACT_ADDRESSES.CONFIDENTIAL_TRADE as `0x${string}`,
    abi: CONFIDENTIAL_TRADE_ABI,
    functionName: 'getTokenPrice',
    args: [token.address as `0x${string}`],
  });

  const userBalanceNum = userBalance ? Number(userBalance) / 1e18 : 0;
  const priceNum = tokenPrice ? Number(tokenPrice) / 1e6 : 0;
  const totalValue = userBalanceNum * priceNum;
  const hasBalance = userBalanceNum > 0;

  return (
    <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
      {/* Token Info */}
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${token.color} flex items-center justify-center text-lg`}>
          {token.icon}
        </div>
        <div>
          <div className="font-semibold text-white">{token.symbol}</div>
          <div className="text-sm text-gray-400">{token.name}</div>
        </div>
      </div>

      {/* Balance & Value */}
      <div className="flex items-center space-x-6">
        <div className="text-right">
          <div className="font-semibold text-white">
            {userBalanceNum < 1 ? userBalanceNum.toFixed(6) : userBalanceNum.toFixed(4)}
          </div>
          <div className="text-sm text-gray-400">
            ${totalValue.toFixed(2)}
          </div>
        </div>

        {/* Price */}
        <div className="text-right min-w-[80px]">
          <div className="font-semibold text-white">
            ${priceNum.toFixed(4)}
          </div>
          <div className="text-sm text-gray-400">
            Price
          </div>
        </div>

        {/* Withdraw Button */}
        {hasBalance && (
          <button
            onClick={onWithdraw}
            disabled={!canWithdraw || isWithdrawing}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors min-w-[100px] ${
              !canWithdraw || isWithdrawing
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
            }`}
          >
            {isWithdrawing ? (
              <div className="flex items-center justify-center space-x-1">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>...</span>
              </div>
            ) : !canWithdraw ? (
              'Setup Required'
            ) : (
              'Withdraw'
            )}
          </button>
        )}
        
        {/* Placeholder for tokens without balance */}
        {!hasBalance && (
          <div className="min-w-[100px] text-center">
            <span className="text-sm text-gray-500">No Balance</span>
          </div>
        )}
      </div>
    </div>
  );
};