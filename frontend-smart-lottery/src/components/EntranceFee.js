"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { LotteryABI, LOTTTERY_CONTRACT_ADDRESS } from "../constants/constants"; // deployed contract address
import PlayerNum from "./PlayerNum";
export default function EntranceFee() {
  const [fee, setFee] = useState("0");

  const getEntranceFee = async () => {
    try {
      if (!window.ethereum) return; // check for MetaMask

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        LOTTTERY_CONTRACT_ADDRESS,
        LotteryABI,
        provider
      );

      const feeFromContract = await contract.getEntranceFee();
      setFee(feeFromContract.toString());
    } catch (error) {
      console.error("Error getting entrance fee:", error);
    }
  };

  useEffect(() => {
    getEntranceFee();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold">Entrance Fee: {fee} Wei </h2>
    </div>
  );
}
