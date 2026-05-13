const { developmentChains } = require("../helper-hardhat.config");
const { network, ethers } = require("hardhat");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  const BASE_FEE = "250000000000000000";
  const GAS_PRICE_LINK = 1e9;

  const args = [BASE_FEE, GAS_PRICE_LINK];

  if (developmentChains.includes(network.name)) {
    log("Local network detected");

    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      log: true,
      args: args,
    });
  }
  log("Mocks deployed");
};

module.exports.tags = ["all", "mock"];
