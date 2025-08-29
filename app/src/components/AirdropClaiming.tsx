import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { toast } from 'react-hot-toast';
import { CONTRACT_ADDRESSES, AIRDROP_ABI, ANONYMOUS_AUTH_ABI } from '../config/contracts';
import { formatEther } from 'viem';

interface AirdropInfo {
  nftContract: string;
  amount: bigint;
  claimed: boolean;
  timestamp: bigint;
}

export const AirdropClaiming = () => {
  const [selectedNFTAddress, setSelectedNFTAddress] = useState<string>('');
  
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

  // Get total airdrops for user
  const { data: totalAirdrops } = useReadContract({
    address: CONTRACT_ADDRESSES.AIRDROP as `0x${string}`,
    abi: AIRDROP_ABI,
    functionName: 'getUserTotalAirdrops',
    args: [address!],
    query: {
      enabled: !!address
    }
  });

  // Get airdrop record for selected NFT
  const { data: airdropRecord, refetch: refetchAirdropRecord } = useReadContract({
    address: CONTRACT_ADDRESSES.AIRDROP as `0x${string}`,
    abi: AIRDROP_ABI,
    functionName: 'getAirdropRecord',
    args: [address!, selectedNFTAddress as `0x${string}`],
    query: {
      enabled: !!address && !!selectedNFTAddress && !!selectedNFTAddress.match(/^0x[a-fA-F0-9]{40}$/)
    }
  });
  
  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const isRegistered = registrationData?.isRegistered ?? false;

  const handleRecordAirdrop = async () => {
    if (!address || !selectedNFTAddress) {
      toast.error('Please enter an NFT contract address');
      return;
    }

    if (!selectedNFTAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error('Please enter a valid contract address');
      return;
    }

    try {
      toast.loading('Recording airdrop eligibility...');
      
      writeContract({
        address: CONTRACT_ADDRESSES.AIRDROP as `0x${string}`,
        abi: AIRDROP_ABI,
        functionName: 'recordAirdrop',
        args: [selectedNFTAddress as `0x${string}`],
      });
      
    } catch (error) {
      console.error('Airdrop recording failed:', error);
      toast.dismiss();
      toast.error('Failed to record airdrop. Please ensure you have verified NFT ownership.');
    }
  };

  // Handle transaction success
  if (isSuccess) {
    toast.dismiss();
    toast.success('Airdrop eligibility recorded successfully!');
    refetchAirdropRecord();
  }

  const airdropInfo = airdropRecord as AirdropInfo | undefined;

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Airdrop Claiming</h2>
        <p className="text-gray-600">Please connect your wallet to claim airdrops.</p>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Airdrop Claiming</h2>
        <p className="text-gray-600">You need to register a shadow address first before claiming airdrops.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Airdrop Claiming</h2>
      <p className="text-gray-600 mb-6">
        Claim your eligibility for airdrops based on verified NFT ownership. Your shadow address remains private.
      </p>
      
      <div className="space-y-6">
        {/* Total Airdrops Display */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Your Airdrop Summary</h3>
          <p className="text-2xl font-bold text-primary">
            {totalAirdrops ? formatEther(totalAirdrops) : '0'} ETH
          </p>
          <p className="text-sm text-gray-600">Total recorded airdrops (not yet distributed)</p>
        </div>

        {/* NFT Contract Input */}
        <div>
          <label htmlFor="nftAddress" className="block text-sm font-medium text-gray-700 mb-2">
            NFT Contract Address
          </label>
          <input
            type="text"
            id="nftAddress"
            value={selectedNFTAddress}
            onChange={(e) => setSelectedNFTAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isPending || isConfirming}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the contract address of the NFT collection you want to claim airdrops for
          </p>
        </div>

        {/* Current Airdrop Status */}
        {selectedNFTAddress && airdropInfo && (
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Airdrop Status</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Amount:</span> {formatEther(airdropInfo.amount)} ETH</p>
              <p><span className="font-medium">Status:</span> 
                <span className={`ml-1 ${airdropInfo.claimed ? 'text-green-600' : 'text-orange-600'}`}>
                  {airdropInfo.claimed ? 'Claimed' : 'Recorded (not yet distributed)'}
                </span>
              </p>
              <p><span className="font-medium">Recorded:</span> {new Date(Number(airdropInfo.timestamp) * 1000).toLocaleDateString()}</p>
            </div>
          </div>
        )}
        
        {/* Record Airdrop Button */}
        <button
          onClick={handleRecordAirdrop}
          disabled={!selectedNFTAddress || isPending || isConfirming || (airdropInfo && airdropInfo.amount > 0)}
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending || isConfirming ? 'Processing...' : 
           airdropInfo && airdropInfo.amount > 0 ? 'Already Recorded' :
           'Record Airdrop Eligibility'}
        </button>
        
        <div className="text-sm text-gray-500">
          <p className="font-semibold">How Airdrop Claiming Works:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>First verify your NFT ownership using the NFT Verification section</li>
            <li>Once verified, you can record your airdrop eligibility for that NFT collection</li>
            <li>Airdrops are recorded on-chain but not immediately distributed</li>
            <li>Actual token distribution will be implemented in future updates</li>
            <li>Your shadow address remains confidential throughout the process</li>
          </ul>
        </div>
      </div>
    </div>
  );
};