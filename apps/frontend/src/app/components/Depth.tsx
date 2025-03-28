"use client";

import { useEffect, useState, useRef } from "react";
import { ExchangeAPI } from "../utils/exchangeApi";
import { BidTable } from "./depth/BidTable";
import { AskTable } from "./depth/Asktable";
import { SignalingManager } from "../utils/signalingManager";
import { Card } from "../ui/Card";

export function Depth({ market }: { market: string }) {
  const [bids, setBids] = useState<[string, string][]>([]);
  const [asks, setAsks] = useState<[string, string][]>([]);
  const [price, setPrice] = useState<string>();
  const exchangeAPI = new ExchangeAPI();

  // Refs for real-time state
  const bidsRef = useRef<[string, string][]>([]);
  const asksRef = useRef<[string, string][]>([]);

  useEffect(() => {
    const instance = SignalingManager.getInstance();

    instance.registerCallback(`depth`, (data: any) => {

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

    exchangeAPI.getTicker(market).then((t) => setPrice(t.lastPrice));
    exchangeAPI.getTrades(market).then((t) => setPrice(t[0].price));

    return () => {
      instance.sendMessage({
        method: "UNSUBSCRIBE",
        params: [`depth@${market}`],
      });
      instance.deRegisterCallback(`depth`, `DEPTH-${market}`);
    };
  }, [market]);

  return (
    <Card><div>
    <TableHeader />
      {asks.length > 0 && <AskTable asks={asks} />}
      {price !== null && price !== undefined && <div>{price}</div>}
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
