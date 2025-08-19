import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { toast } from 'react-hot-toast';
import { CONTRACT_ADDRESSES, ANONYMOUS_AUTH_ABI } from '../config/contracts';

interface NFTCollection {
  address: string;
  name: string;
  description: string;
}

// Sample NFT collections for testing
const SAMPLE_NFT_COLLECTIONS: NFTCollection[] = [
  {
    address: '0x0000000000000000000000000000000000000001',
    name: 'Sample NFT Collection 1',
    description: 'A test NFT collection for demonstration'
  },
  {
    address: '0x0000000000000000000000000000000000000002',
    name: 'Sample NFT Collection 2', 
    description: 'Another test NFT collection'
  }
];

export const NFTVerification = () => {
  const [selectedNFT, setSelectedNFT] = useState<string>('');
  const [customNFTAddress, setCustomNFTAddress] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  
  const { address, isConnected } = useAccount();
  
  // Check if user is registered
  const { data: registrationData } = useReadContract({
    address: CONTRACT_ADDRESSES.ANONYMOUS_AUTH as `0x${string}`,
    abi: ANONYMOUS_AUTH_ABI,
    functionName: 'getUserRegistration',
    args: [address!],
    query: {
      enabled: !!address
    }
  });
  
  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const isRegistered = registrationData?.[0] ?? false;
  const nftAddress = useCustom ? customNFTAddress : selectedNFT;

  const handleVerifyNFT = async () => {
    if (!address || !nftAddress) {
      toast.error('Please select or enter an NFT contract address');
      return;
    }

    if (!nftAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error('Please enter a valid contract address');
      return;
    }

    try {
      toast.loading('Requesting NFT verification...');
      
      writeContract({
        address: CONTRACT_ADDRESSES.ANONYMOUS_AUTH as `0x${string}`,
        abi: ANONYMOUS_AUTH_ABI,
        functionName: 'requestNFTVerification',
        args: [nftAddress as `0x${string}`],
      });
      
    } catch (error) {
      console.error('NFT verification failed:', error);
      toast.dismiss();
      toast.error('Failed to request NFT verification. Please try again.');
    }
  };

  // Handle transaction success
  if (isSuccess) {
    toast.dismiss();
    toast.success('NFT verification requested! Processing will complete shortly.');
  }

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">NFT Verification</h2>
        <p className="text-gray-600">Please connect your wallet to verify NFTs.</p>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">NFT Verification</h2>
        <p className="text-gray-600">You need to register a shadow address first before verifying NFTs.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">NFT Verification</h2>
      <p className="text-gray-600 mb-6">
        Verify NFT ownership using your encrypted shadow address. The verification is anonymous and confidential.
      </p>
      
      <div className="space-y-6">
        <div>
          <div className="flex items-center space-x-4 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="nftSource"
                checked={!useCustom}
                onChange={() => setUseCustom(false)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Select from list</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="nftSource"
                checked={useCustom}
                onChange={() => setUseCustom(true)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Enter custom address</span>
            </label>
          </div>
          
          {!useCustom ? (
            <div>
              <label htmlFor="nftCollection" className="block text-sm font-medium text-gray-700 mb-2">
                NFT Collection
              </label>
              <select
                id="nftCollection"
                value={selectedNFT}
                onChange={(e) => setSelectedNFT(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isPending || isConfirming}
              >
                <option value="">Select an NFT collection</option>
                {SAMPLE_NFT_COLLECTIONS.map((nft) => (
                  <option key={nft.address} value={nft.address}>
                    {nft.name} - {nft.address}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label htmlFor="customNFT" className="block text-sm font-medium text-gray-700 mb-2">
                Custom NFT Contract Address
              </label>
              <input
                type="text"
                id="customNFT"
                value={customNFTAddress}
                onChange={(e) => setCustomNFTAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isPending || isConfirming}
              />
            </div>
          )}
        </div>
        
        <button
          onClick={handleVerifyNFT}
          disabled={!nftAddress || isPending || isConfirming}
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending || isConfirming ? 'Processing...' : 'Verify NFT Ownership'}
        </button>
        
        <div className="text-sm text-gray-500">
          <p className="font-semibold">How it works:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Your encrypted shadow address will be decrypted securely off-chain</li>
            <li>The system checks if that address owns NFTs from the specified contract</li>
            <li>The result is stored on-chain without revealing your shadow address</li>
            <li>This enables anonymous airdrop eligibility</li>
          </ul>
        </div>
      </div>
    </div>
  );
};