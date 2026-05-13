const { ethers } = require("hardhat");

const networkConfig = {
  11155111: {
    name: "sepolia",
    vrfCoordinatorV2: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
    entranceFee: "1000000", //ethers.utils.parseEther("0.01"), // 0.01 ETH
    keyHash:
      "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
    subscriptionId:
      "50073877226116534276996172581020916480215752909754926972016824892030690781075",
    callbackGasLimit: "2500000",
    interval: "300",
  },
  31337: {
    name: "hardhat",
    entranceFee: "1000000", //ethers.utils.parseEther("0.01"), // 0.01 ETH
    keyHash:
      "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
    callbackGasLimit: "500000",
    interval: "30",
  },
};

const developmentChains = ["hardhat", "localhost"];

module.exports = { networkConfig, developmentChains };
