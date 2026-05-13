const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat.config");
const { assert, expect } = require("chai");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("Lottery Staging Tests", async function () {
      this.timeout(1800000);
      let lottery, deployer, entranceFee;

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        lottery = await ethers.getContract("Lottery", deployer);
        entranceFee = await lottery.getEntranceFee();
      });

      it("Now works with Chainlink keepers and VRF, entering lottery and picking winners", async function () {
        const accounts = await ethers.getSigners();
        const startingTimeStamp = await lottery.getLastTimeStamp();

        await new Promise(async (resolve, reject) => {
          lottery.once("WinnerPicked", async () => {
            console.log("WinnerPicked event fired");
            try {
              const recentWinner = await lottery.getRecentWinner();
              const endingTimeStamp = await lottery.getLastTimeStamp();
              const stateOfLottery = await lottery.getLotteryState();
              const winnerEndingBalance = await accounts[0].getBalance();

              await expect(lottery.getPlayers(0)).to.be.reverted;
              assert.equal(stateOfLottery, 0);
              assert(endingTimeStamp > startingTimeStamp);
              assert.equal(recentWinner.toString(), accounts[0].address);
              assert.equal(
                winnerEndingBalance.toString(),
                (winnerStartingBalance + entranceFee).toString()
              );
              resolve();
            } catch (e) {
              console.log(e);
              reject(e);
            }
          });
          const winnerStartingBalance = await accounts[0].getBalance();
          const tx = await lottery.enterLottery({ value: entranceFee });
          await tx.wait(1);
          console.log("Entered lottery, waiting for Chainlink VRF...");
        });
      });
    });
