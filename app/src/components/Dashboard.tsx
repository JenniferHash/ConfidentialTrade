import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, ANONYMOUS_AUTH_ABI, AIRDROP_ABI } from '../config/contracts';
import { AddressRegistration } from './AddressRegistration';
import { NFTVerification } from './NFTVerification';
import { AirdropClaiming } from './AirdropClaiming';
import { formatEther } from 'viem';

type TabType = 'register' | 'verify' | 'airdrop';

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('register');
  const { address, isConnected } = useAccount();
  
  // Get user registration status
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

  const isRegistered = registrationData?.[0] ?? false;
  const registrationTime = registrationData?.[1] ?? 0n;

  const tabs = [
    { id: 'register', label: 'Register', description: 'Register your shadow address' },
    { id: 'verify', label: 'Verify NFTs', description: 'Verify NFT ownership' },
    { id: 'airdrop', label: 'Airdrops', description: 'Claim airdrop eligibility' }
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case 'register':
        return <AddressRegistration />;
      case 'verify':
        return <NFTVerification />;
      case 'airdrop':
        return <AirdropClaiming />;
      default:
        return <AddressRegistration />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* User Status Overview */}
      {isConnected && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Registration Status</h3>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isRegistered ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`font-medium ${isRegistered ? 'text-green-700' : 'text-red-700'}`}>
                {isRegistered ? 'Registered' : 'Not Registered'}
              </span>
            </div>
            {isRegistered && registrationTime > 0n && (
              <p className="text-sm text-gray-600 mt-1">
                Since: {new Date(Number(registrationTime) * 1000).toLocaleDateString()}
              </p>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">NFT Verifications</h3>
            <p className="text-2xl font-bold text-primary">-</p>
            <p className="text-sm text-gray-600">Collections verified</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Airdrops</h3>
            <p className="text-2xl font-bold text-primary">
              {totalAirdrops ? formatEther(totalAirdrops) : '0'} ETH
            </p>
            <p className="text-sm text-gray-600">Recorded (not distributed)</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mb-8">
        {renderContent()}
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">How to Use the Anonymous Shadow OS</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">1</div>
              <h4 className="font-semibold text-gray-800">Register</h4>
            </div>
            <p className="text-gray-600 text-sm">
              Register your shadow address using Zama's FHE encryption. This address will be used for anonymous operations.
            </p>
          </div>
          
          <div>
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">2</div>
              <h4 className="font-semibold text-gray-800">Verify NFTs</h4>
            </div>
            <p className="text-gray-600 text-sm">
              Verify NFT ownership using your encrypted shadow address. The verification is completely anonymous and confidential.
            </p>
          </div>
          
          <div>
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">3</div>
              <h4 className="font-semibold text-gray-800">Claim Airdrops</h4>
            </div>
            <p className="text-gray-600 text-sm">
              Record your airdrop eligibility based on verified NFT ownership. Your shadow address remains private throughout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};