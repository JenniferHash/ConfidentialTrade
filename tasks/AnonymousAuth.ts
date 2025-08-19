import { task, types } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

// Helper function to get contract address
async function getAnonymousAuthContract(ethers: any, deployments: any, contractAddress?: string) {
  let address = contractAddress;
  if (!address) {
    const deployment = await deployments.get("AnonymousAuth");
    address = deployment.address;
    console.log("Using deployed AnonymousAuth at:", address);
  }
  return await ethers.getContractAt("AnonymousAuth", address);
}

task("anonymous-auth:register", "Register encrypted address for anonymous authentication")
  .addParam("targetAddress", "The target address to encrypt and register")
  .addOptionalParam("address", "Optionally specify the AnonymousAuth contract address")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments, fhevm }) {
    const { targetAddress } = taskArguments;
    
    await fhevm.initializeCLIApi();
    
    const [signer] = await ethers.getSigners();
    const anonymousAuth = await getAnonymousAuthContract(ethers, deployments, taskArguments.address);
    
    console.log("Registering encrypted address for:", signer.address);
    console.log("Target address to encrypt:", targetAddress);
    
    // Encrypt the target address using Zama FHE
    const encryptedInput = await fhevm
      .createEncryptedInput(anonymousAuth.target, signer.address)
      .addAddress(targetAddress)
      .encrypt();
    
    const tx = await anonymousAuth
      .connect(signer)
      .registerEncryptedAddress(encryptedInput.handles[0], encryptedInput.inputProof);
    
    console.log(`Wait for tx:${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);
    
    console.log("Registration successful!");
  });

task("anonymous-auth:authorize-nft", "Authorize NFT contract for verification")
  .addParam("nft", "The NFT contract address to authorize")
  .addOptionalParam("authorized", "Whether to authorize (true) or deauthorize (false)", true, types.boolean)
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const { nft, authorized } = taskArguments;
    
    const [signer] = await ethers.getSigners();
    const anonymousAuth = await getAnonymousAuthContract(ethers, deployments);
    
    console.log(`${authorized ? 'Authorizing' : 'Deauthorizing'} NFT contract:`, nft);
    
    const tx = await anonymousAuth.connect(signer).authorizeNFTContract(nft, authorized);
    await tx.wait();
    
    console.log("Authorization update successful! Transaction hash:", tx.hash);
  });

task("anonymous-auth:authorize-token", "Authorize token contract for airdrops")
  .addParam("token", "The token contract address to authorize")
  .addOptionalParam("authorized", "Whether to authorize (true) or deauthorize (false)", true, types.boolean)
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const { token, authorized } = taskArguments;
    
    const [signer] = await ethers.getSigners();
    const anonymousAuth = await getAnonymousAuthContract(ethers, deployments);
    
    console.log(`${authorized ? 'Authorizing' : 'Deauthorizing'} token contract:`, token);
    
    const tx = await anonymousAuth.connect(signer).authorizeTokenContract(token, authorized);
    await tx.wait();
    
    console.log("Authorization update successful! Transaction hash:", tx.hash);
  });

task("anonymous-auth:verify-nft", "Request NFT verification for anonymous address")
  .addParam("nft", "The NFT contract address to verify")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const { nft } = taskArguments;
    
    const [signer] = await ethers.getSigners();
    const anonymousAuth = await getAnonymousAuthContract(ethers, deployments);
    
    console.log("Requesting NFT verification for contract:", nft);
    
    const tx = await anonymousAuth.connect(signer).requestNFTVerification(nft);
    const receipt = await tx.wait();
    if(!receipt)return
    // 从事件中获取验证ID  
    const events = await anonymousAuth.queryFilter(
      anonymousAuth.filters.NFTVerificationRequested(),
      receipt.blockNumber
    );
    const verificationId = events[0]?.args?.verificationId;
    
    console.log("NFT verification requested! Transaction hash:", tx.hash);
    console.log("Verification ID:", verificationId);
  });

task("anonymous-auth:check-airdrop", "Check airdrop eligibility")
  .addParam("user", "The user address to check")
  .addParam("token", "The token contract address")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const { user, token } = taskArguments;
    
    const anonymousAuth = await getAnonymousAuthContract(ethers, deployments);
    
    console.log("Checking airdrop eligibility for user:", user);
    console.log("Token contract:", token);
    
    const [hasAirdrop, amount, claimed] = await anonymousAuth.checkAirdropEligibility(user, token);
    
    console.log("Has airdrop:", hasAirdrop);
    console.log("Amount:", ethers.formatEther(amount));
    console.log("Claimed:", claimed);
  });

task("anonymous-auth:claim-airdrop", "Claim available airdrop")
  .addParam("token", "The token contract address")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const { token } = taskArguments;
    
    const [signer] = await ethers.getSigners();
    const anonymousAuth = await getAnonymousAuthContract(ethers, deployments);
    
    console.log("Claiming airdrop for token:", token);
    
    const tx = await anonymousAuth.connect(signer).claimAirdrop(token);
    await tx.wait();
    
    console.log("Airdrop claimed! Transaction hash:", tx.hash);
  });

task("anonymous-auth:get-user-registration", "Get user registration info")
  .addParam("user", "The user address to check")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const { user } = taskArguments;
    
    const anonymousAuth = await getAnonymousAuthContract(ethers, deployments);
    
    const [isRegistered, registrationTime] = await anonymousAuth.getUserRegistration(user);
    
    console.log("User:", user);
    console.log("Is registered:", isRegistered);
    if (isRegistered) {
      console.log("Registration time:", new Date(Number(registrationTime) * 1000).toLocaleString());
    }
  });

task("anonymous-auth:get-verification", "Get NFT verification info")
  .addParam("verificationId", "The verification ID to check")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const { verificationId } = taskArguments;
    
    const anonymousAuth = await getAnonymousAuthContract(ethers, deployments);
    
    const [nftContract, verifiedAddress, hasNFT, verificationTime] = await anonymousAuth.getNFTVerification(verificationId);
    
    console.log("Verification ID:", verificationId);
    console.log("NFT contract:", nftContract);
    console.log("Verified address:", verifiedAddress);
    console.log("Has NFT:", hasNFT);
    if (verificationTime > 0) {
      console.log("Verification time:", new Date(Number(verificationTime) * 1000).toLocaleString());
    }
  });