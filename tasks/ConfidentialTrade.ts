import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * ConfidentialTrade Tasks
 * =======================
 *
 * Tutorial: Deploy and Interact Locally (--network localhost)
 * ===========================================================
 *
 * 1. From a separate terminal window:
 *
 *   npx hardhat node
 *
 * 2. Deploy the MockUSDT contract first
 *
 *   npx hardhat --network localhost deploy:MockUSDT
 *
 * 3. Deploy the ConfidentialTrade contract
 *
 *   npx hardhat --network localhost deploy:ConfidentialTrade --usdt-token <MockUSDT_ADDRESS>
 *
 * 4. Mint some USDT for testing
 *
 *   npx hardhat --network localhost confidential-trade:mint-usdt --amount 10000
 *
 * 5. Set token prices
 *
 *   npx hardhat --network localhost confidential-trade:set-price --token-address 0x... --price 3000000000
 *
 * 6. Register an encrypted proxy address
 *
 *   npx hardhat --network localhost confidential-trade:register --address 0x1234567890123456789012345678901234567890
 *
 * 7. Make anonymous purchase
 *
 *   npx hardhat --network localhost confidential-trade:purchase --token-address 0x... --amount 1
 *
 * 8. Request decryption and withdrawal
 *
 *   npx hardhat --network localhost confidential-trade:request-decryption
 *
 */

/**
 * Example:
 *   - npx hardhat --network localhost confidential-trade:address
 *   - npx hardhat --network sepolia confidential-trade:address
 */
task("confidential-trade:address", "Prints the ConfidentialTrade contract address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const confidentialTrade = await deployments.get("ConfidentialTrade");

  console.log("ConfidentialTrade address is " + confidentialTrade.address);
});

/**
 * Example:
 *   - npx hardhat --network localhost confidential-trade:mint-usdt --amount 10000
 *   - npx hardhat --network sepolia confidential-trade:mint-usdt --amount 10000
 */
