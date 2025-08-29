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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">Assets</h1>
        <p className="text-gray-400 text-sm">Your token holdings</p>
      </div>

      {/* Status Bar */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                registrationData?.isRegistered ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <span className="text-sm text-gray-300">
                {registrationData?.isRegistered ? 'Registered' : 'Not Registered'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isRevealed ? 'bg-yellow-400' : 'bg-gray-500'
              }`}></div>
              <span className="text-sm text-gray-300">
                {isRevealed ? 'Revealed' : 'Encrypted'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">USDT Balance</div>
            <div className="font-semibold text-white">
              {usdtBalance ? (Number(usdtBalance) / 1e6).toFixed(2) : '0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* Assets List */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-semibold text-white">Token Holdings</h2>
        </div>
        
        <div className="divide-y divide-white/10">
          {TOKENS.map((token) => (
            <TokenListItem
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

      {/* Revealed Proxy Address */}
      {isRevealed && decryptedProxyAddress && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
          <h3 className="font-semibold text-yellow-400 mb-2">Revealed Proxy Address</h3>
          <div className="bg-black/30 rounded-lg p-3 mb-2">
            <code className="text-yellow-400 text-sm font-mono break-all">
              {decryptedProxyAddress}
            </code>
          </div>
          <p className="text-yellow-400/80 text-sm">
            This address can withdraw your tokens. Keep it secure.
          </p>
        </div>
      )}

      {/* Instructions */}
      {!isRevealed && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
          <h3 className="font-semibold text-blue-400 mb-2">How to withdraw tokens</h3>
          <div className="text-blue-400/80 text-sm space-y-1">
            <p>1. Go to the Reveal page to decrypt your proxy address</p>
            <p>2. Once revealed, you can withdraw tokens to your proxy wallet</p>
            <p>3. Connect with your proxy wallet to access withdrawn tokens</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Token List Item Component
interface TokenListItemProps {
  token: Token;
  userAddress: string;
  isRevealed: boolean;
  decryptedProxyAddress: string | undefined;
  onWithdraw: () => void;
  isWithdrawing: boolean;
}

const TokenListItem = ({ token, userAddress, isRevealed, decryptedProxyAddress, onWithdraw, isWithdrawing }: TokenListItemProps) => {
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

  // Get token price
  const { data: tokenPrice } = useReadContract({
    address: CONTRACT_ADDRESSES.CONFIDENTIAL_TRADE as `0x${string}`,
    abi: CONFIDENTIAL_TRADE_ABI,
    functionName: 'getTokenPrice',
    args: [token.address],
  });

  const userBalanceNum = userBalance ? Number(userBalance) : 0;
  const priceNum = tokenPrice ? Number(tokenPrice) / 1e6 : 0;
  const totalValue = userBalanceNum * priceNum;

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
            {userBalanceNum.toFixed(4)}
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

        {/* Action Button */}
        <button
          onClick={onWithdraw}
          disabled={!isRevealed || userBalanceNum === 0 || isWithdrawing}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors min-w-[100px] ${
            !isRevealed || userBalanceNum === 0 || isWithdrawing
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
          }`}
        >
          {isWithdrawing ? (
            <div className="flex items-center justify-center space-x-1">
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>...</span>
            </div>
          ) : !isRevealed ? (
            'Reveal'
          ) : userBalanceNum === 0 ? (
            'No Balance'
          ) : (
            'Withdraw'
          )}
        </button>
      </div>
    </div>
  );
};