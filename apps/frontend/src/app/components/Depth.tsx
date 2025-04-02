"use client";

import { useEffect, useState, useRef } from "react";
import { ExchangeAPI } from "../utils/exchangeApi";
import { BidTable } from "./depth/BidTable";
import { AskTable } from "./depth/Asktable";
import { SignalingManager } from "../utils/signalingManager";
import { Card } from "../ui/Card";
import { TodaysChange } from "./MarketBar";
import { DepthType } from "../utils/types";

export function Depth({ market }: { market: string }) {
  const [bids, setBids] = useState<[string, string][]>([]);
  const [asks, setAsks] = useState<[string, string][]>([]);


  const bidsRef = useRef<[string, string][]>([]);
  const asksRef = useRef<[string, string][]>([]);
  const [price,setPrice] = useState<TodaysChange | null>(null);

  useEffect(() => {
    const instance = SignalingManager.getInstance();
    const exchangeAPI = new ExchangeAPI();
//@ts-expect-error : type not compatible with callback interface
    instance.registerCallback(`depth`, (data:DepthType) => {

      const updatedBids = [...bidsRef.current];
      data.bids.forEach(([price, size]: [string, string]) => {
        const index = updatedBids.findIndex((bid) => bid[0] === price);
        if (index !== -1) {
          updatedBids[index][1] = size;
          if (Number(size) === 0) {
            updatedBids.splice(index, 1);
          }
        } else if (Number(size) > 0) {
          updatedBids.push([price, size]);
        }
      });

      // updatedBids.sort((a, b) => Number(b[0]) - Number(a[0]));
      bidsRef.current = updatedBids;
      setBids([...updatedBids]);

      const updatedAsks = [...asksRef.current];
      data.asks.forEach(([price, size]: [string, string]) => {
        const index = updatedAsks.findIndex((ask) => ask[0] === price);
        if (index !== -1) {
          updatedAsks[index][1] = size;
          if (Number(size) === 0) {
            updatedAsks.splice(index, 1);
          }
        } else if (Number(size) > 0) {
          updatedAsks.push([price, size]);
        }
      });
      asksRef.current = updatedAsks;
      setAsks([...updatedAsks]);
    }, `DEPTH-${market}`);

    //TODO: we need to convert this in recoil
    instance.registerCallback(
      "todaysChange",
      //@ts-expect-error : type not compatible with callback interface
      (data: Partial<TodaysChange>) => {
        setPrice((prev) => ({
          lastDayPrice: data?.lastDayPrice ?? prev?.lastDayPrice ?? 0,
          price: data?.price ?? prev?.price ?? 0,
          low: data?.low ?? prev?.low ?? 0,
          high: data?.high ?? prev?.high ?? 0,
          volume: data?.volume ?? prev?.volume ?? 0,
        }));
      },
      `todaysChange@${market}`
    );

    instance.sendMessage({
      method: "SUBSCRIBE",
      params: [`depth@${market}`],
    });

    exchangeAPI.getDepth(market).then((d) => {
      setBids(d.bids);
      bidsRef.current = d.bids;

      setAsks(d.asks);
      asksRef.current = d.asks;
    });

    return () => {
      instance.sendMessage({
        method: "UNSUBSCRIBE",
        params: [`depth@${market}`],
      });
      instance.deRegisterCallback(`depth`, `DEPTH-${market}`);
    };
  }, [market]);

  return (
    <Card><div className="max-h-[520px] rounded-lg overflow-y-auto">
    <TableHeader />
      {asks.length > 0 && <AskTable asks={asks} />}
      {price?.price !== null && price?.price !== undefined && <div className="text-2xl font-semibold justify-self-center">{price.price}</div>}
      {bids.length > 0 && <BidTable bids={bids} />}
  </div></Card>
    
  );
}

function TableHeader() {
  return (
    <div className="flex justify-between px-4 py-2 text-sm font-semibold bg-gray-900">
      <div className="text-gray-100 w-1/3 text-left">Price</div>
      <div className="text-gray-100 w-1/3 text-center">Size</div>
      <div className="text-gray-100 w-1/3 text-right">Total</div>
    </div>
  );
  
}
