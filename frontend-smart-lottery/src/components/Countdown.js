"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { LotteryABI, LOTTTERY_CONTRACT_ADDRESS } from "../constants/constants";

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    let countdownInterval;

    const fetchTimes = async () => {
      try {
        if (!window.ethereum) return;
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(
          LOTTTERY_CONTRACT_ADDRESS,
          LotteryABI,
          provider,
        );

        const lastTimestamp = await contract.getLastTimeStamp();
        const interval = await contract.getInterval();

        const endTime = lastTimestamp.toNumber() + interval.toNumber();

        // Clear any existing countdown and start fresh
        clearInterval(countdownInterval);
        countdownInterval = setInterval(() => {
          const remaining = endTime - Math.floor(Date.now() / 1000);
          setTimeLeft(remaining > 0 ? remaining : 0);
        }, 1000);
      } catch (err) {
        console.error("Error fetching countdown data:", err);
      }
    };

    fetchTimes();
    // Re-fetch from contract every 30s in case of resets
    const fetchInterval = setInterval(fetchTimes, 30000);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(fetchInterval);
    };
  }, []);

  const formatTime = (seconds) => {
    if (seconds === null) return "Loading...";
    if (seconds === 0) return "Drawing soon...";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div>
      <h2 className="text-xl font-bold">
        Time until draw: {formatTime(timeLeft)}
      </h2>
    </div>
  );
}
