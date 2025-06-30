'use client';

// import TicTacToe from "../pages/components/tic-tac-toe";
import Navbar from "@/app/components/Navbar";
import TicTacToe from "./components/TicTacToe";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="font-[family-name:var(--font-geist-sans)] pt-2 md:pt-4 flex flex-col justify-between h-screen">
      <Navbar />
      <TicTacToe />
      <Footer />
    </div>
  );
} 