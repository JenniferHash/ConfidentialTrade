import { useState, useEffect, useRef } from 'react';
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
    symbol: 'DOGE',
    name: 'Doge',
    icon: '🐶',
    address: '0x0000000000000000000000000000000000000004',
    decimals: 18,
    color: 'from-yellow-400 to-orange-400'
  }
];

const USDT_TOKEN = {
  symbol: 'USDT',
  name: 'Tether USD',
  icon: '💵',
  address: CONTRACT_ADDRESSES.MOCK_USDT,
  decimals: 6,
  color: 'from-green-400 to-green-600'
};

export const TokenPurchase = () => {
  const { address } = useAccount();
  const [selectedToken, setSelectedToken] = useState<Token>(TOKENS[0]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get token price for selected token
  const { data: tokenPrice } = useReadContract({
    address: CONTRACT_ADDRESSES.CONFIDENTIAL_TRADE as `0x${string}`,
    abi: CONFIDENTIAL_TRADE_ABI,
    functionName: 'getTokenPrice',
    args: [selectedToken.address as `0x${string}`],
    query: {
      enabled: !!selectedToken.address
    }
  });

  // Get prices for all tokens in selector
  const { data: ethPrice } = useReadContract({
    address: CONTRACT_ADDRESSES.CONFIDENTIAL_TRADE as `0x${string}`,
    abi: CONFIDENTIAL_TRADE_ABI,
    functionName: 'getTokenPrice',
    args: [TOKENS[0].address as `0x${string}`], // ETH
  });

  const { data: zamaPrice } = useReadContract({
    address: CONTRACT_ADDRESSES.CONFIDENTIAL_TRADE as `0x${string}`,
    abi: CONFIDENTIAL_TRADE_ABI,
    functionName: 'getTokenPrice',
    args: [TOKENS[1].address as `0x${string}`], // ZAMA
  });

  const { data: uniPrice } = useReadContract({
    address: CONTRACT_ADDRESSES.CONFIDENTIAL_TRADE as `0x${string}`,
    abi: CONFIDENTIAL_TRADE_ABI,
    functionName: 'getTokenPrice',
    args: [TOKENS[2].address as `0x${string}`], // UNI
  });

  const { data: dogePrice } = useReadContract({
    address: CONTRACT_ADDRESSES.CONFIDENTIAL_TRADE as `0x${string}`,
    abi: CONFIDENTIAL_TRADE_ABI,
    functionName: 'getTokenPrice',
    args: [TOKENS[3].address as `0x${string}`], // DOGE
  });

  // Helper function to get price for any token
  const getTokenPrice = (tokenAddress: string) => {
    switch (tokenAddress) {
      case TOKENS[0].address: return ethPrice;
      case TOKENS[1].address: return zamaPrice;
      case TOKENS[2].address: return uniPrice;
      case TOKENS[3].address: return dogePrice;
      default: return undefined;
    }
  };

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

  // Get USDT allowance
  const { data: usdtAllowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.MOCK_USDT as `0x${string}`,
    abi: MOCK_USDT_ABI,
    functionName: 'allowance',
    args: [address!, CONTRACT_ADDRESSES.CONFIDENTIAL_TRADE as `0x${string}`],
    query: {
      enabled: !!address
    }
  });

  // Approve USDT
  const { writeContract: approveUSDT, data: approveHash, isPending: isApprovePending } = useWriteContract();
  
  const { isLoading: isApproveLoading } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Handle approve success
  useEffect(() => {
    if (approveHash && !isApproveLoading && !isApprovePending) {
      toast.success('USDT approved successfully!');
      refetchAllowance();
    }
  }, [approveHash, isApproveLoading, isApprovePending]);

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

  // Update amounts when user types
  useEffect(() => {
    if (fromAmount && tokenPrice && Number(tokenPrice) > 0) {
      const tokenAmount = parseFloat(fromAmount) / (Number(tokenPrice) / 1e6);
      // 如果是小数值（<1），显示6位小数；否则显示2位小数
      const decimals = tokenAmount < 1 ? 6 : 2;
      setToAmount(tokenAmount.toFixed(decimals));
    } else if (!fromAmount) {
      setToAmount('');
    }
  }, [fromAmount, tokenPrice]);

  // Close token selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedOnSelector = selectorRef.current?.contains(target);
      const clickedOnDropdown = dropdownRef.current?.contains(target);
      
      if (!clickedOnSelector && !clickedOnDropdown) {
        console.log('Clicked outside, closing selector');
        setShowTokenSelector(false);
      } else {
        console.log('Clicked inside selector/dropdown, keeping open');
      }
    };

    if (showTokenSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTokenSelector]);

  const handleApprove = async () => {
    try {
      // Approve unlimited USDT (max uint256)
      const maxAmount = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
      
      approveUSDT({
        address: CONTRACT_ADDRESSES.MOCK_USDT as `0x${string}`,
        abi: MOCK_USDT_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.CONFIDENTIAL_TRADE as `0x${string}`, maxAmount],
      });
    } catch (error) {
      console.error('Approve failed:', error);
      toast.error('Approval failed. Please try again.');
    }
  };

  const handlePurchase = async () => {
    if (!fromAmount || !tokenPrice || parseFloat(fromAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!registrationData?.isRegistered) {
      toast.error('Please register your proxy address first');
      return;
    }

    const amount = parseFloat(fromAmount);
    const totalCost = Number(tokenPrice) * amount;
    
    if (usdtBalance && totalCost > Number(usdtBalance)) {
      toast.error('Insufficient USDT balance');
      return;
    }

    // Check allowance
    const requiredAllowance = BigInt(totalCost);
    if (!usdtAllowance || usdtAllowance < requiredAllowance) {
      toast.error('Please approve USDT spending first');
      return;
    }

    setIsLoading(true);
    try {
      // Calculate the actual token amount to purchase
      const tokenAmount = parseFloat(fromAmount) / (Number(tokenPrice) / 1e6);
      const tokenAmountBigInt = parseUnits(tokenAmount.toString(), 18); // 18 decimals for tokens
      console.log("tokenAmountBigInt:",fromAmount,tokenPrice,tokenAmount,tokenAmountBigInt);
      
      purchaseToken({
        address: CONTRACT_ADDRESSES.CONFIDENTIAL_TRADE as `0x${string}`,
        abi: CONFIDENTIAL_TRADE_ABI,
        functionName: 'anonymousPurchase',
        args: [selectedToken.address as `0x${string}`, tokenAmountBigInt],
      });
      toast.success(`Purchase initiated: ${fromAmount} USDT for ${tokenAmount.toFixed(6)} ${selectedToken.symbol}`);
    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error('Purchase failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const rate = tokenPrice ? (1 / (Number(tokenPrice) / 1e6)).toFixed(6) : '0';
  const hasInsufficientBalance = Boolean(usdtBalance && toAmount && parseFloat(toAmount) > Number(usdtBalance) / 1e6);
  
  // Check if approval is needed
  const needsApproval = () => {
    if (!fromAmount || !tokenPrice) return false;
    const amount = parseFloat(fromAmount);
    const totalCost = BigInt(Number(tokenPrice) * amount);
    return !usdtAllowance || usdtAllowance < totalCost;
  };

  // Debug logs
  // console.log('TokenPurchase render:', {
  //   selectedToken: selectedToken.symbol,
  //   showTokenSelector,
  //   tokenPrice: tokenPrice ? Number(tokenPrice) / 1e6 : 'undefined',
  //   ethPrice: ethPrice ? Number(ethPrice) / 1e6 : 'undefined',
  //   zamaPrice: zamaPrice ? Number(zamaPrice) / 1e6 : 'undefined',
  //   uniPrice: uniPrice ? Number(uniPrice) / 1e6 : 'undefined',
  //   dogePrice: dogePrice ? Number(dogePrice) / 1e6 : 'undefined',
  // });

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">Swap</h1>
        <p className="text-gray-400 text-sm">Trade tokens in an instant</p>
      </div>

      {/* Swap Card */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 space-y-4">
        
        {/* From Token Input */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">From</span>
            <span className="text-gray-400">
              Balance: {usdtBalance ? `${(Number(usdtBalance) / 1e6).toFixed(6)}` : '0.00'}
            </span>
          </div>
          
          <div className="relative">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.0"
              className="w-full bg-transparent text-3xl font-semibold text-white placeholder-gray-500 outline-none pr-32"
              step="any"
            />
            
            {/* USDT Token Selector (Fixed) */}
            <div className="absolute right-0 top-0 h-full flex items-center">
              <div className="flex items-center space-x-2 bg-white/10 hover:bg-white/15 px-3 py-2 rounded-xl transition-colors cursor-not-allowed">
                <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-sm">
                  💵
                </div>
                <span className="font-medium text-white">USDT</span>
              </div>
            </div>
          </div>
          
          {/* Max Button */}
          <div className="flex justify-end">
            <button
              onClick={() => usdtBalance && setFromAmount((Number(usdtBalance) / 1e6).toString())}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors px-2 py-1 rounded border border-cyan-400/30 hover:border-cyan-300/50"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-10 bg-white/10 hover:bg-white/15 rounded-full flex items-center justify-center cursor-pointer transition-colors group">
            <svg className="w-5 h-5 text-gray-400 group-hover:text-white transform group-hover:rotate-180 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        {/* To Token Input */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">To</span>
            <span className="text-gray-400">
              Balance: 0.00
            </span>
          </div>
          
          <div className="relative">
            <input
              type="text"
              value={toAmount}
              readOnly
              placeholder="0.0"
              className="w-full bg-transparent text-3xl font-semibold text-white placeholder-gray-500 outline-none pr-40"
            />
            
            {/* Token Selector */}
            <div className="absolute right-0 top-0 h-full flex items-center">
              <div 
                ref={selectorRef}
                onClick={() => {
                  console.log('Token selector clicked, current state:', showTokenSelector);
                  setShowTokenSelector(!showTokenSelector);
                  console.log('Token selector state will be:', !showTokenSelector);
                }}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/15 px-3 py-2 rounded-xl transition-colors cursor-pointer relative"
              >
                <div className={`w-6 h-6 bg-gradient-to-br ${selectedToken.color} rounded-full flex items-center justify-center text-sm`}>
                  {selectedToken.icon}
                </div>
                <span className="font-medium text-white">{selectedToken.symbol}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {/* Token Dropdown */}
              {showTokenSelector && (
                <div 
                  ref={dropdownRef}
                  className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-white/10 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto"
                  onClick={(e) => {
                    console.log('Dropdown container clicked');
                    e.stopPropagation();
                  }}
                >
                  {TOKENS.map((token) => (
                    <div
                      key={token.symbol}
                      onClick={(e) => {
                        console.log('Token clicked:', token.symbol, token.address);
                        console.log('Event:', e);
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedToken(token);
                        setShowTokenSelector(false);
                        console.log('Selected token updated to:', token.symbol);
                      }}
                      onMouseDown={(e) => {
                        console.log('Token mousedown:', token.symbol);
                        e.preventDefault();
                      }}
                      className="flex items-center justify-between p-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-b-0"
                      style={{ pointerEvents: 'all' }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 bg-gradient-to-br ${token.color} rounded-full flex items-center justify-center text-lg`}>
                          {token.icon}
                        </div>
                        <div>
                          <div className="font-medium text-white">{token.symbol}</div>
                          <div className="text-sm text-gray-400">{token.name}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        {(() => {
                          const price = getTokenPrice(token.address);
                          return price && Number(price) > 0 ? 
                            `$${(Number(price) / 1e6).toFixed(2)}` : 
                            '$0.00';
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rate Display */}
        {rate && rate !== '0' && (
          <div className="text-center text-sm text-gray-400 py-2 border-t border-white/10">
            1 USDT = {rate} {selectedToken.symbol}
          </div>
        )}

        {/* Error Messages */}
        {hasInsufficientBalance && (
          <div className="text-center text-red-400 text-sm py-2">
            Insufficient USDT balance
          </div>
        )}

        {!registrationData?.isRegistered && (
          <div className="text-center text-yellow-400 text-sm py-2">
            Please register your proxy address first
          </div>
        )}

        {/* Approve/Swap Buttons */}
        {needsApproval() && fromAmount && tokenPrice ? (
          <button
            onClick={handleApprove}
            disabled={
              isApprovePending || 
              isApproveLoading || 
              !registrationData?.isRegistered || 
              !fromAmount || 
              parseFloat(fromAmount) <= 0 ||
              hasInsufficientBalance
            }
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
              isApprovePending || isApproveLoading || !registrationData?.isRegistered || !fromAmount || parseFloat(fromAmount) <= 0 || hasInsufficientBalance
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {isApprovePending || isApproveLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Approving...</span>
              </div>
            ) : !registrationData?.isRegistered ? (
              'Register Proxy Address First'
            ) : hasInsufficientBalance ? (
              'Insufficient Balance'
            ) : !fromAmount || parseFloat(fromAmount) <= 0 ? (
              'Enter an amount'
            ) : (
              `Approve USDT`
            )}
          </button>
        ) : (
          <button
            onClick={handlePurchase}
            disabled={
              isLoading || 
              isPurchasePending || 
              isPurchaseLoading || 
              !registrationData?.isRegistered || 
              !fromAmount || 
              parseFloat(fromAmount) <= 0 ||
              hasInsufficientBalance
            }
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
              isLoading || isPurchasePending || isPurchaseLoading || !registrationData?.isRegistered || !fromAmount || parseFloat(fromAmount) <= 0 || hasInsufficientBalance
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {isLoading || isPurchasePending || isPurchaseLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : !registrationData?.isRegistered ? (
              'Register Proxy Address First'
            ) : hasInsufficientBalance ? (
              'Insufficient Balance'
            ) : !fromAmount || parseFloat(fromAmount) <= 0 ? (
              'Enter an amount'
            ) : (
              'Swap'
            )}
          </button>
        )}

        {/* Info Section */}
        <div className="space-y-2 pt-4 border-t border-white/10">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Price Impact</span>
            <span className="text-green-400">≤ 0.01%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Network Fee</span>
            <span className="text-gray-300">Gas fee</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Privacy</span>
            <span className="text-cyan-400">Anonymous</span>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 border border-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-yellow-500 text-xs">!</span>
          </div>
          <div className="text-yellow-500 text-sm">
            <div className="font-semibold mb-1">Anonymous Purchase</div>
            <div className="text-yellow-400/80">
              Tokens are stored in your encrypted treasury. Use the Reveal function to withdraw to your wallet.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};