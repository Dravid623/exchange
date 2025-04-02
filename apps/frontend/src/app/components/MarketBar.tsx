"use client";
import { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { SignalingManager } from "../utils/signalingManager";

export interface TodaysChange {
  lastDayPrice: number;
  price: number;
  low: number;
  high: number;
  volume: number;
}
export function MarketBar({ market }: { market: string }) {
  const [todaysChange, setTodaysChange] = useState<TodaysChange | null>(null);
  useEffect(() => {
    // exchangeAPI.getTicker(market).then(setTodaysChange);

    const signalingManager = SignalingManager.getInstance();
    signalingManager.registerCallback(
      "todaysChange",
      //@ts-expect-error : type not compatible with callback interface
      (data: Partial<TodaysChange>) => {
        setTodaysChange((prev) => ({
          lastDayPrice: data?.lastDayPrice ?? prev?.lastDayPrice ?? 0,
          price: data?.price ?? prev?.price ?? 0,
          low: data?.low ?? prev?.low ?? 0,
          high: data?.high ?? prev?.high ?? 0,
          volume: data?.volume ?? prev?.volume ?? 0,
        }));
      },
      `todaysChange@${market}`
    );

    signalingManager.sendMessage({
      method: "SUBSCRIBE",
      params: [`todaysChange@${market}`],
    });

    return () => {
      signalingManager.deRegisterCallback("todaysChange", `todaysChange@${market}`);
      signalingManager.sendMessage({
        method: "UNSUBSCRIBE",
        params: [`todaysChange@${market}`],
      });
    };
  }, [market]);

  return (
    <Card title="">
      <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-900 dark:text-white p-4 ">
        {/* Market Name & Price */}
        <div className="flex items-center gap-2">
          <span className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-1 rounded-md text-lg font-semibold">
            {market.replace("_", " / ")}
          </span>
          <span className={`text-lg ${todaysChange?.price??0 > (todaysChange?.lastDayPrice ?? 0) ? "text-green-500" : "text-red-500"}`}>
            {todaysChange?.price ?? "N/A"}
          </span>
        </div>

        {/* 24H Change */}
        <div className="flex flex-col md:visible invisible">
          <span className="text-sm text-gray-500">Change</span>
          <span className={`text-md ${todaysChange?.price??0 > (todaysChange?.lastDayPrice ?? 0) ? "text-green-500" : "text-red-500"}`}>
            {todaysChange ? ((todaysChange.price ?? 0) - (todaysChange.lastDayPrice ?? 0)).toFixed(2) : "N/A"}
          </span>
        </div>

        {/* 24H High */}
        <div className="flex flex-col">
          <span className="text-md text-gray-500 font-semibold">High</span>
          <span className="text-base font-normal">{todaysChange?.high ?? "N/A"}</span>
        </div>

        {/* 24H Low */}
        <div className="flex flex-col">
          <span className="text-md text-gray-500 font-semibold">Low</span>
          <span className="text-base font-normal">{todaysChange?.low ?? "N/A"}</span>
        </div>

        {/* 24H Volume */}
        <div className="flex flex-col">
          <span className="text-md text-gray-500 font-semibold">Volume</span>
          <span className="text-base font-normal">{todaysChange?.volume ?? "N/A"}</span>
        </div>
      </div>
    </Card>
  );
}
