import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'react-hot-toast';
import { CONTRACT_ADDRESSES, ANONYMOUS_AUTH_ABI } from '../config/contracts';
import { useFhevmInstance } from '../hooks/useFhevmInstance';
import { createEncryptionUtil } from '../utils/encryption';

export const AddressRegistration = () => {
  const [shadowAddress, setShadowAddress] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  
  const { address, isConnected } = useAccount();
  const { instance, isLoading: fhevmLoading, error: fhevmError } = useFhevmInstance();

  // Debug logging
  console.log('Address Registration Debug:', {
    address,
    isConnected,
    instance: !!instance,
    fhevmLoading,
    fhevmError,
    shadowAddress
  });
  
  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleRegister = async () => {
    // More specific error checking
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!shadowAddress) {
      toast.error('Please enter a shadow address');
      return;
    }

    if (!instance) {
      toast.error('FHEVM is still loading, please wait...');
      return;
    }

    // Basic address validation
    if (!shadowAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    try {
      setIsEncrypting(true);
      toast.loading('Encrypting shadow address...');
      
      // Create encryption utility
      const encryptionUtil = createEncryptionUtil(instance);
      
      // Encrypt the shadow address
      const encrypted = await encryptionUtil.encryptAddress(
        shadowAddress,
        CONTRACT_ADDRESSES.ANONYMOUS_AUTH,
        address
      );
      
      toast.dismiss();
      toast.loading('Registering encrypted address...');
      
      // Call the contract
      writeContract({
        address: CONTRACT_ADDRESSES.ANONYMOUS_AUTH as `0x${string}`,
        abi: ANONYMOUS_AUTH_ABI,
        functionName: 'registerEncryptedAddress',
        args: [encrypted.handle, encrypted.proof],
      });
      
    } catch (error) {
      console.error('Registration failed:', error);
      toast.dismiss();
      toast.error('Failed to register address. Please try again.');
    } finally {
      setIsEncrypting(false);
    }
  };

  // Handle transaction success
  if (isSuccess) {
    toast.dismiss();
    toast.success('Shadow address registered successfully!');
    setShadowAddress('');
  }

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Register Shadow Address</h2>
        <p className="text-gray-600">Please connect your wallet to register a shadow address.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Register Shadow Address</h2>
      <p className="text-gray-600 mb-6">
        Register an encrypted shadow address that will be used for anonymous NFT verification and airdrops.
      </p>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="shadowAddress" className="block text-sm font-medium text-gray-700 mb-2">
            Shadow Address (will be encrypted)
          </label>
          <input
            type="text"
            id="shadowAddress"
            value={shadowAddress}
            onChange={(e) => setShadowAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isEncrypting || isPending || isConfirming}
          />
        </div>
        
        <button
          onClick={handleRegister}
          disabled={!shadowAddress || isEncrypting || isPending || isConfirming || fhevmLoading || !instance}
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {fhevmLoading ? 'Loading FHEVM...' :
           fhevmError ? 'FHEVM Error - Check Console' :
           !instance ? 'FHEVM Not Ready' :
           isEncrypting ? 'Encrypting...' :
           isPending || isConfirming ? 'Confirming...' :
           'Register Shadow Address'}
        </button>
        
        {fhevmError && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            <p className="font-semibold">FHEVM Error:</p>
            <p>{fhevmError}</p>
          </div>
        )}
        
        {fhevmLoading && (
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
            <p>Loading FHEVM SDK... This may take a moment.</p>
          </div>
        )}
        
        <div className="text-sm text-gray-500">
          <p className="font-semibold">Privacy Notice:</p>
          <p>Your shadow address will be encrypted using Zama's FHE technology. Only you and authorized contracts can access it.</p>
        </div>
      </div>
    </div>
  );
};