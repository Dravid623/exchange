import { createClient } from "redis";
import { Engine } from "./trade/engine";

async function main() {
  const redisClient = createClient({url: "redis://redis:6379",});
  await redisClient.connect();
  const engine = new Engine();
  console.log(`Connected to Redis!`);
  while (true) {
    const response = await redisClient.rPop("message" as string);
    if (!response) {
      await delay(1000);
      continue;
    } else {
      engine.process(JSON.parse(response));
    }
  }
}

main();
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

