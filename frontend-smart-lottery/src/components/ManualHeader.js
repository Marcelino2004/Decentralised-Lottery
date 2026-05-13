"use client";

import { useMoralis } from "react-moralis";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { LotteryABI, LOTTTERY_CONTRACT_ADDRESS } from "../constants/constants";

export default function ManualHeader() {
  const {
    enableWeb3,
    account,
    isWeb3Enabled,
    Moralis,
    deactivateWeb3,
    isWeb3EnableLoading,
  } = useMoralis();

  const [lotteryState, setLotteryState] = useState(null);
  const [entranceFee, setEntranceFee] = useState("0");
  const [isEntering, setIsEntering] = useState(false);
  const [hasEntered, setHasEntered] = useState(false); // <-- track if user has entered

  // Enable Web3 if already connected
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isWeb3Enabled && window.localStorage.getItem("connected")) {
      enableWeb3();
    }
  }, [isWeb3Enabled]);

  // Handle account changes
  useEffect(() => {
    if (!Moralis || typeof Moralis.onAccountChanged !== "function") return;

    const handler = (account) => {
      console.log(`Account changed to ${account}`);
      if (!account) {
        window.localStorage.removeItem("connected");
        deactivateWeb3();
        setHasEntered(false); // reset entered status
      }
    };

    Moralis.onAccountChanged(handler);

    return () => {
      if (Moralis.offAccountChanged) {
        Moralis.offAccountChanged(handler);
      }
    };
  }, [Moralis]);

  // Fetch lottery state, entrance fee, and check if current account has entered
  const fetchLotteryData = async () => {
    if (!account) return;
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        LOTTTERY_CONTRACT_ADDRESS,
        LotteryABI,
        provider,
      );

      const state = await contract.getLotteryState();
      const fee = await contract.getEntranceFee();
      const numPlayers = await contract.getNumOfPlayers();

      setLotteryState(state); // 0 = OPEN, 1 = CALCULATING
      setEntranceFee(fee.toString());

      // Check if account is in players list
      let entered = false;
      for (let i = 0; i < numPlayers.toNumber(); i++) {
        const player = await contract.getPlayers(i);
        if (player.toLowerCase() === account.toLowerCase()) {
          entered = true;
          break;
        }
      }
      setHasEntered(entered);
    } catch (err) {
      console.error("Failed to fetch lottery data:", err);
    }
  };

  useEffect(() => {
    fetchLotteryData();
    const interval = setInterval(fetchLotteryData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [account]);

  // Enter lottery function
  const enterLottery = async () => {
    if (!account || hasEntered) return; // prevent double entry
    setIsEntering(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        LOTTTERY_CONTRACT_ADDRESS,
        LotteryABI,
        signer,
      );
      const tx = await contract.enterLottery({ value: entranceFee });
      console.log("Entrance fee being sent:", entranceFee);
      await tx.wait();
      alert("Successfully entered the lottery!");
      setHasEntered(true); // mark as entered
      fetchLotteryData();
    } catch (err) {
      console.error(err);
      alert("Transaction failed!");
    } finally {
      setIsEntering(false);
    }
  };

  return (
    <header className="flex flex-col md:flex-row justify-between items-center p-4 bg-gray-900 shadow-md rounded-xl gap-3">
      <h1 className="text-white font-bold text-xl">My DApp</h1>
      <div className="flex flex-col md:flex-row items-center gap-3">
        {account ? (
          <>
            <div className="flex items-center gap-3 bg-gray-800 text-green-400 px-4 py-2 rounded-lg shadow-md">
              Connected to {account.slice(0, 6)}...{account.slice(-4)}
            </div>

            {lotteryState === 0 ? (
              hasEntered ? (
                <div className="bg-gray-700 text-yellow-300 px-4 py-2 rounded-lg shadow-md">
                  You have already entered
                </div>
              ) : (
                <button
                  onClick={enterLottery}
                  disabled={isEntering}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md transition disabled:opacity-50"
                >
                  {isEntering ? "Entering..." : "Enter Lottery"}
                </button>
              )
            ) : (
              <div className="text-yellow-400 px-4 py-2 rounded-lg">
                Lottery not open yet
              </div>
            )}
          </>
        ) : (
          <button
            onClick={async () => {
              await enableWeb3();
              if (typeof window !== "undefined") {
                window.localStorage.setItem("connected", "injected");
              }
            }}
            disabled={isWeb3EnableLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition disabled:opacity-50"
          >
            {isWeb3EnableLoading ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
    </header>
  );
}
