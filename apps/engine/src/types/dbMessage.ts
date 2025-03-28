import { ORDER_UPDATE, TRADE_ADDED } from ".";

export type DbMessage =
  | {
      type: typeof TRADE_ADDED;
      data: {
        id: string;
        isBuyerMaker: boolean;
        price: string;
        quantity: string;
        quoteQuantity: string;
        timestamp: number;
        market: string;
      };
    }
  | {
      type: typeof ORDER_UPDATE;
      data: {
        orderId: string;
        executedQty: number;
        market?: string;
        price?: string;
        quantity?: string;
        side?: "buy" | "sell";
      };
    }
  | {
    type: "ORDERBOOK_STATE";
    data: {
      orderbooks:any,
      balances: any
    }
  }
| {
  type: "ADD_KLINE";
  data: {
    close?: string;
    high?: string;
    low?: string;
    volume?: string; 
    quoteVolume?: string;
    open?: string;
    startTime: string;
    endTime: string;
  }
}
