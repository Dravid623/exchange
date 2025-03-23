import { Router } from "express";
import { RedisManager } from "../RedisManager";

export const klineRouter = Router();

klineRouter.get("/", async (req, res) => {
     const { symbol, interval, startTime,endTime } = req.query;
     const response = [{}]
  
      res.json(response);
});
