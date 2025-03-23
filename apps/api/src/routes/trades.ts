import { Router } from "express";
import { Client } from "pg";

const client = new Client({
  user: "your_user",
  host: "timescaledb",
  // host: "localhost",
  database: "my_database",
  password: "your_password",
  port: 5432,
});
client.connect();

export const tradesRouter = Router();
// tradesRouter.get("/", async (req, res) => {
//   const { market } = req.query;
//   // Get from DB
//   if(!market){
//     res.status(400).json({error: 'Market is required'});
//   }

//   try {
//     const result = await client.query(`SELECT isBuyerMaker,price,quantity, quoteQuantity,timestamp FROM tata_prices WHERE symbol = $1 ORDER BY timestamp DESC LIMIT 30;`,[market]);
//     if(result.rows.length === 0){
//       res.status(404).json({error: `No trades found for market ${market}`});
//     }

//     // TODO: may need to destructure result and then return; result.rows.map((row)=>({}))

//     const trade = result.rows.map((row)=>({
//       id: row.id,
//       isBuyerMaker: row.isBuyerMaker,
//       price: row.price,
//       quantity: row.quantity,
//       quoteQuantity: row.quoteQuantity,
//       timestamp: row.timestamp,
//     }))
//     res.json(trade);
//   } catch (e) {
//     console.error('Error fetching trades:', e);
//     res.status(500).json({error: 'Failed to fetch trades'});
//   }
// });


tradesRouter.get("/", async (req, res) => {
  const { market } = req.query;
  try {
    // Dummy data for testing
    const trade = [
      {
        id: 1,
        isBuyerMaker: true,
        price: "100.5",
        quantity: "10",
        quoteQuantity: "1005",
        timestamp: Date.now(),
      },
      {
        id: 2,
        isBuyerMaker: false,
        price: "101.0",
        quantity: "5",
        quoteQuantity: "505",
        timestamp: Date.now() - 10000,
      },
      {
        id: 3,
        isBuyerMaker: true,
        price: "99.8",
        quantity: "15",
        quoteQuantity: "1497",
        timestamp: Date.now() - 20000,
      },
    ];

    res.json(trade);
  } catch (e) {
    console.error('Error fetching trades:', e);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});
