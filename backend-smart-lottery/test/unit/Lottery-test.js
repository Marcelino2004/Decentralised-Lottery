require("@nomicfoundation/hardhat-chai-matchers");

const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat.config");
const { assert, expect } = require("chai");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Lottery Unit Tests", async function () {
      let lottery, vrfCoordinatorV2Mock, deployer, entranceFee, interval;
      const chainId = network.config.chainId;

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        lottery = await ethers.getContract("Lottery", deployer);
        console.log("CHECKING LOTTERY");
        console.log(lottery);
        vrfCoordinatorV2Mock = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        );
        entranceFee = await lottery.getEntranceFee();
        interval = await lottery.getInterval();
      });

      describe("Constructor", async function () {
        it("Initialize lottery correctly", async function () {
          const lotteryState = await lottery.getLotteryState();
          assert.equal(lotteryState.toString(), "0");
          assert.equal(
            interval.toString(),
            networkConfig[chainId]["interval"].toString()
          );
        });
      });

      describe("enterLottery", function () {
        it("Reverted when you do not pay enough ETH", async function () {
          await expect(lottery.enterLottery()).to.be.revertedWithCustomError(
            lottery,
            "Lottery__NotEnoughEntranceFee"
          );
        });

        it("Record players who enter correctly", async function () {
          await lottery.enterLottery({ value: entranceFee });
          const playerFromContract = await lottery.getPlayers(0);
          assert.equal(playerFromContract, deployer);
        });

        it("Emits event on enter", async function () {
          await expect(lottery.enterLottery({ value: entranceFee }))
            .to.emit(lottery, "LotteryEnter")
            .withArgs(deployer);
        });

        it("Does not allow entrance when lottery is calculating", async function () {
          await lottery.setLotteryStateForTest(1);
          await expect(
            lottery.enterLottery({ value: entranceFee })
          ).to.be.revertedWithCustomError(lottery, "Lottery__NotOpen");
          /*
          // Try to change lottery state to calculating
          //pretend that (interval + 1) time has passed
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 1,
          ]);
          //mine a block so that evm recognize the new timestamp
          await network.provider.send("evm_mine", []);
          //Pretend to be a chainlink keeper
          await lottery.performUpkeep("0x");

          await expect(
            lottery.enterLottery({ value: entranceFee })
          ).to.be.revertedWithCustomError(lottery, "Lottery__NotOpen");
          */
        });
      });

      describe("checkUpkeep", function () {
        it("Returns false if people has not send any ETH", async function () {
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 1,
          ]);
          await network.provider.send("evm_mine", []);

          // For newer ethers.js, use direct function call
          const result = await lottery.checkUpkeep("0x");
          // If checkUpkeep returns multiple values, destructure them
          const upkeepNeeded = result[0] || result.upkeepNeeded;
          assert(!upkeepNeeded);
        });

        /*
        it("returns false if raffle isn't open", async () => {
          await lottery.enterLottery({ value: entranceFee });
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          await lottery.performUpkeep("0x"); // changes the state to calculating
          const lotteryState = await lottery.getLotteryState(); // stores the new state
          const { upkeepNeeded } = await lottery.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
          assert.equal(lotteryState.toString() == "1", upkeepNeeded == false);
        });
        */
      });
      describe("performUpkeep", function () {
        // Full VRF integration tests
        it("Can only run if upkeep is needed", async function () {
          await expect(
            lottery.performUpkeep("0x")
          ).to.be.revertedWithCustomError(lottery, "Lottery__upkeepNotNeeded");
        });
      });

      describe("fulfillRandomWords", function () {
        beforeEach(async function () {
          deployer = (await getNamedAccounts()).deployer;
          await deployments.fixture(["all"]);
          lottery = await ethers.getContract("Lottery", deployer);
          console.log("Checking lottery");
          console.log(lottery);
          console.log(lottery.address);
          await lottery.enterLottery({ value: entranceFee });
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 1,
          ]);
          await network.provider.send("evm_mine", []);
        });
        it("Can only be called after performUpkeep", async function () {
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(0, lottery.address)
          ).to.be.revertedWith("nonexistent request");
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(1, lottery.address)
          ).to.be.revertedWith("nonexistent request");
        });
        /*
        it("Pick winner, reset lottery", async function () {
          const additionalEntries = 3;
          const startingIndex = 1;
          const accounts = await ethers.getSigner();
          for (
            let i = startingIndex;
            i < startingIndex + additionalEntries;
            i++
          ) {
            const accountConnectedLottery = lottery.connect(accounts[i]);
            await accountConnectedLottery.enterLottery({ value: entranceFee });
          }
          const startingTimeStamp = await lottery.getLastTimeStamp();

          await new Promise(async (resolve, reject) => {
            lottery.once("WinnerPicked", async () => {
              console.log("Event found");
              try {
                const recentWinner = await lottery.getRecentWinner();
                const endingTimeStamp = await lottery.getLastTimeStamp();
                const numOfPlayers = await lottery.getNumOfPlayers();
                const stateOfLottery = await lottery.getLotteryState();
                const winnerBalance = await accounts[2].getBalance();
                await expect(raffle.getPlayer(0)).to.be.reverted;
                // Comparisons to check if our ending values are correct:
                assert.equal(recentWinner.toString(), accounts[2].address);
                assert.equal(raffleState, 0);
                assert.equal(
                  winnerBalance.toString(),
                  startingBalance // startingBalance + ( (raffleEntranceFee * additionalEntrances) + raffleEntranceFee )
                    .add(
                      raffleEntranceFee
                        .mul(additionalEntrances)
                        .add(raffleEntranceFee)
                    )
                    .toString()
                );
                assert(endingTimeStamp > startingTimeStamp);
                resolve(); // if try passes, resolves the promise
              } catch (e) {
                reject(e);
              }
            });
            // kicking off the event by mocking the chainlink keepers and vrf coordinator
            try {
              const tx = await raffle.performUpkeep("0x");
              const txReceipt = await tx.wait(1);
              startingBalance = await accounts[2].getBalance();
              await vrfCoordinatorV2Mock.fulfillRandomWords(
                txReceipt.events[1].args.requestId,
                raffle.address
              );
            } catch (e) {
              reject(e);
            }
          });
        }); */
      });
    });
