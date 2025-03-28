import { Router, Request, Response } from "express";
import { Client } from "pg";

const client = new Client({
  user: "your_user",
  host: "timescaledb",
  database: "my_database",
  password: "your_password",
  port: 5432,
});
client.connect();

export const klineRouter = Router();

async function getKlineData(req: Request, res: Response): Promise<void> {
  try {
    const { symbol, interval, startTime, endTime } = req.query;

    if (!startTime || !endTime) {
      res.status(400).json({ error: "Missing required query parameters: startTime, endTime" });
      return;
    }

    const query = `
      SELECT open, close, high, low, volume, quoteVolume, startTime, endTime
      FROM tata_prices_kline
      WHERE starttime >= $1 AND endtime <= $2
      ORDER BY startTime ASC;
    `;

    const { rows } = await client.query(query, [startTime, endTime]);
    res.json(rows.length > 0 ? rows : [{}]);
  } catch (error) {
    console.error("Database query error:", error);
    res.send([{}])
  }
}

klineRouter.get("/", getKlineData);

