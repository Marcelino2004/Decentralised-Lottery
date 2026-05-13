"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { LotteryABI, LOTTTERY_CONTRACT_ADDRESS } from "../constants/constants"; // deployed contract address

export default function PlayerNum() {
  const [playerNum, setPlayerNum] = useState(null);

  const getNumOfPlayers = async () => {
    try {
      if (!window.ethereum) return; // check for MetaMask

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        LOTTTERY_CONTRACT_ADDRESS,
        LotteryABI,
        provider
      );

      const state = await contract.getNumOfPlayers();
      setPlayerNum(state.toString()); // ✅ convert BigNumber to number
    } catch (error) {
      console.error("Error fetching number of players:", error);
    }
  };

  useEffect(() => {
    getNumOfPlayers();
    // Optional: poll the state every few seconds
    const interval = setInterval(() => {
      getNumOfPlayers();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold">
        Number of Players in the lottery: {playerNum ?? "0"}
      </h2>
    </div>
  );
}
