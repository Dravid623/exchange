import { pgClient } from "./db";
import { redisClient } from "./db";
import { DbMessage } from "./types";

async function main() {
  await pgClient.connect();
  console.log(`DB is connected`)
  await redisClient.connect();
  console.log("DB connected to redis");

  while (true) {
    const response = await redisClient.rPop("db_processor" as string);
    if (!response) {
    } else {
      const data: DbMessage = JSON.parse(response);
      if (data.type === "TRADE_ADDED") {
        console.log("adding data");
        console.log(data);
        const price = data.data.price;
        const timestamp = new Date(data.data.timestamp);
        const query = "INSERT INTO tata_prices (time, price) VALUES ($1, $2)";
        // TODO: How to add volume?
        const values = [timestamp, price];
        await pgClient.query(query, values);
      }
      if (data.type === "ADD_KLINE") {
        const {
          open = null,
          close = null,
          high = null,
          low = null,
          volume = null,
          quoteVolume = null,
          startTime,
          endTime,
          id
        } = data.data;
      
        // Ensure the table exists before inserting
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS tata_prices_kline (
            id SERIAL PRIMARY KEY,
            open TEXT,
            close TEXT,
            high TEXT,
            low TEXT,
            volume TEXT,
            quoteVolume TEXT,
            startTime TEXT NOT NULL,
            endTime TEXT NOT NULL,
            UNIQUE (id, startTime) -- Prevent duplicate entries
          )
        `;
      
        try {
          await pgClient.query(createTableQuery);
      
          // Insert data, replacing undefined values with NULL
          const insertQuery = `
            INSERT INTO tata_prices_kline (open, close, high, low, volume, quoteVolume, startTime, endTime, id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id, startTime) DO NOTHING
          `;
          
          const values = [
            open ?? null,
            close ?? null,
            high ?? null,
            low ?? null,
            volume ?? null,
            quoteVolume ?? null,
            startTime,
            endTime,
            id
          ];
      
          await pgClient.query(insertQuery, values);
        } catch (error) {
          console.error("Database error:", error);
        }
      }
      
      if (data.type === "ORDERBOOK_STATE") {
        const { orderbooks = [], balances = [] } = data.data;
      
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS tata_price_orderbook_state (
            id SERIAL PRIMARY KEY,
            orderbooks JSONB NOT NULL,
            balances JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
      
        try {
          await pgClient.query(createTableQuery);
      
          // Delete all existing records before inserting a new one
          await pgClient.query(`DELETE FROM tata_price_orderbook_state`);
      
          const query = `INSERT INTO tata_price_orderbook_state (orderbooks, balances) VALUES ($1, $2)`;
          const values = [JSON.stringify(orderbooks), JSON.stringify(balances)];
      
          await pgClient.query(query, values);
        } catch (error) {
          console.error("Database error:", error);
        }
      }
      // do we add 24H data in db
    }
  }
}

main();
