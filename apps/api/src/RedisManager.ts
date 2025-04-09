import { createClient, RedisClientType } from "redis";
import { MessageFromOrderbook, MessageToEngine } from "./types";

export class RedisManager {
  private client: RedisClientType;
  private publisher: RedisClientType;
  private static instance: RedisManager;

  private constructor() {
    this.client = createClient({ url: "redis://redis:6379",});
    this.client.connect();
    this.publisher = createClient({ url: "redis://redis:6379",});
    this.publisher.connect();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager();
    }
    return this.instance;
  }

  public sendAndAwait(message: MessageToEngine) {
    return new Promise<MessageFromOrderbook>((resovle) => {
      const id = this.getRandomClientId();
      this.client.subscribe(id, (message) => {
        this.client.unsubscribe(id);
        resovle(JSON.parse(message));
      });
      this.publisher.lPush(
        "message",
        JSON.stringify({ clientId: id, message }),
      ).then(()=>{
        this.publisher.publish("messageToEngine","start")
      });
    });
  }
  public getRandomClientId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
