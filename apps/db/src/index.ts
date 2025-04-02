import { pgClient } from "./db";
import { redisClient } from "./db";
import { DbMessage } from "./types";

async function main() {
  await pgClient.connect();
  console.log("✅ PostgreSQL connected");

  await redisClient.connect();
  console.log("✅ Redis connected");


  await setupDatabase();


  while (true) {
    try {
      if (!redisClient.isOpen) {
        console.error("❌ Redis client disconnected!");
        await redisClient.connect();
        console.log("🔄 Reconnected to Redis.");
      }

      // Fetch message from Redis
      const response = await redisClient.rPop("db_processor");
      if (!response) {
        await delay(1000); // Add delay to reduce CPU usage
        continue;
      }

      const data: DbMessage = JSON.parse(response);

      if (data.type === "TRADE_ADDED") {
        await handleTradeAdded(data);
      } else if (data.type === "ADD_KLINE") {
        await handleAddKline(data);
      } else if (data.type === "ORDERBOOK_STATE") {
        await handleOrderbookState(data);
      }
    } catch (error) {
      console.error("🚨 Error processing message:", error);
    }
  }
}

// 📌 Delay function to prevent high CPU usage
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 📌 Ensure required tables exist before processing data
async function setupDatabase() {
  const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS tata_prices (
      time TIMESTAMP WITH TIME ZONE NOT NULL,
      price DOUBLE PRECISION,
      volume DOUBLE PRECISION,
      currency_code VARCHAR(10)
    );

    CREATE TABLE IF NOT EXISTS tata_prices_kline (
    open TEXT,
    close TEXT,
    high TEXT,
    low TEXT,
    volume TEXT,
    quoteVolume TEXT,
    startTime TEXT NOT NULL,      -- Stored as TEXT
    endTime TEXT NOT NULL         -- Stored as TEXT
);


    CREATE TABLE IF NOT EXISTS tata_price_orderbook_state (
      id SERIAL PRIMARY KEY,
      orderbooks JSONB NOT NULL,
      balances JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await pgClient.query(createTablesQuery);
  console.log("✅ Database tables ensured.");
}

async function deleteGarbageKline() {
  const deleteGarbageKlineQuery = `DELETE FROM tata_prices_kline WHERE low::numeric = 0 OR open::numeric = 0 OR close::numeric = 0 OR (low::numeric=open::numeric AND open::numeric=close::numeric AND close::numeric=high::numeric)`;
  await pgClient.query(deleteGarbageKlineQuery);
}

async function handleTradeAdded(data: { type?: "TRADE_ADDED"; data: any }) {
  try {
    const { price, timestamp } = data.data;
    const query = "INSERT INTO tata_prices (time, price) VALUES ($1, $2)";
    const values = [new Date(timestamp), price];
    await pgClient.query(query, values);
  } catch (error) {
    console.error("❌ Error inserting TRADE_ADDED data:", error);
  }
}

async function handleAddKline(data: { type?: "ADD_KLINE"; data: any }) {
  try {
    const {
      open = null,
      close = null,
      high = null,
      low = null,
      volume = null,
      quoteVolume = null,
      startTime,
      endTime,
    } = data.data;

    const insertQuery = `
      INSERT INTO tata_prices_kline (open, close, high, low, volume, quoteVolume, startTime, endTime) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    const values = [
      open?.toString(),
      close?.toString(),
      high?.toString(),
      low?.toString(),
      volume?.toString(),
      quoteVolume?.toString(),
      startTime.toString(), // Ensure string
      endTime.toString(),
    ];

    await pgClient.query(insertQuery, values);
    await deleteGarbageKline()
  } catch (error) {
    console.error("❌ Error inserting ADD_KLINE data:", error);
  }
}

async function handleOrderbookState(data: {
  type?: "ORDERBOOK_STATE";
  data: any;
}) {
  try {
    const { orderbooks = [], balances = [] } = data.data;

    // Delete previous records before inserting a new one
    await pgClient.query(`DELETE FROM tata_price_orderbook_state`);

    const query = `INSERT INTO tata_price_orderbook_state (orderbooks, balances) VALUES ($1, $2)`;
    const values = [JSON.stringify(orderbooks), JSON.stringify(balances)];

    await pgClient.query(query, values);
  } catch (error) {
    console.error("❌ Error inserting ORDERBOOK_STATE data:", error);
  }
}

process.on("SIGINT", async () => {
  console.log("\n🔴 Shutting down...");
  await redisClient.quit();
  await pgClient.end();
  console.log("🛑 Process terminated.");
  process.exit(0);
});

main().catch(console.error);
