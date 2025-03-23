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
    } else {
      engine.process(JSON.parse(response));
    }
  }
}

main();
