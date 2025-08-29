import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
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

export const AssetsPage = () => {
  const { address } = useAccount();
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

  // Get decrypted proxy address
  const { data: decryptedProxyAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.CONFIDENTIAL_TRADE as `0x${string}`,
    abi: CONFIDENTIAL_TRADE_ABI,
    functionName: 'decryptedProxyAddresses',
    args: [address!],
    query: {
      enabled: !!address
    }
  });

  // Get USDT balance
  const { data: usdtBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.MOCK_USDT as `0x${string}`,
    abi: MOCK_USDT_ABI,
    functionName: 'balanceOf',
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
    if (!decryptedProxyAddress || decryptedProxyAddress === '0x0000000000000000000000000000000000000000') {
      toast.error('Please reveal your proxy address first');
      return;
    }

    setIsWithdrawing(prev => ({ ...prev, [token.address]: true }));
    
    try {
      await withdrawToken({
        address: CONTRACT_ADDRESSES.CONFIDENTIAL_TRADE as `0x${string}`,
        abi: CONFIDENTIAL_TRADE_ABI,
        functionName: 'decryptWithdrawToken',
        args: [address!, token.address],
      });
      
      toast.success(`${token.symbol} withdrawal initiated`);
    } catch (error) {
      console.error('Withdrawal failed:', error);
      toast.error(`Failed to withdraw ${token.symbol}`);
    } finally {
      setIsWithdrawing(prev => ({ ...prev, [token.address]: false }));
    }
  };

  const isRevealed = decryptedProxyAddress && decryptedProxyAddress !== '0x0000000000000000000000000000000000000000';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-2 h-8 bg-gradient-to-b from-cyan-400 to-magenta-400 rounded-full"></div>
          <h2 className="text-3xl font-cyber font-bold text-cyan-400">
            ASSET PORTFOLIO
          </h2>
          <div className="w-2 h-8 bg-gradient-to-b from-magenta-400 to-cyan-400 rounded-full"></div>
        </div>
        <p className="text-gray-300 font-mono text-sm">
          Encrypted asset holdings • Anonymous treasury • Withdrawal management
        </p>
      </div>

      {/* Account Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-cyber p-6">
          <h3 className="text-lg font-cyber font-bold text-cyan-400 mb-4 flex items-center">
            <span className="mr-2">🔐</span>
            REGISTRATION
          </h3>
          <div className="text-center">
            <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
              registrationData?.isRegistered 
                ? 'bg-green-400/20 border-2 border-green-400' 
                : 'bg-red-400/20 border-2 border-red-400'
            }`}>
              <span className={`text-2xl ${
                registrationData?.isRegistered ? 'text-green-400' : 'text-red-400'
              }`}>
                {registrationData?.isRegistered ? '✓' : '✗'}
              </span>
            </div>
            <div className={`font-cyber font-bold text-sm ${
              registrationData?.isRegistered ? 'text-green-400' : 'text-red-400'
            }`}>
              {registrationData?.isRegistered ? 'ACTIVE' : 'INACTIVE'}
            </div>
          </div>
        </div>

        <div className="card-cyber p-6">
          <h3 className="text-lg font-cyber font-bold text-cyan-400 mb-4 flex items-center">
            <span className="mr-2">👁️</span>
            REVEAL STATUS
          </h3>
          <div className="text-center">
            <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
              isRevealed 
                ? 'bg-yellow-400/20 border-2 border-yellow-400' 
                : 'bg-gray-400/20 border-2 border-gray-400'
            }`}>
              <span className={`text-2xl ${
                isRevealed ? 'text-yellow-400' : 'text-gray-400'
              }`}>
                {isRevealed ? '👁️' : '🔒'}
              </span>
            </div>
            <div className={`font-cyber font-bold text-sm ${
              isRevealed ? 'text-yellow-400' : 'text-gray-400'
            }`}>
              {isRevealed ? 'REVEALED' : 'ENCRYPTED'}
            </div>
          </div>
        </div>

        <div className="card-cyber p-6">
          <h3 className="text-lg font-cyber font-bold text-cyan-400 mb-4 flex items-center">
            <span className="mr-2">💰</span>
            USDT BALANCE
          </h3>
          <div className="text-center">
            <div className="text-2xl font-cyber font-bold text-neon-gold mb-1">
              {usdtBalance ? (Number(usdtBalance) / 1e6).toFixed(6) : '0.000000'}
            </div>
            <div className="text-xs text-gray-400 font-mono">
              Available for purchases
            </div>
          </div>
        </div>

        <div className="card-cyber p-6">
          <h3 className="text-lg font-cyber font-bold text-cyan-400 mb-4 flex items-center">
            <span className="mr-2">📊</span>
            PORTFOLIO
          </h3>
          <div className="text-center">
            <div className="text-2xl font-cyber font-bold text-purple-400 mb-1">
              {TOKENS.length}
            </div>
            <div className="text-xs text-gray-400 font-mono">
              Tracked assets
            </div>
          </div>
        </div>
      </div>

      {/* Token Holdings */}
      <div className="card-cyber p-6">
        <h3 className="text-2xl font-cyber font-bold text-cyan-400 mb-8 flex items-center">
          <span className="mr-3">🏦</span>
          TOKEN HOLDINGS
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TOKENS.map((token) => (
            <TokenCard
              key={token.symbol}
              token={token}
              userAddress={address!}
              isRevealed={isRevealed}
              decryptedProxyAddress={decryptedProxyAddress}
              onWithdraw={() => handleWithdraw(token)}
              isWithdrawing={isWithdrawing[token.address] || isWithdrawPending || isWithdrawLoading}
            />
          ))}
        </div>
      </div>

      {/* Proxy Address Info */}
      {isRevealed && decryptedProxyAddress && (
        <div className="card-cyber p-6">
          <h3 className="text-2xl font-cyber font-bold text-yellow-400 mb-6 flex items-center">
            <span className="mr-3">🔓</span>
            REVEALED PROXY ADDRESS
          </h3>
          
          <div className="bg-black/50 border border-yellow-400/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 font-mono text-sm">Proxy Address:</span>
              <div className="px-3 py-1 bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 rounded-full text-xs font-mono">
                PUBLIC
              </div>
            </div>
            
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
              <code className="text-yellow-400 font-mono text-sm break-all">
                {decryptedProxyAddress}
              </code>
            </div>
            
            <div className="text-yellow-400 font-mono text-sm">
              ⚠️ This address can now withdraw all your purchased tokens. Keep it secure.
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!isRevealed && (
        <div className="card-cyber p-6 border border-yellow-500/30 bg-yellow-400/5">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 border-2 border-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-yellow-400 text-2xl">💡</span>
            </div>
            <div>
              <h3 className="text-xl font-cyber font-bold text-yellow-400 mb-4">
                WITHDRAWAL INSTRUCTIONS
              </h3>
              <div className="text-yellow-400 font-mono text-sm space-y-2">
                <p>1. Your tokens are stored in an encrypted treasury</p>
                <p>2. To withdraw tokens, you must first reveal your proxy address</p>
                <p>3. Go to the "Reveal" page and request decryption</p>
                <p>4. Once revealed, the proxy address can withdraw all tokens</p>
                <p>5. Connect with your proxy wallet to access withdrawn tokens</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Token Card Component
interface TokenCardProps {
  token: Token;
  userAddress: string;
  isRevealed: boolean;
  decryptedProxyAddress: string | undefined;
  onWithdraw: () => void;
  isWithdrawing: boolean;
}

const TokenCard = ({ token, userAddress, isRevealed, decryptedProxyAddress, onWithdraw, isWithdrawing }: TokenCardProps) => {
  // Get user balance for this token
  const { data: userBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.CONFIDENTIAL_TRADE as `0x${string}`,
    abi: CONFIDENTIAL_TRADE_ABI,
    functionName: 'getUserBalance',
    args: [userAddress, token.address],
    query: {
      enabled: !!userAddress
    }
  });

  // Get proxy balance for this token (only if revealed)
  const { data: proxyBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.CONFIDENTIAL_TRADE as `0x${string}`,
    abi: CONFIDENTIAL_TRADE_ABI,
    functionName: 'getUserBalance',
    args: [decryptedProxyAddress!, token.address],
    query: {
      enabled: !!decryptedProxyAddress && isRevealed
    }
  });

  // Get token price
  const { data: tokenPrice } = useReadContract({
    address: CONTRACT_ADDRESSES.CONFIDENTIAL_TRADE as `0x${string}`,
    abi: CONFIDENTIAL_TRADE_ABI,
    functionName: 'getTokenPrice',
    args: [token.address],
  });

  const userBalanceNum = userBalance ? Number(userBalance) : 0;
  const proxyBalanceNum = proxyBalance ? Number(proxyBalance) : 0;
  const priceNum = tokenPrice ? Number(tokenPrice) / 1e6 : 0;
  const totalValue = (userBalanceNum + proxyBalanceNum) * priceNum;

  return (
    <div className="glass-strong rounded-lg p-6 border border-gray-700 hover:border-cyan-500/50 transition-all duration-300">
      {/* Token Header */}
      <div className="flex items-center space-x-4 mb-6">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${token.color} flex items-center justify-center text-2xl font-bold animate-pulse`}>
          {token.icon}
        </div>
        <div>
          <h4 className="font-cyber font-bold text-lg text-cyan-400">
            {token.symbol}
          </h4>
          <p className="text-sm text-gray-400 font-mono">
            {token.name}
          </p>
        </div>
      </div>

      {/* Balances */}
      <div className="space-y-4 mb-6">
        {/* Treasury Balance */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 font-mono text-sm">Treasury:</span>
          <div className="text-right">
            <div className="text-cyan-400 font-mono font-bold">
              {userBalanceNum.toFixed(6)}
            </div>
            <div className="text-xs text-gray-500">
              ~${(userBalanceNum * priceNum).toFixed(2)} USD
            </div>
          </div>
        </div>

        {/* Proxy Balance (if revealed) */}
        {isRevealed && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-mono text-sm">Proxy:</span>
            <div className="text-right">
              <div className="text-green-400 font-mono font-bold">
                {proxyBalanceNum.toFixed(6)}
              </div>
              <div className="text-xs text-gray-500">
                ~${(proxyBalanceNum * priceNum).toFixed(2)} USD
              </div>
            </div>
          </div>
        )}

        {/* Total Value */}
        <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
          <span className="text-white font-mono font-bold">Total Value:</span>
          <div className="text-right">
            <div className="text-neon-gold font-cyber font-bold text-lg">
              ${totalValue.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">
              @ ${priceNum.toFixed(6)} per {token.symbol}
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onWithdraw}
        disabled={!isRevealed || userBalanceNum === 0 || isWithdrawing}
        className="w-full btn-primary py-3 text-sm font-cyber font-bold disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
      >
        {isWithdrawing ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <span>WITHDRAWING...</span>
          </div>
        ) : !isRevealed ? (
          'REVEAL ADDRESS FIRST'
        ) : userBalanceNum === 0 ? (
          'NO BALANCE TO WITHDRAW'
        ) : (
          <>
            <span className="relative z-10">WITHDRAW TO PROXY</span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-magenta-400/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </>
        )}
      </button>

      {/* Status Indicator */}
      <div className="flex items-center justify-center space-x-2 mt-3">
        <div className={`w-2 h-2 rounded-full ${
          userBalanceNum > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
        }`}></div>
        <span className="text-xs font-mono text-gray-400">
          {userBalanceNum > 0 ? 'ASSETS_AVAILABLE' : 'NO_HOLDINGS'}
        </span>
      </div>
    </div>
  );
};