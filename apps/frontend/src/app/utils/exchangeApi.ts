import axios from "axios";
import { Depth, Kline, Ticker, Trade } from "./types";
import { useId } from "react";

// const BASE_URL = "http://localhost:3000/api/v1";
// const BASE_URL =  "http://api:3000/api/v1"
const BASE_URL = `http://${window.location.hostname}:3005/api/v1`;


export class ExchangeAPI {
  private baseUrl: string;
  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  public async getTicker(market: string): Promise<Ticker> {
    const tickers = await this.getTickers();
    const ticker = tickers.find((t) => t.symbol === market);
    if (!ticker) {
      throw new Error(`No ticker found for ${market}`);
    }
    return ticker;
  }

  public async getTickers(): Promise<Ticker[]> {
    const response = await axios.get(`${this.baseUrl}/tickers`);
    return response.data;
  }

  public async getDepth(market: string): Promise<Depth> {
    const response = await axios.get(`${this.baseUrl}/depth?symbol=${market}`);
    return response.data;
  }

  public async getTrades(market: string): Promise<Trade[]> {
    const response = await axios.get(`${this.baseUrl}/trades?symbol=${market}`);
    return response.data;
  }

  public async getKlines(
    market: string,
    interval: string,
    startTime: number,
    endTime: number,
  ): Promise<Kline[]> {
    const response = await axios.get(
      `${this.baseUrl}/klines?symbol=${market}&interval=${interval}&startTime=${startTime}&endTime=${endTime}`,
    );
    const data: Kline[] = response.data;
    return data.sort((x, y) => (Number(x.startTime) < Number(y.startTime) ? -1 : 1));
  }

  public async postOrder(
      market:string,
      price:string,
      quantity:string,
      side:string,
      userId:string){
        await axios.post(`${this.baseUrl}/order`,{market:market,price:price,quantity:quantity,side:side,userId:userId}).then((response)=>console.log(`Response after order posting: ${response}`)).catch((e)=>console.error(`Error while putting order, Error: ${e}`))
      }
}
