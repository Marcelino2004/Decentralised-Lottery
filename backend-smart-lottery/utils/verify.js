const { expect } = require("chai");
const { ethers, run, network } = require("hardhat");

async function verify(address, args) {
  console.log("Verifying...");
  try {
    await run("verify:verify", {
      address: address,
      constructorArguments: args,
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already Verified");
    } else {
      console.log(e);
    }
  }
}

module.exports = { verify };
