"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { LotteryABI, LOTTTERY_CONTRACT_ADDRESS } from "../constants/constants"; // deployed contract address

export default function LotteryStateDisplay() {
  const [lotteryState, setLotteryState] = useState(null);

  const getLotteryState = async () => {
    try {
      if (!window.ethereum) return; // check for MetaMask

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        LOTTTERY_CONTRACT_ADDRESS,
        LotteryABI,
        provider,
      );

      const state = await contract.getLotteryState();
      /*
        state is an enum:
        0 = OPEN
        1 = CALCULATING
      */
      const stateString = state === 0 ? "OPEN" : "CALCULATING";

      setLotteryState(stateString);
    } catch (error) {
      console.error("Error fetching lottery state:", error);
    }
  };

  useEffect(() => {
    getLotteryState();
    // Optional: poll the state every few seconds
    const interval = setInterval(() => {
      getLotteryState();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold">
        Lottery State: {lotteryState ?? "Loading..."}
      </h2>
    </div>
  );
}
