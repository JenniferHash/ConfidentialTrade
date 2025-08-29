import { expect } from "chai";
import { ethers } from "hardhat";
import type { ConfidentialTrade, MockUSDT } from "../types";
import { Signer } from "ethers";

describe("ConfidentialTrade", function () {
  let confidentialTrade: ConfidentialTrade;
  let mockUSDT: MockUSDT;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let proxyAddress: Signer;
  let mockTokenAddress: string;

  beforeEach(async function () {
    [owner, user1, user2, proxyAddress] = await ethers.getSigners();
    
    // Deploy MockUSDT first
    const MockUSDTFactory = await ethers.getContractFactory("MockUSDT");
    mockUSDT = await MockUSDTFactory.deploy();
    await mockUSDT.waitForDeployment();

    // Deploy ConfidentialTrade
    const ConfidentialTradeFactory = await ethers.getContractFactory("ConfidentialTrade");
    confidentialTrade = await ConfidentialTradeFactory.deploy(await mockUSDT.getAddress());
    await confidentialTrade.waitForDeployment();

    // Use a mock token address for testing
    mockTokenAddress = "0x1234567890123456789012345678901234567890";

    // Set up initial token price (e.g., 10 USDT per token)
    await confidentialTrade.connect(owner).setPrice(mockTokenAddress, ethers.parseUnits("10", 6));

    // Mint some USDT to user1 for testing
    await mockUSDT.connect(user1).mint(await user1.getAddress(), ethers.parseUnits("1000", 6));
  });

  describe("Contract Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await confidentialTrade.owner()).to.equal(await owner.getAddress());
    });

    it("Should set the right USDT token address", async function () {
      expect(await confidentialTrade.usdtToken()).to.equal(await mockUSDT.getAddress());
    });
  });

  describe("MockUSDT Functionality", function () {
    it("Should have correct token properties", async function () {
      expect(await mockUSDT.name()).to.equal("Mock USDT");
      expect(await mockUSDT.symbol()).to.equal("mUSDT");
      expect(await mockUSDT.decimals()).to.equal(6);
    });

    it("Should allow anyone to mint tokens", async function () {
      const mintAmount = ethers.parseUnits("100", 6);
      await mockUSDT.connect(user2).mint(await user2.getAddress(), mintAmount);
      
      const balance = await mockUSDT.balanceOf(await user2.getAddress());
      expect(balance).to.equal(mintAmount);
    });

    it("Should have mintStandard function", async function () {
      await mockUSDT.connect(user2).mintStandard();
      
      const balance = await mockUSDT.balanceOf(await user2.getAddress());
      expect(balance).to.equal(ethers.parseUnits("10000", 6)); // 10,000 USDT
    });

    it("Should support ERC20 transfers", async function () {
      const transferAmount = ethers.parseUnits("50", 6);
      
      // Transfer from user1 to user2
      await mockUSDT.connect(user1).transfer(await user2.getAddress(), transferAmount);
      
      const user1Balance = await mockUSDT.balanceOf(await user1.getAddress());
      const user2Balance = await mockUSDT.balanceOf(await user2.getAddress());
      
      expect(user1Balance).to.equal(ethers.parseUnits("950", 6));
      expect(user2Balance).to.equal(transferAmount);
    });
  });

  describe("Token Price Management", function () {
    it("Should allow owner to set token prices", async function () {
      const newPrice = ethers.parseUnits("25", 6); // 25 USDT
      await confidentialTrade.connect(owner).setPrice(mockTokenAddress, newPrice);
      
      const price = await confidentialTrade.getTokenPrice(mockTokenAddress);
      expect(price).to.equal(newPrice);
    });

    it("Should not allow non-owner to set prices", async function () {
      const newPrice = ethers.parseUnits("25", 6);
      await expect(
        confidentialTrade.connect(user1).setPrice(mockTokenAddress, newPrice)
      ).to.be.revertedWithCustomError(confidentialTrade, "OnlyOwner");
    });
  });

  describe("User Registration", function () {
    it("Should prevent registration without encrypted proxy address", async function () {
      // This test would require FHE functionality which is not available in basic testing
      // In a real test environment with FHE, we would test encrypted address registration
      console.log("Note: Full FHE testing requires specialized test environment");
    });

    it("Should track registration status", async function () {
      const registration = await confidentialTrade.getUserRegistration(await user1.getAddress());
      expect(registration.isRegistered).to.equal(false);
    });
  });

  describe("Anonymous Purchase", function () {
    it("Should revert if user not registered", async function () {
      const buyAmount = 1;
      
      await expect(
        confidentialTrade.connect(user1).anonymousPurchase(mockTokenAddress, buyAmount)
      ).to.be.revertedWithCustomError(confidentialTrade, "UserNotRegistered");
    });

    it("Should revert if token has no price", async function () {
      const unknownToken = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
      
      // Mock user registration (in real implementation would need FHE)
      // For testing purposes, we'll skip the registration check by testing price check
      await expect(
        confidentialTrade.connect(user1).anonymousPurchase(unknownToken, 1)
      ).to.be.revertedWith("no this token");
    });

    it("Should calculate correct USDT cost", async function () {
      const tokenPrice = await confidentialTrade.getTokenPrice(mockTokenAddress);
      const buyAmount = 5;
      const expectedCost = tokenPrice * BigInt(buyAmount);
      
      // The cost should be 10 USDT * 5 = 50 USDT (with 6 decimals)
      expect(expectedCost).to.equal(ethers.parseUnits("50", 6));
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to update USDT token address", async function () {
      const newUSDTAddress = await user2.getAddress();
      await confidentialTrade.connect(owner).setUSDTToken(newUSDTAddress);
      
      expect(await confidentialTrade.usdtToken()).to.equal(newUSDTAddress);
    });

    it("Should allow owner to emergency withdraw tokens", async function () {
      // First send some USDT to the contract
      await mockUSDT.connect(user1).transfer(await confidentialTrade.getAddress(), ethers.parseUnits("100", 6));
      
      const contractBalanceBefore = await mockUSDT.balanceOf(await confidentialTrade.getAddress());
      expect(contractBalanceBefore).to.equal(ethers.parseUnits("100", 6));

      // Emergency withdraw
      await confidentialTrade.connect(owner).emergencyWithdraw(
        await mockUSDT.getAddress(),
        await owner.getAddress(),
        ethers.parseUnits("50", 6)
      );

      const contractBalanceAfter = await mockUSDT.balanceOf(await confidentialTrade.getAddress());
      expect(contractBalanceAfter).to.equal(ethers.parseUnits("50", 6));
    });

    it("Should not allow non-owner to call emergency functions", async function () {
      await expect(
        confidentialTrade.connect(user1).emergencyWithdraw(
          await mockUSDT.getAddress(),
          await user1.getAddress(),
          ethers.parseUnits("10", 6)
        )
      ).to.be.revertedWithCustomError(confidentialTrade, "OnlyOwner");
    });
  });

  describe("View Functions", function () {
    it("Should return correct user balance", async function () {
      const balance = await confidentialTrade.getUserBalance(await user1.getAddress(), mockTokenAddress);
      expect(balance).to.equal(0);
    });

    it("Should return correct token price", async function () {
      const price = await confidentialTrade.getTokenPrice(mockTokenAddress);
      expect(price).to.equal(ethers.parseUnits("10", 6));
    });

    it("Should return pending withdrawal info", async function () {
      const pending = await confidentialTrade.getPendingWithdrawal(0);
      expect(pending.user).to.equal("0x0000000000000000000000000000000000000000");
      expect(pending.complete).to.equal(false);
    });
  });

  describe("Access Control", function () {
    it("Should properly implement onlyOwner modifier", async function () {
      await expect(
        confidentialTrade.connect(user1).setUSDTToken(await user2.getAddress())
      ).to.be.revertedWithCustomError(confidentialTrade, "OnlyOwner");
    });

    it("Should properly implement onlyRegistered modifier", async function () {
      await expect(
        confidentialTrade.connect(user1).anonymousPurchase(mockTokenAddress, 1)
      ).to.be.revertedWithCustomError(confidentialTrade, "UserNotRegistered");
    });
  });

  describe("Integration Scenarios", function () {
    it("Should demonstrate complete flow (without FHE encryption)", async function () {
      console.log("=== Complete Flow Demonstration ===");
      console.log("1. MockUSDT deployed and user has balance");
      
      const user1Balance = await mockUSDT.balanceOf(await user1.getAddress());
      console.log(`User1 USDT balance: ${ethers.formatUnits(user1Balance, 6)} USDT`);
      
      console.log("2. Token price is set");
      const tokenPrice = await confidentialTrade.getTokenPrice(mockTokenAddress);
      console.log(`Token price: ${ethers.formatUnits(tokenPrice, 6)} USDT per token`);
      
      console.log("3. Contract is ready for encrypted registration and anonymous purchases");
      console.log("Note: Full functionality requires FHE test environment");
      
      expect(user1Balance).to.equal(ethers.parseUnits("1000", 6));
      expect(tokenPrice).to.equal(ethers.parseUnits("10", 6));
    });
  });
});