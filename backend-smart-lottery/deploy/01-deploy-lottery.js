const { verify } = require("../utils/verify");

const { network, ethers } = require("hardhat");
const { parseEther } = require("ethers");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat.config");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let vrfCoordinatorV2Address;
  let subscriptionId;

  // Debug information
  console.log("=== DEPLOYMENT DEBUG INFO ===");
  console.log("Current network:", network.name);
  console.log("Chain ID:", chainId);
  console.log(
    "Is development chain:",
    developmentChains.includes(network.name)
  );
  console.log("Development chains:", developmentChains);

  const FUND_SUB = parseEther("5");

  if (developmentChains.includes(network.name)) {
    console.log("Deploying to development chain...");

    try {
      // Use deployments.get() instead of ethers.getContract()
      const vrfCoordinatorV2Mock = await get("VRFCoordinatorV2Mock");
      console.log("Mock contract found at:", vrfCoordinatorV2Mock.address);

      // Get the contract instance
      const vrfCoordinatorV2MockContract = await ethers.getContractAt(
        "VRFCoordinatorV2Mock",
        vrfCoordinatorV2Mock.address
      );

      vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;

      console.log("Creating subscription...");
      const transactionResponse =
        await vrfCoordinatorV2MockContract.createSubscription();
      const transactionReceipt = await transactionResponse.wait(1);

      console.log("Transaction status:", transactionReceipt.status);
      console.log("Transaction hash:", transactionReceipt.transactionHash);

      // Debug the receipt structure
      console.log("Events:", transactionReceipt.events);
      console.log("Logs:", transactionReceipt.logs);

      // Try multiple ways to extract subscription ID
      if (transactionReceipt.events && transactionReceipt.events.length > 0) {
        console.log("Using events to get subscription ID");
        console.log("Event 0:", transactionReceipt.events[0]);
        subscriptionId = transactionReceipt.events[0].args.subId;
      } else if (
        transactionReceipt.logs &&
        transactionReceipt.logs.length > 0
      ) {
        console.log("Using logs to get subscription ID");
        console.log("Log 0:", transactionReceipt.logs[0]);

        // The log has parsed args, so we can access them directly
        if (
          transactionReceipt.logs[0].args &&
          transactionReceipt.logs[0].args.length > 0
        ) {
          subscriptionId = transactionReceipt.logs[0].args[0]; // First argument is the subscription ID
          console.log("Extracted subscription ID from args:", subscriptionId);
        } else if (
          transactionReceipt.logs[0].topics &&
          transactionReceipt.logs[0].topics.length > 1
        ) {
          // Fallback: extract from topics
          subscriptionId = ethers.getBigInt(
            transactionReceipt.logs[0].topics[1]
          );
          console.log("Extracted subscription ID from topics:", subscriptionId);
        } else {
          throw new Error("Could not extract subscription ID from log");
        }
      } else {
        throw new Error(
          "Could not find subscription ID in transaction receipt"
        );
      }

      console.log("Subscription ID:", subscriptionId.toString());

      // Fund subscription
      console.log("Funding subscription...");
      await vrfCoordinatorV2MockContract.fundSubscription(
        subscriptionId,
        FUND_SUB
      );
      console.log("Subscription funded successfully");
    } catch (error) {
      console.error("Error in development chain deployment:", error);
      throw error;
    }
  } else {
    console.log("Deploying to live network...");
    vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
    subscriptionId = networkConfig[chainId]["subscriptionId"];
  }

  // Validate all required parameters
  console.log("=== VALIDATION ===");
  console.log("vrfCoordinatorV2Address:", vrfCoordinatorV2Address);
  console.log("subscriptionId:", subscriptionId?.toString());

  if (!vrfCoordinatorV2Address) {
    throw new Error("vrfCoordinatorV2Address is undefined");
  }
  if (!subscriptionId) {
    throw new Error("subscriptionId is undefined");
  }

  const keyHash = networkConfig[chainId]["keyHash"];
  const entranceFee = networkConfig[chainId]["entranceFee"];
  const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];
  const interval = networkConfig[chainId]["interval"];

  console.log("keyHash:", keyHash);
  console.log("entranceFee:", entranceFee);
  console.log("callbackGasLimit:", callbackGasLimit);
  console.log("interval:", interval);

  const args = [
    vrfCoordinatorV2Address,
    entranceFee,
    keyHash,
    subscriptionId,
    callbackGasLimit,
    interval,
  ];

  console.log("=== DEPLOYMENT ARGS ===");
  args.forEach((arg, index) => {
    console.log(`Arg ${index}:`, arg);
  });

  const lottery = await deploy("Lottery", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

  // if (!developmentChains.includes(network.name) && ETHERSCAN_API_KEY) {
  //   log("Verifying...");
  //   await verify(lottery.address, args);
  // }
  // log("-------------------------------------");
};

