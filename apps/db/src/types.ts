export type DbMessage =
  | {
      type: "TRADE_ADDED";
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
      type: "ORDER_UPDATE";
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
    type: "ADD_KLINE";
    data: {
  open?: string;
  close?: string; 
  high?: string; 
  low?: string;
  volume?: string;
  quoteVolume?: string;
  startTime: string; 
  endTime: string; 
  id: number;
    }
  }
| {
  type: "ORDERBOOK_STATE";
  data: {
      orderbooks:any,
      balances: any
  }
}