task("confidential-trade:mint-usdt", "Mint USDT tokens for testing")
  .addParam("amount", "The amount of USDT to mint (in whole numbers, decimals will be added automatically)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const amount = parseInt(taskArguments.amount);
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error(`Invalid amount: ${taskArguments.amount}`);
    }

    const MockUSDTDeployment = await deployments.get("MockUSDT");
    console.log(`MockUSDT: ${MockUSDTDeployment.address}`);

    const signers = await ethers.getSigners();
    const mockUSDTContract = await ethers.getContractAt("MockUSDT", MockUSDTDeployment.address);

    // Convert amount to include decimals (6 decimals for USDT)
    const amountWithDecimals = BigInt(amount) * BigInt(10 ** 6);

    const tx = await mockUSDTContract
      .connect(signers[0])
      .mint(signers[0].address, amountWithDecimals);
    console.log(`Wait for tx: ${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx: ${tx.hash} status=${receipt?.status}`);

    console.log(`Successfully minted ${amount} USDT to ${signers[0].address}`);
    
    const balance = await mockUSDTContract.balanceOf(signers[0].address);
    console.log(`New USDT balance: ${ethers.formatUnits(balance, 6)} USDT`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost confidential-trade:set-price --token-address 0x... --price 3000000000
 *   - npx hardhat --network sepolia confidential-trade:set-price --token-address 0x... --price 10000000
 */
task("confidential-trade:set-price", "Set token price for purchasing")
  .addOptionalParam("contract", "Optionally specify the ConfidentialTrade contract address")
  .addParam("tokenAddress", "The token contract address")
  .addParam("price", "The price in USDT (with 6 decimals)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const tokenAddress = taskArguments.tokenAddress;
    const price = parseInt(taskArguments.price);

    if (!ethers.isAddress(tokenAddress)) {
      throw new Error(`Invalid token address: ${tokenAddress}`);
    }
    if (!Number.isInteger(price) || price <= 0) {
      throw new Error(`Invalid price: ${taskArguments.price}`);
    }

    const ConfidentialTradeDeployment = taskArguments.contract
      ? { address: taskArguments.contract }
      : await deployments.get("ConfidentialTrade");
    console.log(`ConfidentialTrade: ${ConfidentialTradeDeployment.address}`);

    const signers = await ethers.getSigners();
    const confidentialTradeContract = await ethers.getContractAt("ConfidentialTrade", ConfidentialTradeDeployment.address);

    const tx = await confidentialTradeContract
      .connect(signers[0])
      .setPrice(tokenAddress, price);
    console.log(`Wait for tx: ${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx: ${tx.hash} status=${receipt?.status}`);

    console.log(`Successfully set price for token ${tokenAddress} to ${price} USDT (with decimals)`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost confidential-trade:register --address 0x1234567890123456789012345678901234567890
 *   - npx hardhat --network sepolia confidential-trade:register --address 0x1234567890123456789012345678901234567890
 */
task("confidential-trade:register", "Register an encrypted proxy address for anonymous trading")
  .addOptionalParam("contract", "Optionally specify the ConfidentialTrade contract address")
  .addParam("address", "The proxy address to encrypt and register")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const proxyAddress = taskArguments.address;
    if (!ethers.isAddress(proxyAddress)) {
      throw new Error(`Invalid address: ${proxyAddress}`);
    }

    await fhevm.initializeCLIApi();

    const ConfidentialTradeDeployment = taskArguments.contract
      ? { address: taskArguments.contract }
      : await deployments.get("ConfidentialTrade");
    console.log(`ConfidentialTrade: ${ConfidentialTradeDeployment.address}`);

    const signers = await ethers.getSigners();
    const confidentialTradeContract = await ethers.getContractAt("ConfidentialTrade", ConfidentialTradeDeployment.address);

    // Encrypt the proxy address
    const encryptedInput = await fhevm
      .createEncryptedInput(ConfidentialTradeDeployment.address, signers[0].address)
      .addAddress(proxyAddress)
      .encrypt();

    const tx = await confidentialTradeContract
      .connect(signers[0])
      .registerProxyAddress(encryptedInput.handles[0], encryptedInput.inputProof);
    console.log(`Wait for tx: ${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx: ${tx.hash} status=${receipt?.status}`);

    console.log(`Successfully registered encrypted proxy address for ${signers[0].address}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost confidential-trade:purchase --token-address 0x... --amount 1
 *   - npx hardhat --network sepolia confidential-trade:purchase --token-address 0x... --amount 5
 */
task("confidential-trade:purchase", "Make anonymous purchase of tokens")
  .addOptionalParam("contract", "Optionally specify the ConfidentialTrade contract address")
  .addParam("tokenAddress", "The token address to purchase")
  .addParam("amount", "The amount of tokens to buy")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const tokenAddress = taskArguments.tokenAddress;
    const amount = parseInt(taskArguments.amount);

    if (!ethers.isAddress(tokenAddress)) {
      throw new Error(`Invalid token address: ${tokenAddress}`);
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error(`Invalid amount: ${taskArguments.amount}`);
    }

    const ConfidentialTradeDeployment = taskArguments.contract
      ? { address: taskArguments.contract }
      : await deployments.get("ConfidentialTrade");
    console.log(`ConfidentialTrade: ${ConfidentialTradeDeployment.address}`);

    const signers = await ethers.getSigners();
    const confidentialTradeContract = await ethers.getContractAt("ConfidentialTrade", ConfidentialTradeDeployment.address);

    // Get token price first
    const tokenPrice = await confidentialTradeContract.getTokenPrice(tokenAddress);
    const totalCost = tokenPrice * BigInt(amount);
    
    console.log(`Token price: ${ethers.formatUnits(tokenPrice, 6)} USDT per token`);
    console.log(`Total cost: ${ethers.formatUnits(totalCost, 6)} USDT`);

    // Check user USDT balance
    const usdtAddress = await confidentialTradeContract.usdtToken();
    const mockUSDTContract = await ethers.getContractAt("MockUSDT", usdtAddress);
    const userBalance = await mockUSDTContract.balanceOf(signers[0].address);
    
    console.log(`User USDT balance: ${ethers.formatUnits(userBalance, 6)} USDT`);
    
    if (userBalance < totalCost) {
      throw new Error(`Insufficient USDT balance. Need ${ethers.formatUnits(totalCost, 6)} USDT but have ${ethers.formatUnits(userBalance, 6)} USDT`);
    }

    // Approve USDT spending
    const approveTx = await mockUSDTContract
      .connect(signers[0])
      .approve(ConfidentialTradeDeployment.address, totalCost);
    console.log(`Wait for approval tx: ${approveTx.hash}...`);
    await approveTx.wait();

    // Make purchase
    const tx = await confidentialTradeContract
      .connect(signers[0])
      .anonymousPurchase(tokenAddress, amount);
    console.log(`Wait for tx: ${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx: ${tx.hash} status=${receipt?.status}`);

    console.log(`Successfully purchased ${amount} tokens of ${tokenAddress} for ${ethers.formatUnits(totalCost, 6)} USDT`);

    // Show updated balances
    const newBalance = await confidentialTradeContract.getUserBalance(signers[0].address, tokenAddress);
    console.log(`New token balance: ${newBalance} tokens`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost confidential-trade:request-decryption
 *   - npx hardhat --network sepolia confidential-trade:request-decryption
 */
task("confidential-trade:request-decryption", "Request decryption of proxy address to enable withdrawal")
  .addOptionalParam("contract", "Optionally specify the ConfidentialTrade contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const ConfidentialTradeDeployment = taskArguments.contract
      ? { address: taskArguments.contract }
      : await deployments.get("ConfidentialTrade");
    console.log(`ConfidentialTrade: ${ConfidentialTradeDeployment.address}`);

    const signers = await ethers.getSigners();
    const confidentialTradeContract = await ethers.getContractAt("ConfidentialTrade", ConfidentialTradeDeployment.address);

    const tx = await confidentialTradeContract
      .connect(signers[0])
      .requestDecryption();
    console.log(`Wait for tx: ${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx: ${tx.hash} status=${receipt?.status}`);

    // Extract request ID from events
    const events = receipt?.logs || [];
    for (const event of events) {
      try {
        const parsedEvent = confidentialTradeContract.interface.parseLog(event);
        if (parsedEvent?.name === "WithdrawalRequested") {
          console.log(`Decryption request ID: ${parsedEvent.args.requestId}`);
        }
      } catch (e) {
        // Ignore parsing errors for non-matching events
      }
    }

    console.log(`Successfully requested decryption for withdrawal`);
    console.log(`Note: In a real environment, the decryption callback will be triggered automatically by the oracle.`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost confidential-trade:get-registration --user 0x1234567890123456789012345678901234567890
 *   - npx hardhat --network sepolia confidential-trade:get-registration --user 0x1234567890123456789012345678901234567890
 */
task("confidential-trade:get-registration", "Get user registration status")
  .addOptionalParam("contract", "Optionally specify the ConfidentialTrade contract address")
  .addOptionalParam("user", "The user address to check (defaults to first signer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const ConfidentialTradeDeployment = taskArguments.contract
      ? { address: taskArguments.contract }
      : await deployments.get("ConfidentialTrade");
    console.log(`ConfidentialTrade: ${ConfidentialTradeDeployment.address}`);

    const signers = await ethers.getSigners();
    const userAddress = taskArguments.user || signers[0].address;

    if (!ethers.isAddress(userAddress)) {
      throw new Error(`Invalid user address: ${userAddress}`);
    }

    const confidentialTradeContract = await ethers.getContractAt("ConfidentialTrade", ConfidentialTradeDeployment.address);

    const registration = await confidentialTradeContract.getUserRegistration(userAddress);

    console.log(`User: ${userAddress}`);
    console.log(`Is Registered: ${registration.isRegistered}`);
    if (registration.isRegistered) {
      const date = new Date(Number(registration.registrationTime) * 1000);
      console.log(`Registration Time: ${date.toISOString()}`);
    }
  });

/**
 * Example:
 *   - npx hardhat --network localhost confidential-trade:get-balance --user 0x... --token-address 0x...
 *   - npx hardhat --network sepolia confidential-trade:get-balance --user 0x... --token-address 0x...
 */
task("confidential-trade:get-balance", "Get user token balance in treasury")
  .addOptionalParam("contract", "Optionally specify the ConfidentialTrade contract address")
  .addOptionalParam("user", "The user address to check (defaults to first signer)")
  .addParam("tokenAddress", "The token address to check balance for")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const tokenAddress = taskArguments.tokenAddress;
    if (!ethers.isAddress(tokenAddress)) {
      throw new Error(`Invalid token address: ${tokenAddress}`);
    }

    const ConfidentialTradeDeployment = taskArguments.contract
      ? { address: taskArguments.contract }
      : await deployments.get("ConfidentialTrade");
    console.log(`ConfidentialTrade: ${ConfidentialTradeDeployment.address}`);

    const signers = await ethers.getSigners();
    const userAddress = taskArguments.user || signers[0].address;

    if (!ethers.isAddress(userAddress)) {
      throw new Error(`Invalid user address: ${userAddress}`);
    }

    const confidentialTradeContract = await ethers.getContractAt("ConfidentialTrade", ConfidentialTradeDeployment.address);

    const balance = await confidentialTradeContract.getUserBalance(userAddress, tokenAddress);

    console.log(`User: ${userAddress}`);
    console.log(`Token: ${tokenAddress}`);
    console.log(`Treasury Balance: ${balance} tokens`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost confidential-trade:get-pending-withdrawal --request-id 12345
 *   - npx hardhat --network sepolia confidential-trade:get-pending-withdrawal --request-id 12345
 */
task("confidential-trade:get-pending-withdrawal", "Get pending withdrawal details by request ID")
  .addOptionalParam("contract", "Optionally specify the ConfidentialTrade contract address")
  .addParam("requestId", "The withdrawal request ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const requestId = parseInt(taskArguments.requestId);
    if (!Number.isInteger(requestId)) {
      throw new Error(`Invalid request ID: ${taskArguments.requestId}`);
    }

    const ConfidentialTradeDeployment = taskArguments.contract
      ? { address: taskArguments.contract }
      : await deployments.get("ConfidentialTrade");
    console.log(`ConfidentialTrade: ${ConfidentialTradeDeployment.address}`);

    const confidentialTradeContract = await ethers.getContractAt("ConfidentialTrade", ConfidentialTradeDeployment.address);

    const pending = await confidentialTradeContract.getPendingWithdrawal(requestId);

    console.log(`Request ID: ${requestId}`);
    console.log(`User: ${pending.user}`);
    console.log(`Timestamp: ${new Date(Number(pending.timestamp) * 1000).toISOString()}`);
    console.log(`Complete: ${pending.complete}`);
  });