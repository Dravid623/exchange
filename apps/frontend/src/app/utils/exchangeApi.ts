import axios from "axios";
import { DepthType, Kline, Ticker, Trade } from "./types";
import dotenv from "dotenv";
dotenv.config();

const BASE_URL =  process.env.NEXT_PUBLIC_BASE_URL;
export class ExchangeAPI {
  private baseUrl: string | undefined;
  constructor(baseUrl: string | undefined = BASE_URL) {
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
    //@ts-expect-error: Type 'unknown' is not assignable to type 'Ticker[]'.
    return response.data;
  }

  public async getDepth(market: string): Promise<DepthType> {
    const response = await axios.get(`${this.baseUrl}/depth?symbol=${market}`);
    //@ts-expect-error : Type 'unknown' is not assignable to type 'DepthType'.
    return response.data;
  }

  public async getTrades(market: string): Promise<Trade[]> {
    const response = await axios.get(`${this.baseUrl}/trades?symbol=${market}`);
    //@ts-expect-error : Type 'unknown' is not assignable to type 'Trade[]'.
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
    //@ts-expect-error : Type 'unknown' is not assignable to type 'Kline[]'.
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
