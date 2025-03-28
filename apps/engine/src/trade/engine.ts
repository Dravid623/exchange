import process from "process";
import { RedisManager } from "../RedisManager";
import fs from "fs"
import {
  CANCEL_ORDER,
  CREATE_ORDER,
  GET_DEPTH,
  GET_OPEN_ORDERS,
  ON_RAMP,
} from "../types";
import { MessageFromApi } from "../types/fromApi";
import { Fill, Order, Orderbook,Kline, TodaysChange } from "./Orderbook";

// TODO: Avoid floats everywhere
export const BASE_CURRENCY = "INR";
interface UserBalance {
  [key: string]: {
    available: number;
    locked: number;
  };
}

export class Engine {
  private orderbooks: Orderbook[] = [];
  private balances: Map<string, UserBalance> = new Map();

  constructor() {
    let snapshot = null
    let klineSnapshot = null;
    try {
      if(process.env.WITH_SNAPSHOT){
        snapshot = fs.readFileSync("./snapshot.json");
      }
      // if(process.env.WITH_SNAPSHOT){
      //   klineSnapshot = fs.readFileSync("./klineSnapshot.json");
      // }
    } catch (e) {
      console.log("No snapshot found")
    }
    if(snapshot){
      const snapshotSnapshot = JSON.parse(snapshot.toString());
      this.orderbooks = snapshotSnapshot.orderbooks.map((o: { baseAsset: string; bids: Order[]; asks: Order[]; lastTradeId: number; currentPrice: number; }) => new Orderbook(o.baseAsset, o.bids, o.asks, o.lastTradeId, o.currentPrice));
      this.balances = new Map(snapshotSnapshot.balance);
    } else{
      // fetch from db
    this.orderbooks = [new Orderbook(`TATA`, [], [], 0, 0)];
    this.setBaseBalances();
    }
    // if(klineSnapshot){

    // }
    setInterval(() => {
      this.saveSnapshot() 
    }, 3*1000);
    setInterval(() => {
      this.saveKlineSnapshot()
    }, 14.8*1000);
  }
  saveSnapshot() {
    const snapshotSnapshot = {
      orderbooks: this.orderbooks.map(o => o.getSnapshot()),
      balances: Array.from(this.balances.entries())
    }
    this.setOrderbookStatusInDb(snapshotSnapshot)
    fs.writeFileSync("./snapshot.json", JSON.stringify(snapshotSnapshot))
  }
  saveKlineSnapshot() {
    const klinesnapshotSnapshot = this.orderbooks.map(o => o.getKline());
    fs.writeFileSync("./klineSnapshot.json", JSON.stringify(klinesnapshotSnapshot))
    this.setKlineToDb(klinesnapshotSnapshot[0]??{}as Kline)
  }
  sendKlineTodb(){

  }
  public process({
    message,
    clientId,
  }: {
    message: MessageFromApi;
    clientId: string;
  }) {
    switch (message.type) {
      case CREATE_ORDER:
        try {
          const { executedQty, fills, orderId } = this.createOrder(
            message.data.market,
            message.data.price,
            message.data.quantity,
            message.data.side,
            message.data.userId,
          );
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_PLACED",
            payload: {
              orderId,
              executedQty,
              fills,
            },
          });
        } catch (error) {
          console.log(error);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_CANCELLED",
            payload: {
              orderId: "",
              executedQty: 0,
              remainingQty: 0,
            },
          });
        }
        break;
      case CANCEL_ORDER:
        try {
          const orderId = message.data.orderId;
          const cancelMarket = message.data.market;
          const cancelOrderbook = this.orderbooks.find(
            (o) => o.ticker() === cancelMarket,
          );
          if (!cancelOrderbook) {
            throw new Error("No orderbook found");
          }
          const order =
            cancelOrderbook.getAsks().find((o) => o.orderId === orderId) ||
            cancelOrderbook.getBids().find((o) => o.orderId === orderId);
          if (!order) {
            return;
          }
          if (order.side === "buy") {
            const price = cancelOrderbook.cancelBid(order);
            //TODO: update in user balance && send to updatedepth
          } else {
            //TODO: same for sell
          }

          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_CANCELLED",
            payload: {
              orderId,
              executedQty: 0,
              remainingQty: 0,
            },
          });
        } catch (error) {
          console.log(`Error while cancelling order. ${error}`);
        }
        break;
      case GET_OPEN_ORDERS:
        try {
          const openOrderbook = this.orderbooks.find(
            (o) => o.ticker() === message.data.market,
          );
          if (!openOrderbook) {
            throw new Error("No orderbook found!");
          }
          const openOrder = openOrderbook.getOpenOrders(message.data.userId);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "OPEN_ORDERS",
            payload: openOrder,
          });
        } catch (error) {
          console.log(error);
        }
        break;
      case ON_RAMP:
        this.onRamp(message.data.userId, Number(message.data.amount));
        break;
      case GET_DEPTH:
        try {
          const market = message.data.market;
          const orderbook = this.orderbooks.find((o) => o.ticker() === market);
          if (!orderbook) {
            throw new Error("No orderbook found!");
          }
          RedisManager.getInstance().sendToApi(clientId, {
            type: "DEPTH",
            payload: orderbook.getDepth(),
          });
        } catch (error) {
          console.log(error);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "DEPTH",
            payload: {
              bids: [],
              asks: [],
            },
          });
        }
        break;
    }
  }
  public addOrderbook(orderbook: Orderbook) {
    this.orderbooks.push(orderbook);
  }
  public createOrder(
    market: string,
    price: string,
    quantity: string,
    side: "buy" | "sell",
    userId: string,
  ) {
    const orderbook = this.orderbooks.find((o) => o.ticker() === market);
    if (!orderbook) {
      throw new Error("No orderbook found!");
    }
    const baseAsset = market.split("_")[0];
    const quoteAsset = market.split("_")[1];
    this.checkAndLockFunds(
      baseAsset,
      quoteAsset,
      side,
      userId,
      quoteAsset,
      price,
      quantity,
    );
    const order: Order = {
      price: Number(price),
      quantity: Number(quantity),
      orderId:
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15),
      filled: 0,
      side: side,
      userId: userId,
    };
    const { executedQty, fills} = orderbook.addOrder(order);
    const kline: Kline = orderbook.getKline()
    const todaysChange = orderbook.getTodaysChange()
    //TODO: update on DB, publish on ws, updateBalance, publishDepth
    this.updateBalance(userId,baseAsset,quoteAsset,side,fills,executedQty);
    this.createDbTrades(fills,market,userId);
    this.updateDbOrders(order,executedQty,fills,market, );
    this.publishWsDepthUpdates(fills,price, side,market);
    this.publishWsTrades(fills,userId,market)
    this.publisWsTodaysChange(todaysChange, market);
    this.publishWsKlines(kline,market)
    return { executedQty, fills, orderId: order.orderId };
  }
  public createDbTrades(fills: Fill[], market: string, userId: string) {
    const Redis = RedisManager.getInstance();
    fills.forEach((fills) => {
      Redis.pushMessage({
        type: "TRADE_ADDED",
        data: {
          market: market,
          id: userId,
          isBuyerMaker: true,
          price: fills.price,
          quantity: fills.qty.toString(),
          quoteQuantity: (fills.qty * Number(fills.price)).toString(),
          timestamp: Date.now(),
        },
      });
    });
  }
  public updateDbOrders(
    order: Order,
    executedQty: number,
    fills: Fill[],
    market: string,
  ) {
    const Redis = RedisManager.getInstance();
    Redis.pushMessage({
      type: "ORDER_UPDATE",
      data: {
        orderId: order.orderId,
        executedQty: executedQty,
        market: market,
        price: order.price.toString(),
        quantity: order.quantity.toString(),
        side: order.side,
      },
    });

    fills.forEach((fill) => {
      Redis.pushMessage({
        type: "ORDER_UPDATE",
        data: {
          orderId: fill.marketOrderId,
          executedQty: fill.qty,
        },
      });
    });
  }

  public publishWsKlines(kline: Kline,market:string){
    const Redis = RedisManager.getInstance();
    Redis.publishMessage(`kline@${market}`,{
      stream: `kline@${market}`,
      data: {
        open:kline.open,
        close:kline.close,
        high:kline.high,
        low:kline.low,
        volume:kline.volume,
        quoteVolume:kline.quoteVolume,
        startTime:kline.startTime,
        endTime:kline.endTime,
        id:100,
        e:"kline"
      }
    })

  } // need to implement
  public publisWsTodaysChange(todaysChange:TodaysChange,market:string){
    const Redis = RedisManager.getInstance();
    Redis.publishMessage(`todaysChange@${market}`,{
      stream: `todaysChange@${market}`,
      data: {
        lastDayPrice:todaysChange.lastDayPrice,
        price: todaysChange.price,
        low: todaysChange.low,
        high: todaysChange.high,
        volume: todaysChange.volume,
        e:"todaysChange"
      }
    })
  }
  public publishWsTrades(fills: Fill[], userId: string, market: string) {
    const Redis = RedisManager.getInstance();
    fills.forEach((fill) => {
      Redis.publishMessage(`trade@${market}`, {
        stream: `trade@${market}`,
        data: {
          e: "trade",
          t: fill.tradeId,
          m: fill.otherUserId === userId, // TODO: Is this right?
          p: fill.price,
          q: fill.qty.toString(),
          s: market,
        },
      });
    });
  }
  public publishWsDepthUpdates(
    fills: Fill[],
    price: string,
    side: "buy" | "sell",
    market: string,
  ) {
    const orderbook = this.orderbooks.find((o) => o.ticker() === market);
    if (!orderbook) {
      return;
    }
    const depth = orderbook.getDepth();
    if (side === "buy") {
      const updatedAsks = depth?.asks.filter((x) =>
        fills.map((f) => f.price).includes(x[0].toString()),
      );
      const updatedBid = depth?.bids.find((x) => x[0] === price);
      RedisManager.getInstance().publishMessage(`depth@${market}`, {
        stream: `depth@${market}`,
        data: {
          a: updatedAsks,
          b: updatedBid ? [updatedBid] : [],
          e: "depth",
        },
      });
    }
    if (side === "sell") {
      const updatedBids = depth?.bids.filter((x) =>
        fills.map((f) => f.price).includes(x[0].toString()),
      );
      const updatedAsk = depth?.asks.find((x) => x[0] === price);
      RedisManager.getInstance().publishMessage(`depth@${market}`, {
        stream: `depth@${market}`,
        data: {
          a: updatedAsk ? [updatedAsk] : [],
          b: updatedBids,
          e: "depth",
        },
      });
    }
  }
  public sendUpdateDepthAt(price: string, market: string) {
    const orderbook = this.orderbooks.find((o) => o.ticker() === market);
    if (!orderbook) {
      return;
    }
    const depth = orderbook.getDepth();
    const updatedBids = depth?.bids.filter((x) => x[0] === price);
    const updatedAsks = depth?.asks.filter((x) => x[0] === price);

    RedisManager.getInstance().publishMessage(`depth@${market}`, {
      stream: `depth@${market}`,
      data: {
        a: updatedAsks.length ? updatedAsks : [[price, "0"]],
        b: updatedBids.length ? updatedBids : [[price, "0"]],
        e: "depth",
      },
    });
  }

  public updateBalance(
    userId: string,
    baseAsset: string,
    quoteAsset: string,
    side: "buy" | "sell",
    fills: Fill[],
    executedQty: number,
  ) {
    if (side === "buy") {
      fills.forEach((fill) => {
        // Update quote asset balance
        //@ts-ignore
        this.balances.get(fill.otherUserId)[quoteAsset].available =
          this.balances.get(fill.otherUserId)?.[quoteAsset].available ?? 0 +
          Number(fill.qty) * Number(fill.price);

        //@ts-ignore
        this.balances.get(userId)[quoteAsset].locked =
          this.balances.get(userId)?.[quoteAsset].locked ?? 0 -
          Number(fill.qty) * Number(fill.price);

        // Update base asset balance

        //@ts-ignore
        this.balances.get(fill.otherUserId)[baseAsset].locked =
          this.balances.get(fill.otherUserId)?.[baseAsset].locked ?? 0 - fill.qty;

        //@ts-ignore
        this.balances.get(userId)[baseAsset].available =
          this.balances.get(userId)?.[baseAsset].available ?? 0 + fill.qty;
      });
    } else {
      fills.forEach((fill) => {
        // Update quote asset balance
        //@ts-ignore
        this.balances.get(fill.otherUserId)[quoteAsset].locked =
          this.balances.get(fill.otherUserId)?.[quoteAsset].locked ?? 0 -
          Number(fill.qty) * Number(fill.price);

        //@ts-ignore
        this.balances.get(userId)[quoteAsset].available =
          this.balances.get(userId)?.[quoteAsset].available ?? 0 +
          Number(fill.qty) * Number(fill.price);

        // Update base asset balance

        //@ts-ignore
        this.balances.get(fill.otherUserId)[baseAsset].available =
          this.balances.get(fill.otherUserId)?.[baseAsset].available ?? 0 + fill.qty;

        //@ts-ignore
        this.balances.get(userId)[baseAsset].locked =
          this.balances.get(userId)?.[baseAsset].locked ?? 0  - fill.qty;
      });
    }
  }
  public checkAndLockFunds(
    baseAsset: string,
    quoteAsset: string,
    side: "buy" | "sell",
    userId: string,
    asset: string,
    price: string,
    quantity: string,
  ) {
    if (side === "buy") {
      if (
        (this.balances.get(userId)?.[quoteAsset]?.available || 0) <
        Number(quantity) * Number(price)
      ) {
        throw new Error("Insufficient funds");
      }
      //@ts-ignore
      this.balances.get(userId)[quoteAsset].available =
        this.balances.get(userId)?.[quoteAsset].available ?? 0  -
        Number(quantity) * Number(price);

      //@ts-ignore
      this.balances.get(userId)[quoteAsset].locked =
        this.balances.get(userId)?.[quoteAsset].locked ?? 0 +
        Number(quantity) * Number(price);
    } else {
      if (
        (this.balances.get(userId)?.[baseAsset]?.available || 0) <
        Number(quantity)
      ) {
        throw new Error("Insufficient funds");
      }
      //@ts-ignore
      this.balances.get(userId)[baseAsset].available =
        this.balances.get(userId)?.[baseAsset].available  ?? 0- Number(quantity);

      //@ts-ignore
      this.balances.get(userId)[baseAsset].locked =
        this.balances.get(userId)?.[baseAsset].locked ?? 0+ Number(quantity);
    }
  }
  public onRamp(userId: string, amount: number) {
    const userBalance = this.balances.get(userId);
    if (!userBalance) {
      this.balances.set(userId, {
        [BASE_CURRENCY]: {
          available: amount,
          locked: 0,
        },
      });
    } else {
      userBalance[BASE_CURRENCY].available += amount;
    }
  }

  public setBaseBalances() {
    this.balances.set("1", {
      [BASE_CURRENCY]: {
        available: 10000000,
        locked: 0,
      },
      TATA: {
        available: 10000000,
        locked: 0,
      },
    });

    this.balances.set("2", {
      [BASE_CURRENCY]: {
        available: 10000000,
        locked: 0,
      },
      TATA: {
        available: 10000000,
        locked: 0,
      },
    });

    this.balances.set("5", {
      [BASE_CURRENCY]: {
        available: 10000000,
        locked: 0,
      },
      TATA: {
        available: 10000000,
        locked: 0,
      },
    });
  }
  public setOrderbookStatusInDb(snapshot:{ orderbooks: { baseAsset: string; bids: Order[]; asks: Order[]; lastTradeId: number; currentPrice: number; }[]; balances: [string, UserBalance][]; }){
    const Redis = RedisManager.getInstance()
    Redis.pushMessage({
      type: "ORDERBOOK_STATE",
      data:{
        orderbooks:snapshot.orderbooks,
        balances: snapshot.balances 
      }
    })
  }
  // no need to send on every change we need to send in every 15 min
  public setKlineToDb(kline: Kline){
    const Redis = RedisManager.getInstance();
    Redis.pushMessage({
      type: "ADD_KLINE",
      data: kline
    });
  }
}
