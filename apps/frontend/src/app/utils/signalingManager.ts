import { Callback, DepthType, Kline, WebSocketMessage } from "./types";
import dotenv from "dotenv";
dotenv.config();

const BASE_URL =  process.env.NEXT_PUBLIC_BASE_URL_WS || "";
export class SignalingManager {
  private ws: WebSocket;
  private static instance: SignalingManager;
  private id: number;
  private initialized: boolean = false;
  private callbacks:  Record<string, { id: string; callback:Callback[]}[]>= {};
  private bufferedMessage:WebSocketMessage[] = [];

  private constructor() {
    this.ws = new WebSocket(BASE_URL);
    this.bufferedMessage = [];
    this.id = 1;
    this.init();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new SignalingManager();
    }
    return this.instance;
  }
  private init() {
    this.ws.onopen = ()=>{
        this.initialized=true;
        Object.values(this.bufferedMessage).forEach((m:WebSocketMessage) => {
            this.ws.send(JSON.stringify(m));
        });
        this.bufferedMessage=[];
    }
    this.ws.onmessage = (event)=>{
        const message = JSON.parse(event.data);
        const type = message.data.e;
        if(this.callbacks[type]){
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.callbacks[type].forEach(({callback}:{ id: string; callback:any})=>{
                if(type === "kline"){
                    const newTicker : Partial<Kline>={
                        open: message.data.open || 0,
                        close:message.data.close || 0,
                        high: message.data.high || 0,
                        low: message.data.low || 0,
                        volume: message.data.volume || 0,
                        quoteVolume: message.data.quoteVolume || 0,
                        startTime: message.data.startTime,
                        endTime: message.data.endTime,
                        id: message.data.id,
                        symbol: message.data.symbol
                        
                    }
                    callback(newTicker);
                }
                if(type === "depth"){
                    const newDepth: Partial<DepthType>={
                        bids: message.data.b || [], // need to match the same name as backend send to us,it send us .b not .bids
                        asks: message.data.a || [],
                        lastUpdateId: message.data.lastUpdateId || 0
                    }
                    callback(newDepth);
    
                }
                if(type == "todaysChange"){
                  callback(message.data)
                }
            })
        }
      }
  }
  
  public sendMessage(message: WebSocketMessage) {
    const messageToSend = {
        ...message, id:this.id++
    }
    if(!this.initialized){
        this.bufferedMessage.push(messageToSend);
        return;
    }
    this.ws.send(JSON.stringify(messageToSend));
  }
  public async registerCallback(type: string, callback: Callback[], id: string) {
    this.callbacks[type] = this.callbacks[type] || [];
    this.callbacks[type].push({id, callback});
  }
  public async deRegisterCallback(type: string, id: string) {
    if(this.callbacks[type]){
        const index = this.callbacks[type].findIndex((callback: { id: string; }) => callback.id === id);
        if(index != -1){
            this.callbacks[type].splice(index,1);
        }
    }
  }
}
