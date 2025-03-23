//TODO: Can we share the types between the ws layer and the engine?

export type TickerUpdateMessage = {
  stream: string;
  data: {
    close?: string;
    high?: string;
    low?: string;
    volume?: string; 
    quoteVolume?: string;
    open?: string;
    id: number;
    startTime: string;
    endTime: string;
    e: "ticker"; 
  };
};

export type TodaysChange = {
  stream: string;
  data: {
  lastDayPrice: number;
  price: number;
  low: number;
  high: number;
  volume: number;
  e: "todaysChange"
  }
}

export type KlineUpdateMessage = {
  stream: string;
  data: {
    close?: string;
    high?: string;
    low?: string;
    volume?: string; 
    quoteVolume?: string;
    open?: string;
    id: number;
    startTime: string;
    endTime: string;
    e: "kline"; 
  };
};

export type DepthUpdateMessage = {
  stream: string;
  data: {
    b?: [string, string][];
    a?: [string, string][];
    e: "depth";
  };
};

export type TradeAddedMessage = {
  stream: string;
  data: {
    e: "trade";
    t: number;
    m: boolean;
    p: string;
    q: string;
    s: string; // symbol
  };
};

export type WsMessage =
  | TickerUpdateMessage
  | DepthUpdateMessage
  | TradeAddedMessage
  | KlineUpdateMessage
  | TodaysChange
