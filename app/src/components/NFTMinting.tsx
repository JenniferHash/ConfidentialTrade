import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { isAddress } from 'viem';
import toast from 'react-hot-toast';
import { CONTRACT_ADDRESSES, SIMPLE_NFT_ABI } from '../config/contracts';

export const NFTMinting = () => {
  const [mintToAddress, setMintToAddress] = useState('');
  const [isCustomAddress, setIsCustomAddress] = useState(false);
  const { address, isConnected } = useAccount();

  // Read contract data
  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESSES.SIMPLE_NFT as `0x${string}`,
    abi: SIMPLE_NFT_ABI,
    functionName: 'totalSupply',
  });

  const { data: userBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.SIMPLE_NFT as `0x${string}`,
    abi: SIMPLE_NFT_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: !!address
    }
  });

  const { data: contractName } = useReadContract({
    address: CONTRACT_ADDRESSES.SIMPLE_NFT as `0x${string}`,
    abi: SIMPLE_NFT_ABI,
    functionName: 'name',
  });

  const { data: contractSymbol } = useReadContract({
    address: CONTRACT_ADDRESSES.SIMPLE_NFT as `0x${string}`,
    abi: SIMPLE_NFT_ABI,
    functionName: 'symbol',
  });

  // Write contract hooks
  const { writeContract, data: hash, isPending } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  const handleMint = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      if (isCustomAddress) {
        if (!mintToAddress) {
          toast.error('Please enter a valid address');
          return;
        }
        if (!isAddress(mintToAddress)) {
          toast.error('Invalid Ethereum address');
          return;
        }
        
        writeContract({
          address: CONTRACT_ADDRESSES.SIMPLE_NFT as `0x${string}`,
          abi: SIMPLE_NFT_ABI,
          functionName: 'mint',
          args: [mintToAddress as `0x${string}`],
        });
      } else {
        writeContract({
          address: CONTRACT_ADDRESSES.SIMPLE_NFT as `0x${string}`,
          abi: SIMPLE_NFT_ABI,
          functionName: 'mint',
        });
      }

      toast.success('Minting NFT... Please wait for confirmation');
    } catch (error: any) {
      console.error('Minting error:', error);
      toast.error(error?.message || 'Failed to mint NFT');
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">NFT Minting</h2>
          <p className="text-gray-600 mb-4">Connect your wallet to mint NFTs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Mint NFT</h2>

        {/* Contract Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Contract Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Name:</span>
              <span className="ml-2 text-gray-800">{contractName || 'Loading...'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Symbol:</span>
              <span className="ml-2 text-gray-800">{contractSymbol || 'Loading...'}</span>
            </div>
            
            <div>
              <span className="font-medium text-gray-600">Your Balance:</span>
              <span className="ml-2 text-gray-800">{userBalance?.toString() || '0'}</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Contract: {CONTRACT_ADDRESSES.SIMPLE_NFT}
          </div>
        </div>

        {/* Minting Options */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="mintOption"
                checked={!isCustomAddress}
                onChange={() => setIsCustomAddress(false)}
                className="mr-2"
              />
              <span className="text-gray-700">Mint to my address</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="mintOption"
                checked={isCustomAddress}
                onChange={() => setIsCustomAddress(true)}
                className="mr-2"
              />
              <span className="text-gray-700">Mint to custom address</span>
            </label>
          </div>

          {isCustomAddress && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={mintToAddress}
                onChange={(e) => setMintToAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
          )}
        </div>

        {/* Mint Button */}
        <button
          onClick={handleMint}
          disabled={isPending || isConfirming}
          className="w-full bg-primary text-white py-3 px-4 rounded-md font-medium hover:bg-primary/90 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isPending || isConfirming ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              {isPending ? 'Minting...' : 'Confirming...'}
            </div>
          ) : (
            'Mint NFT'
          )}
        </button>

        {/* Transaction Status */}
        {hash && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Transaction submitted: 
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 underline hover:text-blue-600"
              >
                View on Etherscan
              </a>
            </p>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">About This NFT</h4>
          <p className="text-sm text-yellow-700">
            This is a simple NFT contract where anyone can mint tokens for free. 
            Each token has a unique ID and can be transferred like any standard ERC721 NFT.
            You can use this NFT for testing the verification system in this application.
          </p>
        </div>
      </div>
    </div>
  );
};