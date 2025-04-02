"use client";

import { useEffect, useRef} from "react";
import { Kline, KlineForChart } from "../utils/types";
import { ExchangeAPI } from "../utils/exchangeApi";
import { ChartManager } from "../utils/chartManager";
import { SignalingManager } from "../utils/signalingManager";

export function TradeView({ market }: { market: string }) {
  // const [klineData, setKlineData] = useState<KlineForChart[]>([]);  
  const klineDataRef = useRef<KlineForChart[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartManagerRef = useRef<ChartManager | null>(null);
  const wsRef = useRef<SignalingManager | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const rawData:Kline[] = await new ExchangeAPI().getKlines(
          market,
          "1h",
          Math.floor((Date.now() - 1000 * 60 * 60 * 24 * 7) / 1000), // 7 days ago (seconds)
          Math.floor(Date.now() / 1000) // Current time (seconds)
        );
        
        // Convert and clean the data
        const formattedData: KlineForChart[] = rawData
          .map((x) => ({
            open: parseFloat(x.open ?? "0"),
            high: parseFloat(x.high ?? "0"),
            low: parseFloat(x.low ?? "0"),
            close: parseFloat(x.close ?? "0"),
            //@ts-expect-error : time filed need in chart but kline have startTime. i changed line 52 todo so i need to change this too
            startTime: Number(x.starttime)
          }))
          .sort((a, b) => a.startTime - b.startTime);
        
        const uniqueData:KlineForChart[] = formattedData;
        

        klineDataRef.current = uniqueData;
        // setKlineData(uniqueData);
        
        if (chartRef.current) {
          chartManagerRef.current?.destroy();
        
          const chartManager = new ChartManager(
            chartRef.current,
            uniqueData, // TODO: may cause some problem. i changed it from uniqueData to kineData. kline do not have property like time.
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
      //@ts-expect-error : type not compatible with callback interface
      (data: Kline) => {
        const updatedKline = [...klineDataRef.current];
        const existingIndex = updatedKline.findIndex(
          (kline) => Number(kline.startTime) === Number(data.startTime)
        );

        if (existingIndex !== -1) {
          updatedKline[existingIndex] = {
            ...updatedKline[existingIndex],
            high: Math.max(Number(updatedKline[existingIndex].high), Number(data.high)),
            low: Math.min(Number(updatedKline[existingIndex].low), Number(data.low)),
            close: Number(data.close),
          };
        } else {
          updatedKline.push({
            open: data.open ? parseFloat(data.open) : 0,
            high: data.high ? parseFloat(data.high) : 0,
            low: data.low ? parseFloat(data.low) : 0,
            close: data.close ?  parseFloat(data.close) : 0,
            startTime: Number(data.startTime),
          });
        }

        klineDataRef.current = updatedKline;
        // setKlineData(updatedKline);

        if (existingIndex !== -1) {
          // ✅ Directly update the last candle — no need to map all data
          chartManagerRef.current?.update({
            open: updatedKline[existingIndex].open ? Number(updatedKline[existingIndex].open) : undefined,
            high: updatedKline[existingIndex].high ? Number(updatedKline[existingIndex].high) : undefined,
            low: updatedKline[existingIndex].low? Number(updatedKline[existingIndex].low) : undefined,
            close: updatedKline[existingIndex].close ? Number(updatedKline[existingIndex].close) : undefined,
            startTime: Number(updatedKline[existingIndex].startTime),
          });
        } else {
          // ✅ If it's a new candle, insert it directly
          chartManagerRef.current?.update({
            open: data.open ? parseFloat(data.open) : 0,
            high: data.high ? parseFloat(data.high) : 0,
            low: data.low ? parseFloat(data.low) : 0,
            close: data.close ?  parseFloat(data.close) : 0,
            startTime: Number(data.startTime),
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

  }, [market]);// Dependency array should only include market. klineData have taken care

  return (
        <div ref={chartRef} className="h-[400px] w-full md:h-[520px]" />
  )
}
