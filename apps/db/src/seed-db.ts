const { Client } = require("pg");

const client = new Client({
  user: "your_user",
  host: "timescaledb",
  // host:"localhost",
  database: "my_database",
  password: "your_password",
  port: 5432,
});

async function initializeDB() {
  await client.connect();

  console.log("Dropping dependent materialized views...");

  // Drop materialized views first
  await client.query(`DROP MATERIALIZED VIEW IF EXISTS klines_1m CASCADE;`);
  await client.query(`DROP MATERIALIZED VIEW IF EXISTS klines_1h CASCADE;`);
  await client.query(`DROP MATERIALIZED VIEW IF EXISTS klines_1w CASCADE;`);

  console.log("Dropping table tata_prices...");
  await client.query(`DROP TABLE IF EXISTS tata_prices CASCADE;`);

  console.log("Creating tata_prices table...");
  await client.query(`
        CREATE TABLE "tata_prices"(
            time            TIMESTAMP WITH TIME ZONE NOT NULL,
            price           DOUBLE PRECISION,
            volume          DOUBLE PRECISION,
            currency_code   VARCHAR (10)
        );
  `);

  console.log("Creating hypertable...");
  await client.query(`SELECT create_hypertable('tata_prices', 'time', 'price', 2);`);

  console.log("Creating materialized views...");
  await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1m AS
        SELECT
            time_bucket('1 minute', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            sum(volume) AS volume,
            currency_code
        FROM tata_prices
        GROUP BY bucket, currency_code;
  `);

  await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1h AS
        SELECT
            time_bucket('1 hour', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            sum(volume) AS volume,
            currency_code
        FROM tata_prices
        GROUP BY bucket, currency_code;
  `);

  await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1w AS
        SELECT
            time_bucket('1 week', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            sum(volume) AS volume,
            currency_code
        FROM tata_prices
        GROUP BY bucket, currency_code;
  `);

  console.log("Creating kline table...");
  await client.query(`
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
        );
  `);

  console.log("Database initialized successfully ✅");
  await client.end();
}

initializeDB().catch(console.error);
