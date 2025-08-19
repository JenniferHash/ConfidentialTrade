import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'react-hot-toast';
import { CONTRACT_ADDRESSES, ANONYMOUS_AUTH_ABI } from '../config/contracts';
import { useFhevmInstance } from '../hooks/useFhevmInstance';
import { useRegistrationStatus } from '../hooks/useRegistrationStatus';
import { useDecryptShadowAddress } from '../hooks/useDecryptShadowAddress';
import { createEncryptionUtil } from '../utils/encryption';

export const AddressRegistration = () => {
  const [shadowAddress, setShadowAddress] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  
  const { address, isConnected } = useAccount();
  const { instance, isLoading: fhevmLoading, error: fhevmError } = useFhevmInstance();
  const { isRegistered, registrationTimestamp, encryptedAddress, isLoading: registrationLoading, refetch: refetchRegistration } = useRegistrationStatus();
  const { decryptedAddress, isDecrypting, decryptError, decryptAddress } = useDecryptShadowAddress(encryptedAddress);
  
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();

  // Debug logging
  console.log('Address Registration Debug:', {
    address,
    isConnected,
    instance: !!instance,
    fhevmLoading,
    fhevmError,
    shadowAddress,
    writeError,
    isPending,
    hash
  });
  
  const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle transaction status changes
  useEffect(() => {
    if (isSuccess) {
      toast.dismiss();
      toast.success('Shadow address registered successfully!');
      setShadowAddress('');
      setIsEncrypting(false);
      // Refetch registration status after successful registration
      refetchRegistration();
    }
    
    if (isError && hash) {
      toast.dismiss();
      toast.error('Transaction failed. Please try again.');
      setIsEncrypting(false);
    }
    
    if (writeError) {
      console.error('writeContract error:', writeError);
      toast.dismiss();
      toast.error(`Contract write failed: ${writeError.message}`);
      setIsEncrypting(false);
    }
  }, [isSuccess, isError, hash, writeError]);

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
      console.log("handleRegister 1");
      
      // Encrypt the shadow address
      const encrypted = await encryptionUtil.encryptAddress(
        shadowAddress,
        CONTRACT_ADDRESSES.ANONYMOUS_AUTH,
        address
      );
      console.log("handleRegister 2");
      toast.dismiss();
      toast.loading('Registering encrypted address...');
      
      // Call the contract
      console.log("writeContract config:", {
        address: CONTRACT_ADDRESSES.ANONYMOUS_AUTH,
        functionName: 'registerEncryptedAddress',
        args: [encrypted.handle, encrypted.proof],
        argsLength: [encrypted.handle, encrypted.proof].length,
        handleType: typeof encrypted.handle,
        proofType: typeof encrypted.proof,
        handleValue: encrypted.handle,
        proofValue: encrypted.proof
      });
      
      // Ensure proper formatting of arguments
      const handle = encrypted.handle;
      const proof = encrypted.proof;
      
      // Convert to proper hex format if needed
      let formattedHandle: string;
      let formattedProof: string;
      
      // Handle different data types from Zama SDK
      if (typeof handle === 'string') {
        formattedHandle = handle.startsWith('0x') ? handle : `0x${handle}`;
      } else if (handle instanceof Uint8Array) {
        formattedHandle = `0x${Array.from(handle).map(b => b.toString(16).padStart(2, '0')).join('')}`;
      } else {
        formattedHandle = `0x${handle.toString()}`;
      }
      
      if (typeof proof === 'string') {
        formattedProof = proof.startsWith('0x') ? proof : `0x${proof}`;
      } else if (proof instanceof Uint8Array) {
        formattedProof = `0x${Array.from(proof).map(b => b.toString(16).padStart(2, '0')).join('')}`;
      } else {
        formattedProof = `0x${proof.toString()}`;
      }
      
      console.log("Formatted args:", {
        formattedHandle,
        formattedProof,
        formattedHandleType: typeof formattedHandle,
        formattedProofType: typeof formattedProof
      });
      
      try {
        writeContract({
          address: CONTRACT_ADDRESSES.ANONYMOUS_AUTH as `0x${string}`,
          abi: ANONYMOUS_AUTH_ABI,
          functionName: 'registerEncryptedAddress',
          args: [formattedHandle as `0x${string}`, formattedProof as `0x${string}`],
        });
        console.log("handleRegister 3 - writeContract called successfully");
      } catch (writeError) {
        console.error("writeContract error:", writeError);
        throw writeError;
      }
    } catch (error) {
      console.error('Registration failed:', error);
      toast.dismiss();
      toast.error('Failed to register address. Please try again.');
      setIsEncrypting(false);
    }
  };

  // Format timestamp to readable date
  const formatRegistrationDate = (timestamp: bigint) => {
    if (timestamp === BigInt(0)) return 'Unknown';
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Register Shadow Address</h2>
        <p className="text-gray-600">Please connect your wallet to register a shadow address.</p>
      </div>
    );
  }

  // Show loading state while checking registration
  if (registrationLoading && isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Shadow Address Status</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Checking registration status...</p>
        </div>
      </div>
    );
  }

  // Show registered status if user is already registered
  if (isRegistered) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-green-800">Shadow Address Registered</h2>
          <div className="flex items-center text-green-600">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">Active</span>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-green-800 mb-1">Registration Status</p>
              <p className="text-green-700">Your shadow address has been successfully registered and encrypted on-chain.</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-green-800 mb-1">Registered On</p>
              <p className="text-green-700">{formatRegistrationDate(registrationTimestamp)}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-green-800 mb-1">Bound Shadow Address(Encrypted)</p>
              {encryptedAddress ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-green-700 font-mono text-xs break-all bg-green-100 p-2 rounded">
                      {encryptedAddress}
                    </p>
                  </div>
                  
                  {decryptedAddress ? (
                    <div>
                      <p className="text-xs text-green-600 mb-1">Decrypted Address:</p>
                      <p className="text-green-700 font-mono text-sm break-all bg-green-100 p-2 rounded">
                        {decryptedAddress}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={decryptAddress}
                      disabled={isDecrypting}
                      className="flex items-center justify-center w-full bg-green-600 text-white text-sm py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isDecrypting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Decrypting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 16.5H9v1.5a1.5 1.5 0 01-1.5 1.5H6v1.5a1.5 1.5 0 01-1.5 1.5H3a1.5 1.5 0 01-1.5-1.5v-2.25A1.5 1.5 0 013 15.5l4.878-4.878A6 6 0 0118 8a6 6 0 00-3-5.197z" />
                          </svg>
                          Decrypt Shadow Address
                        </>
                      )}
                    </button>
                  )}
                  
                  {decryptError && (
                    <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                      {decryptError}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-green-700 text-sm">Loading encrypted address...</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">What's Next?</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Your encrypted shadow address can now be used for anonymous NFT verification</li>
            <li>• You can participate in airdrops without exposing your shadow address</li>
            <li>• The system will verify NFT ownership using your encrypted address</li>
          </ul>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p className="font-semibold">Privacy Protection:</p>
          <p>Your shadow address remains encrypted on-chain and can only be accessed by authorized contracts through FHE decryption.</p>
        </div>
      </div>
    );
  }

  // Show registration form if not registered
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