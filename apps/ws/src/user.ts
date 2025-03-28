import { SubscriptionManager } from "./subscriptionManager";
import { IncomingMessage, SUBSCRIBE, UNSUBSCRIBE } from "./types/in";
import { OutgoingMessage } from "./types/out";
import { WebSocket } from "ws";

export class User {
  private id: string;
  private ws: WebSocket;
  private subscription: string[] = [];

  constructor(id: string, ws: WebSocket) {
    this.id = id;
    this.ws = ws;
    this.addListeners();
  }
  private subscribe(subscription: string) {
    this.subscription.push(subscription);
  }
  private unsubscribe(subscription: string) {
    this.subscription = this.subscription.filter((s) => s !== subscription);
  }
  public emit(message: OutgoingMessage) {
    this.ws.send(JSON.stringify(message));
  }

  private addListeners() {
    this.ws.on("message", (message: string) => {
      const parsedMessage: IncomingMessage = JSON.parse(message);
      if (parsedMessage.method === SUBSCRIBE) {
        parsedMessage.params.forEach((s) =>
          SubscriptionManager.getInstance().subscribe(this.id, s),
        );
      }
      if (parsedMessage.method === UNSUBSCRIBE) {
        parsedMessage.params.forEach((s) =>
          SubscriptionManager.getInstance().unsubscribe(this.id, s),
        );
      }
    });
  }
}
