import React from "react";
import { Inter } from "next/font/google";
import TreeVisualizer from "@/components/TreeVisualizer";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main
      className={`flex min-h-screen flex-col items-center p-8 ${inter.className}`}
    >
      <div className="w-full max-w-6xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Think Long Term</h1>
        <p className="text-center mb-8 text-gray-600">
          Map out the long-term consequences of your actions
        </p>
        <TreeVisualizer />
      </div>
    </main>
  );
}
