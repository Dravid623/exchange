import { TodaysChange } from "../components/MarketBar";

export interface Kline {
  symbol?: string; 
  open?: string;
  close?: string; 
  high?: string; 
  low?: string;
  volume?: string;
  quoteVolume?: string;
  startTime: string; 
  endTime?: string; 
  id?: number;
}
export interface KlineForChart {
  symbol?: string; 
  open?: number;
  close?: number; 
  high?: number; 
  low?: number;
  volume?: number;
  quoteVolume?: number;
  startTime: number; 
  endTime?: number; 
  id?: number;
}

export interface Trade {
  id: number;
  isBuyerMaker: boolean;
  price: string;
  quantity: string;
  quoteQuantity: string;
  timestamp: number;
}

export interface DepthType {
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

export interface Callback {

  callback: (...args: (Partial<Kline> | Partial<DepthType> | DepthType | Partial<TodaysChange>)[]) => void;

}

export interface WebSocketMessage {
  method: string;
  params: string[];
  id?: number;
}

