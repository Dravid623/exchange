import { WebSocketServer } from "ws";
import { UserManager } from "./userManager";

const wss = new WebSocketServer({ port: 3001 });
wss.on("connection", (ws) => {
  UserManager.getInstance().addUser(ws);
});
