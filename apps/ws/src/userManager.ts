import { SubscriptionManager } from "./subscriptionManager";
import { User } from "./user";
import { WebSocket } from "ws";

export class UserManager {
  private users: Map<string, User> = new Map();
  private static instance: UserManager;
  private constructor() {}
  public static getInstance(): UserManager {
    if (!this.instance) {
      this.instance = new UserManager();
    }
    return this.instance;
  }
  public addUser(ws: WebSocket) {
    const id = this.getRandomId();
    const user: User = new User(id, ws);
    this.users.set(id, user);
    this.registerOnClose(ws, id);
    console.log(`User connected and id `)
    return user;
  }
  private registerOnClose(ws: WebSocket, id: string) {
    ws.on("close", () => {
      SubscriptionManager.getInstance().userLeft(id);
    });
  }
  public getUser(id: string) {
    return this.users.get(id);
  }
  private getRandomId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
