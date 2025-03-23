import { Client } from "pg";
import { createClient } from "redis";

export const pgClient = new Client({
  user: "your_user",
  host: "timescaledb",
  // host:"localhost",
  database: "my_database",
  password: "your_password",
  port: 5432,
})

  export const redisClient =createClient({
    url: "redis://redis:6379", // ✅ Use Docker Compose service name
  });
  // export const redisClient = createClient();