module.exports.tags = ["all", "lottery"];

/* Old script
const { network, ethers } = require("hardhat");
const { verify } = require("../helper-hardhat.config");
const { parseEther } = require("ethers");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat.config");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let vrfCoordinatorV2Address;
  let subscriptionId;

  // Debug information
  console.log("=== DEPLOYMENT DEBUG INFO ===");
  console.log("Current network:", network.name);
  console.log("Chain ID:", chainId);
  console.log(
    "Is development chain:",
    developmentChains.includes(network.name)
  );
  console.log("Development chains:", developmentChains);

  const FUND_SUB = parseEther("5");

  if (developmentChains.includes(network.name)) {
    console.log("Deploying to development chain...");

    try {
      // Use deployments.get() instead of ethers.getContract()
      const vrfCoordinatorV2Mock = await get("VRFCoordinatorV2Mock");
      console.log("Mock contract found at:", vrfCoordinatorV2Mock.address);

      // Get the contract instance
      const vrfCoordinatorV2MockContract = await ethers.getContractAt(
        "VRFCoordinatorV2Mock",
        vrfCoordinatorV2Mock.address
      );

      vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;

      console.log("Creating subscription...");
      const transactionResponse =
        await vrfCoordinatorV2MockContract.createSubscription();
      const transactionReceipt = await transactionResponse.wait(1);

      console.log("Transaction status:", transactionReceipt.status);
      console.log("Transaction hash:", transactionReceipt.transactionHash);

      // Debug the receipt structure
      console.log("Events:", transactionReceipt.events);
      console.log("Logs:", transactionReceipt.logs);

      // Try multiple ways to extract subscription ID
      if (transactionReceipt.events && transactionReceipt.events.length > 0) {
        console.log("Using events to get subscription ID");
        console.log("Event 0:", transactionReceipt.events[0]);
        subscriptionId = transactionReceipt.events[0].args.subId;
      } else if (
        transactionReceipt.logs &&
        transactionReceipt.logs.length > 0
      ) {
        console.log("Using logs to get subscription ID");
        console.log("Log 0:", transactionReceipt.logs[0]);

        // For logs, we might need to decode the data
        // The subscription ID is typically the first topic or in the data
        if (
          transactionReceipt.logs[0].topics &&
          transactionReceipt.logs[0].topics.length > 1
        ) {
          subscriptionId = ethers.BigNumber.from(
            transactionReceipt.logs[0].topics[1]
          );
        } else {
          // Fallback: try to decode the data
          subscriptionId = ethers.BigNumber.from(
            transactionReceipt.logs[0].data
          );
        }
      } else {
        throw new Error(
          "Could not find subscription ID in transaction receipt"
        );
      }

      console.log("Subscription ID:", subscriptionId.toString());

      // Fund subscription
      console.log("Funding subscription...");
      await vrfCoordinatorV2MockContract.fundSubscription(
        subscriptionId,
        FUND_SUB
      );
      console.log("Subscription funded successfully");
    } catch (error) {
      console.error("Error in development chain deployment:", error);
      throw error;
    }
  } else {
    console.log("Deploying to live network...");
    vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
    subscriptionId = networkConfig[chainId]["subscriptionId"];
  }

  // Validate all required parameters
  console.log("=== VALIDATION ===");
  console.log("vrfCoordinatorV2Address:", vrfCoordinatorV2Address);
  console.log("subscriptionId:", subscriptionId?.toString());

  if (!vrfCoordinatorV2Address) {
    throw new Error("vrfCoordinatorV2Address is undefined");
  }
  if (!subscriptionId) {
    throw new Error("subscriptionId is undefined");
  }

  const keyHash = networkConfig[chainId]["keyHash"];
  const entranceFee = networkConfig[chainId]["entranceFee"];
  const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];
  const interval = networkConfig[chainId]["interval"];

  console.log("keyHash:", keyHash);
  console.log("entranceFee:", entranceFee);
  console.log("callbackGasLimit:", callbackGasLimit);
  console.log("interval:", interval);

  const args = [
    vrfCoordinatorV2Address,
    entranceFee,
    keyHash,
    subscriptionId,
    callbackGasLimit,
    interval,
  ];

  console.log("=== DEPLOYMENT ARGS ===");
  args.forEach((arg, index) => {
    console.log(`Arg ${index}:`, arg);
  });

  const lottery = await deploy("Lottery", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

  if (!developmentChains.includes(network.name) && ETHERSCAN_API_KEY) {
    log("Verifying...");
    await verify(lottery.address, args);
  }
  log("-------------------------------------");
};

module.exports.tags = ["all", "lottery"];

*/
