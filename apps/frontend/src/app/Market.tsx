"use client";

import { useEffect, useState } from "react";
import { Depth } from "./components/Depth";
import { MarketBar } from "./components/MarketBar";
import { SwapUI } from "./components/SwapUI";
import { TradeView } from "./components/TradeView";

export function Market() {
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeTab, setActiveTab] = useState<"chart" | "order">("chart");

  useEffect(() => {
    // Prevent SSR errors by checking if window is defined
    if (typeof window === "undefined") return;

    const checkScreenSize = () => setIsMobileView(window.innerWidth <= 768);

    checkScreenSize(); // Initial check
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (isMobileView) {
    return (
      <div>
        <MarketBar market={"TATA_INR"} />
        <div className="bg-transparent flex justify-around p-2 fixed bottom-6 left-0 w-full z-50">
          <button
            className={`rounded-lg px-4 py-2 ${activeTab === "chart" ? "bg-blue-600 text-white" : "bg-gray-300"}`}
            onClick={() => setActiveTab("chart")}
          >
            Chart
          </button>
          <button
            className={`rounded-lg px-4 py-2 ${activeTab === "order" ? "bg-blue-600 text-white" : "bg-gray-300"}`}
            onClick={() => setActiveTab("order")}
          >
            Order
          </button>
        </div>
        <div>
          {activeTab === "chart" ? (
            <div>
              <TradeView market={"TATA_INR"} />
              <Depth market={"TATA_INR"} />
            </div>
          ) : (
            <SwapUI market={"TATA_INR"} />
          )}
        </div>
      </div>
    );
  }

  // Default desktop view
  return (
    <div className="flex gap-2 p-2 h-screen">
      <div className="flex flex-col w-3/4">
        <MarketBar market={"TATA_INR"} />
        <div className="flex">
          <div className="w-3/4 p-2">
            <TradeView market={"TATA_INR"} />
          </div>
          <div className="w-1/4 p-2">
            <Depth market={"TATA_INR"} />
          </div>
        </div>
      </div>
      <div className="w-1/4">
        <SwapUI market={"TATA_INR"} />
      </div>
    </div>
  );
}
