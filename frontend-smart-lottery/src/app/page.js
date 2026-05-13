"use client";

import Image from "next/image";
import styles from "../styles/page.module.css";
import { HeadManagerContext } from "next/dist/shared/lib/head-manager-context.shared-runtime";
import ManualHeader from "../components/ManualHeader";
//import Header from "../components/Header";
import LotteryEntrance from "@/components/LotteryEntrance";

export default function Home() {
  return (
    <div className={styles.page}>
      <h1 className="text-3xl font-bold text-yellow-400">
        Welcome to Smart Lottery
      </h1>

      <main className={styles.main}>
        <ManualHeader />
        <LotteryEntrance />
      </main>
    </div>
  );
}
