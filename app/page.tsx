'use client';

// import TicTacToe from "../pages/components/tic-tac-toe";
import Navbar from "@/app/components/Navbar";
import TicTacToe from "./components/TicTacToe";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-[family-name:var(--font-geist-sans)] pt-2 md:pt-4 flex flex-col justify-between h-screen">
      <Navbar />
      <TicTacToe />
      <p className="mx-auto block mb-4">Built with 🤍 by <Link href="https://dev2th3core.site">Dev2th3Core</Link></p>
    </div>
  );
} 