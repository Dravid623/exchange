import { createClient } from "redis";
import { Engine } from "./trade/engine";

const redisClient = createClient({url: "redis://redis:6379",});
const subscriber = redisClient.duplicate();
const engine = new Engine();
let isProcessing = false;

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processQueue() {
  if(isProcessing) return;
  isProcessing = true;
  console.log("🔄 Start processing queue...");
  let idleTime = 0 ;
  while (idleTime < 1000) {
    const response = await redisClient.rPop("message");
    if (!response) {
      await delay(100);
      idleTime += 100;
    } else {
      idleTime = 0;
      engine.process(JSON.parse(response));
    }
  }
  isProcessing = false;
  console.log("⏹️ Stopped processing...")
}

async function main() {
  await redisClient.connect();
  await subscriber.connect();
  console.log(`✅ Connected to Redis!`);

  await subscriber.subscribe("messageToEngine", async()=>{
    await processQueue();
  })
}

main();