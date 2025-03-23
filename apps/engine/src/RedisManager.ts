import { createClient, RedisClientType } from "redis";
import { DbMessage } from "./types/dbMessage";
import { WsMessage } from "./types/ws";
import { MessageToApi } from "./types/api";

export class RedisManager {
  private client: RedisClientType;
  private static instance: RedisManager;

  constructor() {
    this.client = createClient({url: "redis://redis:6379",});
    this.client.connect();
  }
  public static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager();
    }
    return this.instance;
  }
  public pushMessage(message: DbMessage) {
    this.client.lPush("db_processor", JSON.stringify(message));
  }
  public publishMessage(chennel: string, message: WsMessage) {
    this.client.publish(chennel, JSON.stringify(message));
  }
  public sendToApi(clientId: string, message: MessageToApi) {
    this.client.publish(clientId, JSON.stringify(message));
  }
}
