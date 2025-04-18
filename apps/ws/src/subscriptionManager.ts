import { createClient, RedisClientType } from "redis";
import { UserManager } from "./userManager";
import { main } from "./marketMaker";

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private subscriptions: Map<string, string[]> = new Map();
  private reverseSubscriptions: Map<string, string[]> = new Map();
  private redisClient: RedisClientType;
  private intervalId: ReturnType<typeof setInterval> | undefined;

  private constructor() {
    this.redisClient = createClient({
      url: 'redis://redis:6379'
    });
    this.redisClient.connect();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new SubscriptionManager();
    }
    return this.instance;
  }
  public subscribe(userId: string, subscription: string) {
    if (this.subscriptions.get(userId)?.includes(subscription)) {
      return;
    }
    this.subscriptions.set(
      userId,
      (this.subscriptions.get(userId) || []).concat(subscription),
    );
    this.reverseSubscriptions.set(
      subscription,
      (this.reverseSubscriptions?.get(subscription) || []).concat(userId),
    );
    if (this.reverseSubscriptions?.get(subscription)?.length === 1) {
      this.intervalId = setInterval(() => {
        main()
      }, 2000);
      this.redisClient.subscribe(subscription, (message, channel)=>this.redisCallbackHandler(message,channel));
    }
  }

  private redisCallbackHandler = (message: string, channel: string) => {
    const parsedMessage = JSON.parse(message);
    this.reverseSubscriptions
      ?.get(channel)
      ?.forEach((s) =>
        UserManager.getInstance().getUser(s)?.emit(parsedMessage),
      );
  }

  public unsubscribe(userId: string, subscription: string) {
    if (this.subscriptions.get(userId)) {
      this.subscriptions.set(
        userId,
        (this.subscriptions.get(userId) || []).filter(
          (s) => s !== subscription,
        ),
      );
    }
    const reverseSubscriptions = this.reverseSubscriptions.get(subscription);
    if (reverseSubscriptions) {
      this.reverseSubscriptions.set(
        subscription,
        reverseSubscriptions.filter((s) => s !== userId),
      );
      if (this.reverseSubscriptions.get(subscription)?.length === 0) {
        this.reverseSubscriptions.delete(subscription);
        this.redisClient.unsubscribe(subscription);
        clearInterval(this.intervalId)
      }
    }
  }
  public userLeft(userId: string) {
    console.log("user left " + userId);
    this.subscriptions.get(userId)?.forEach((s) => this.unsubscribe(userId, s));
  }

  public getSubscriptions(userId: string) {
    return this.subscriptions.get(userId) || [];
  }
}
