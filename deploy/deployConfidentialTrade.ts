import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  console.log("Deploying ConfidentialTrade with account:", deployer);

  // Get MockUSDT deployment first
  let mockUSDTAddress: string;
  try {
    const mockUSDT = await get("MockUSDT");
    mockUSDTAddress = mockUSDT.address;
    console.log("Using existing MockUSDT at:", mockUSDTAddress);
  } catch (error) {
    console.log("MockUSDT not found, deploying MockUSDT first...");
    const mockUSDTDeploy = await deploy("MockUSDT", {
      from: deployer,
      log: true,
      args: [],
    });
    mockUSDTAddress = mockUSDTDeploy.address;
    console.log("MockUSDT deployed to:", mockUSDTAddress);
  }

  const confidentialTrade = await deploy("ConfidentialTrade", {
    from: deployer,
    log: true,
    args: [mockUSDTAddress],
  });

  console.log("ConfidentialTrade deployed to:", confidentialTrade.address);
  console.log("ConfidentialTrade USDT token:", mockUSDTAddress);
  
  console.log("\n=== Next Steps ===");
  console.log("1. Set token prices using: npx hardhat confidential-trade:set-price");
  console.log("2. Mint USDT for testing: npx hardhat confidential-trade:mint-usdt");
  console.log("3. Register proxy address: npx hardhat confidential-trade:register");
  console.log("4. Make anonymous purchases: npx hardhat confidential-trade:purchase");
};

func.tags = ["ConfidentialTrade"];
func.dependencies = ["MockUSDT"];

export default func;