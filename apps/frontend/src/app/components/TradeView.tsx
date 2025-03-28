"use client";

import { useEffect, useRef, useState } from "react";
import { Kline } from "../utils/types";
import { ExchangeAPI } from "../utils/exchangeApi";
import { ChartManager } from "../utils/chartManager";
import { SignalingManager } from "../utils/signalingManager";
import { Card } from "../ui/Card";

export function TradeView({ market }: { market: string }) {
  const [klineData, setKlineData] = useState<Kline[]>([]);
  const klineDataRef = useRef<Kline[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartManagerRef = useRef<ChartManager | null>(null);
  const wsRef = useRef<SignalingManager | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const rawData = await new ExchangeAPI().getKlines(
          market,
          "1h",
          Math.floor((Date.now() - 1000 * 60 * 60 * 24 * 7) / 1000), // 7 days ago (seconds)
          Math.floor(Date.now() / 1000) // Current time (seconds)
        );
        
        // Convert and clean the data
        const formattedData = rawData
          .map((x) => ({
            open: parseFloat(x.open),
            high: parseFloat(x.high),
            low: parseFloat(x.low),
            close: parseFloat(x.close),
            time: Number(x.starttime) // Convert ms to seconds
          }))
          .sort((a, b) => a.time - b.time); // Sort by time
        
        // Remove duplicates (if any)
        const uniqueData = formattedData.filter(
          (item, index, self) => index === self.findIndex((t) => t.time === item.time)
        );
        
        // Save the data
        //@ts-ignore
        klineDataRef.current = uniqueData;
        setKlineData(uniqueData);
        
        if (chartRef.current) {
          chartManagerRef.current?.destroy();
        
          const chartManager = new ChartManager(
            chartRef.current,
            uniqueData,
            {
              background: "#0e0f14",
              color: "white",
            }
          );
        
          chartManagerRef.current = chartManager;
        }
        
      } catch (e) {
        console.error("Failed to fetch klines:", e);
      }
    }
    init();

    wsRef.current = SignalingManager.getInstance();
    wsRef.current.registerCallback(
      `kline`,
      (data: any) => {
        const updatedKline = [...klineDataRef.current];
        const existingIndex = updatedKline.findIndex(
          (kline) => Number(kline.startTime) === Number(data.startTime)
        );

        if (existingIndex !== -1) {
          updatedKline[existingIndex] = {
            ...updatedKline[existingIndex],
            high: Math.max(Number(updatedKline[existingIndex].high), Number(data.high)).toString(),
            low: Math.min(Number(updatedKline[existingIndex].low), Number(data.low)).toString(),
            close: data.close,
          };
        } else {
          updatedKline.push(data);
        }

        // updatedKline.sort((a, b) => Number(a.startTime) - Number(b.startTime));

        klineDataRef.current = updatedKline;
        setKlineData(updatedKline);

        if (existingIndex !== -1) {
          // ✅ Directly update the last candle — no need to map all data
          chartManagerRef.current?.update({
            open: updatedKline[existingIndex].open ? parseFloat(updatedKline[existingIndex].open) : undefined,
            high: updatedKline[existingIndex].high ? parseFloat(updatedKline[existingIndex].high) : undefined,
            low: updatedKline[existingIndex].low? parseFloat(updatedKline[existingIndex].low) : undefined,
            close: updatedKline[existingIndex].close ? parseFloat(updatedKline[existingIndex].close) : undefined,
            time: Math.floor(Number(updatedKline[existingIndex].startTime) / 1000),
          });
        } else {
          // ✅ If it's a new candle, insert it directly
          chartManagerRef.current?.update({
            open: parseFloat(data.open),
            high: parseFloat(data.high),
            low: parseFloat(data.low),
            close: parseFloat(data.close),
            time: Math.floor(Number(data.startTime) / 1000),
          });
        }
      },
      `kline@${market}`
    );

    // ✅ Subscribe to market updates
    wsRef.current.sendMessage({
      method: "SUBSCRIBE",
      params: [`kline@${market}`],
    });

    // ✅ Cleanup on unmount or dependency change
    return () => {
      wsRef.current?.sendMessage({
        method: "UNSUBSCRIBE",
        params: [`kline@${market}`],
      });
      wsRef.current?.deRegisterCallback(`kline`, `kline${market}`);
    };
  }, [market]);

  return (
        <div ref={chartRef} style={{ height: 520, width: "100%" }} />
  )
}
