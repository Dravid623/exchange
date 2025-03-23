export interface Kline {
  symbol?: string; 
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

export interface Trade {
  id: number;
  isBuyerMaker: boolean;
  price: string;
  quantity: string;
  quoteQuantity: string;
  timestamp: number;
}

export interface Depth {
  bids: [string, string][];
  asks: [string, string][];
  lastUpdateId: string;
}

export interface Ticker {
  firstPrice: string;
  high: string;
  lastPrice: string;
  low: string;
  priceChange: string;
  priceChangePercent: string;
  quoteVolume: string;
  symbol: string;
  trades: string;
  volume: string;
}
