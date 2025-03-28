import { BASE_CURRENCY } from "./engine";

export interface Order {
  price: number;
  quantity: number;
  orderId: string;
  filled: number;
  side: "buy" | "sell";
  userId: string;
}

export interface Fill {
  price: string;
  qty: number;
  tradeId: number;
  otherUserId: string;
  marketOrderId: string;
}
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
}

export interface TodaysChange{
  lastDayPrice: number;
  price: number;
  low: number;
  high: number;
  volume: number;
}

// TODO: Optimize lookup performance from O(n) to O(1) by using a Map.
// Suggested Change:
// private bids: Map<number, Order>;
// private asks: Map<number, Order>;
export class Orderbook {
  private bids: Order[];
  private asks: Order[];
  private baseAsset: string;
  private quoteAsset: string = BASE_CURRENCY;
  private lastTradeId: number;
  private currentPrice: number;
  private kline: Kline;
  private todaysChange: TodaysChange;

  constructor(
    baseAsset: string,
    bids: Order[],
    asks: Order[],
    lastTradeId: number,
    currentPrice: number,
  ) {
    this.bids = bids;
    this.asks = asks;
    this.baseAsset = baseAsset;
    this.lastTradeId = lastTradeId || 0;
    this.currentPrice = currentPrice || 0;
    this.kline = {symbol:this.ticker(),open: "1004",high: String(currentPrice),low: "1004",close: String(currentPrice),startTime: (new Date().getTime()).toString(),endTime: (new Date().getTime()).toString(),volume:"0",quoteVolume:"0" };
    this.todaysChange = {lastDayPrice:this.currentPrice, price:this.currentPrice,low:this.currentPrice,high:this.currentPrice,volume:0}
    this.startInterval()
  }
  
  startInterval() {
      setInterval(() => {
         this.kline.open = this.kline.close,
         this.kline.high = this.kline.close,
         this.kline.low = this.kline.close,
         this.kline.startTime = (new Date().getTime()).toString(),
         this.kline.endTime = (new Date().getTime()).toString()
    }, 15*1000); // 15 seconds
  }
  ticker() {
    return `${this.baseAsset}_${this.quoteAsset}`;
  }
  getAsks() {
    return this.asks;
  }
  getBids() {
    return this.bids;
  }

  // getDepth():Depth | null{}
  getSnapshot() {
    return {
      baseAsset: this.baseAsset,
      bids: this.bids,
      asks: this.asks,
      lastTradeId: this.lastTradeId,
      currentPrice: this.currentPrice,
    };
  }

  getKline(){
    return this.kline;
  }
  getTodaysChange():TodaysChange{
    return this.todaysChange;
  }

