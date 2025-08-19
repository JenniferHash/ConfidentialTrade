import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, ANONYMOUS_AUTH_ABI } from '../config/contracts';

export const useRegistrationStatus = () => {
  const { address, isConnected } = useAccount();

  const {
    data: registrationData,
    isError,
    isLoading,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.ANONYMOUS_AUTH as `0x${string}`,
    abi: ANONYMOUS_AUTH_ABI,
    functionName: 'getUserRegistration',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
    },
  });

  // registrationData is now a UserRegistration struct
  const userReg = registrationData as { encryptedAddress: `0x${string}`; isRegistered: boolean; registrationTime: bigint } | undefined;
  const isRegistered = userReg ? userReg.isRegistered : false;
  const registrationTimestamp = userReg ? userReg.registrationTime : BigInt(0);
  
  // encryptedAddress is already a bytes32 hex string
  const encryptedAddress = userReg && userReg.encryptedAddress !== '0x0000000000000000000000000000000000000000000000000000000000000000' 
    ? userReg.encryptedAddress 
    : null;

  return {
    isRegistered,
    registrationTimestamp,
    encryptedAddress,
    isLoading,
    isError,
    refetch,
  };
};