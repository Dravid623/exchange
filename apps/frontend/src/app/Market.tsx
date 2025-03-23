"use client";

import { Depth } from "./components/Depth";
import { MarketBar } from "./components/MarketBar";
import { SwapUI } from "./components/SwapUI";
import { TradeView } from "./components/TradeView";

export function Market() {
  return (
    <div className="flex gap-2 p-2 h-screen">
      <div className="flex flex-col w-3/4">
        <MarketBar market={"TATA_INR"} />
        <div className="flex">
          <div className="w-3/4 p-2">
            <TradeView market={"TATA_INR"} />
          </div>
          <div className="w-1/4 p-2 ">
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