  updateKlineAndTodaysChange(currentMatch: number,filled:number){
        this.todaysChange.price = currentMatch
        this.todaysChange.volume += filled;
        this.kline.close = currentMatch.toString()
        if(currentMatch > Number(this.kline.high)){
          this.kline.high = currentMatch.toString();
        }
        if(currentMatch < Number(this.kline.low)){
          this.kline.low = currentMatch.toString();
          this.todaysChange.low = currentMatch
        }
        if(currentMatch>this.todaysChange.high){
          this.todaysChange.high = currentMatch
        }
  }
  //TODO:add self trade prevention
  addOrder(order: Order): { executedQty: number; fills: Fill[],} {
    if (order.side == "buy") {
      const { executedQty, fills, } = this.matchBid(order);
      order.filled = executedQty;
      if (executedQty == order.quantity) {
        return {
          executedQty,
          fills,
        };
      }
      this.bids.push(order);
      return {
        executedQty,
        fills,
      };
    } else {
      const { executedQty, fills } = this.matchAsk(order);
      order.filled = executedQty;
      if (executedQty == order.quantity) {
        return {
          executedQty,
          fills,
        };
      }
      this.asks.push(order);
      return {
        executedQty,
        fills,
      };
    }
  }
  // TODO: Make a single function for match orderMatch()
  matchBid(order: Order): { fills: Fill[]; executedQty: number } {
    const fills: Fill[] = [];
    let executedQty = order.filled;
    for (let i = 0; i < this.asks.length; i++) {
      if (this.asks[i].filled === this.asks[i].quantity) {
        this.asks.splice(i, 1);
        i--;
      }
    }
    this.asks.sort((a, b) => Number(a.price) - Number(b.price));
    for (let i = 0; i < this.asks.length; i++) {
      if (this.asks[i].price <= order.price && executedQty < order.quantity) {
        const filledQty = Math.min(
          order.quantity - executedQty,
          this.asks[i].quantity - this.asks[i].filled,
        );
        executedQty += filledQty;
        this.asks[i].filled += filledQty;
        fills.push({
          price: this.asks[i].price.toString(),
          qty: filledQty,
          tradeId: this.lastTradeId++,
          otherUserId: this.asks[i].userId,
          marketOrderId: this.asks[i].orderId, // need to change to market order id
        });
        this.updateKlineAndTodaysChange(this.asks[i].price,filledQty)
        
      }
    }
    
    return {
      fills,
      executedQty,
    };
  }
  matchAsk(order: Order): {fills: Fill[], executedQty: number} {
    const fills: Fill[] = [];
    let executedQty = order.filled;
    for (let i = 0; i < this.bids.length; i++) {
      if (this.bids[i].filled === this.bids[i].quantity) {
          this.bids.splice(i, 1);
          i--;
      }
  }
  this.bids.sort((a, b) => Number(a.price) - Number(b.price));
    for (let i = 0; i < this.bids.length; i++) {
        if (this.bids[i].price >= order.price && executedQty < order.quantity) {
            const amountRemaining = Math.min(order.quantity - executedQty, this.bids[i].quantity - this.bids[i].filled);
            executedQty += amountRemaining;
            this.bids[i].filled += amountRemaining;
            fills.push({
                price: this.bids[i].price.toString(),
                qty: amountRemaining,
                tradeId: this.lastTradeId++,
                otherUserId: this.bids[i].userId,
                marketOrderId: this.bids[i].orderId
            });
            this.updateKlineAndTodaysChange(this.bids[i].price,amountRemaining)
            
        }
    }
    
    return {
        fills,
        executedQty
    };
}

  //TODO: Can you make this faster? Can you compute this during order matches?
  getDepth() {
    const bids: [string, string][] = [];
    const asks: [string, string][] = [];

    const bidsObj: { [key: string]: number } = {};
    const asksObj: { [key: string]: number } = {};

    for (let i = 0; i < this.bids.length; i++) {
      const order = this.bids[i];
      if (!bidsObj[order.price]) {
        bidsObj[order.price] = 0;
      }
      bidsObj[order.price] += order.quantity - order.filled;
    }

    for (let i = 0; i < this.asks.length; i++) {
      const order = this.asks[i];
      if (!asksObj[order.price]) {
        asksObj[order.price] = 0;
      }
      asksObj[order.price] += order.quantity - order.filled;
    }

    for (const price in bidsObj) {
      bids.push([price, bidsObj[price].toString()]);
    }

    for (const price in asksObj) {
      asks.push([price, asksObj[price].toString()]);
    }

    return {
      bids,
      asks,
    };
  }

  getOpenOrders(userId: string): Order[] {
    const asks = this.asks.filter((x) => x.userId === userId);
    const bids = this.bids.filter((x) => x.userId === userId);
    return [...asks, ...bids];
  }

  cancelBid(order: Order) {
    const index = this.bids.findIndex((x) => x.orderId === order.orderId);
    if (index !== -1) {
      const price = this.bids[index].price;
      this.bids.splice(index, 1);
      return price;
    }
  }

  cancelAsk(order: Order) {
    const index = this.asks.findIndex((x) => x.orderId === order.orderId);
    if (index !== -1) {
      const price = this.asks[index].price;
      this.asks.splice(index, 1);
      return price;
    }
  }
}
