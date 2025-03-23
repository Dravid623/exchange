import { Depth, Kline, Ticker } from "./types";

// export const BASE_URL = "ws://localhost:3001";
// export const BASE_URL = "ws://ws:3001";
export const BASE_URL = `ws://${window.location.hostname}:3001`;


export class SignalingManager {
  private ws: WebSocket;
  private static instance: SignalingManager;
  private id: number;
  private initialized: boolean = false;
  private callbacks: any = {};
  private bufferedMessage: any = {};

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
        this.bufferedMessage.forEach((m: any) => {
            this.ws.send(JSON.stringify(m));
        });
        this.bufferedMessage=[];
    }
    this.ws.onmessage = (event)=>{
        const message = JSON.parse(event.data);
        const type = message.data.e;
        if(this.callbacks[type]){
            this.callbacks[type].forEach(({callback}:any)=>{
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
                    const newDepth: Partial<Depth>={
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
  
  public sendMessage(message: any) {
    const messageToSend = {
        ...message, id:this.id++
    }
    if(!this.initialized){
        this.bufferedMessage.push(messageToSend);
        return;
    }
    this.ws.send(JSON.stringify(messageToSend));
  }
  public async registerCallback(type: string, callback: any, id: string) {
    this.callbacks[type] = this.callbacks[type] || [];
    this.callbacks[type].push({callback, id});
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
