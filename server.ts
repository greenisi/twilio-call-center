import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";
import { handleTwilioMediaStream } from "./lib/gemini-live-bridge";
import { initPool } from "./lib/gemini-session-pool";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ server, path: "/media-stream" });

  wss.on("connection", (ws: WebSocket, req) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const callType = url.searchParams.get("callType") ?? "inbound";
    console.log(`[WS] Twilio media stream connected (${callType})`);
    handleTwilioMediaStream(ws, callType);
  });

  server.listen(port, () => {
    console.log(`> Ready on port ${port}`);
    initPool();
  });
});
