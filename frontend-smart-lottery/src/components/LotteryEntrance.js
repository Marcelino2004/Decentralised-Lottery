import { useWeb3Contract } from "react-moralis";
import LotteryState from "./LotteryState";
import PlayerNum from "./PlayerNum";
import EntranceFee from "./EntranceFee";
import Countdown from "./Countdown";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { LotteryABI, LOTTTERY_CONTRACT_ADDRESS } from "@/constants/constants";

export default function LotteryEntrance() {
  /*
    const {runContractFunction: enterLottery} = useWeb3Contract({
        abi:,
        contractAddress:,
        functionName:,
        params: {},
        msgValue:,
    })
    */
  const { fee, numPlayers } = useLotteryData();

  return (
    <header>
      <Countdown />
      <div>
        <h1 className="font-bold text-yellow-400 text-3xl ">
          Prize Pool:{" "}
          {ethers.BigNumber.from(fee || "0")
            .mul(numPlayers)
            .toString()}{" "}
          Wei
        </h1>
        <EntranceFee />
        <LotteryState />
      </div>
      <span>
        <PlayerNum />
      </span>
    </header>
  );
}

function useLotteryData() {
  const [fee, setFee] = useState(0);
  const [numPlayers, setNumPlayers] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        LOTTTERY_CONTRACT_ADDRESS,
        LotteryABI,
        provider,
      );
      const feeFromContract = await contract.getEntranceFee();
      const playersFromContract = await contract.getNumOfPlayers();
      setFee(feeFromContract.toString());
      setNumPlayers(playersFromContract.toNumber());
    };
    fetchData();
  }, []);

  return { fee, numPlayers };
}
