import { Geist, Geist_Mono } from "next/font/google";
import TicTacToe from "./components/tic-tac-toe";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div className={`${geistSans.className} ${geistMono.className} font-[family-name:var(--font-geist-sans)]`}>
      <Navbar />
      <TicTacToe />
    </div>
  );
}
