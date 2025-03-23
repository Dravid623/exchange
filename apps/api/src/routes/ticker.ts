import { Router } from "express";

export const tickersRouter = Router();

tickersRouter.get("/", async (req, res) => {
  const hardcodedTicker = [
    {
      firstPrice: "1001.00",
      high: "1020.00",
      lastPrice: "1010.50",
      low: "995.00",
      priceChange: "-10.50",
      priceChangePercent: "1.05",
      quoteVolume: "50000",
      symbol: "TATA_INR",
      trades: "100",
      volume: "45000",
    },
  ];

  res.json(hardcodedTicker);
});
