// Astra Jam server — Cloudflare Worker + one Durable Object per room.
//   wss://<worker>/ws?room=ABC234        (also /jam/ws)
// The room logic lives in room.js (unit-tested); this file only wires sockets,
// storage and alarms to it.
import { JamRoomCore, CODE_RE } from "./room.js";

export class JamRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.core = new JamRoomCore({
      send: (ws, text) => {
        try {
          ws.send(text);
        } catch {}
      },
      close: (ws, code, reason) => {
        try {
          ws.close(code, reason);
        } catch {}
      },
      now: () => Date.now(),
      uuid: () => crypto.randomUUID(),
      save: (snap) => {
        const p = snap ? ctx.storage.put("room", snap) : ctx.storage.delete("room");
        p.catch(() => {});
      },
      setAlarm: (t) => {
        const p = t ? ctx.storage.setAlarm(t) : ctx.storage.deleteAlarm();
        p.catch(() => {});
      },
    });
    ctx.blockConcurrencyWhile(async () => {
      const snap = await ctx.storage.get("room");
      if (snap) this.core.load(snap);
    });
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") return new Response("expected websocket", { status: 426 });
    const code = new URL(request.url).searchParams.get("room") || "";
    this.core.setCode(code);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    this.core.onOpen(server);
    server.addEventListener("message", (e) => this.core.onMessage(server, typeof e.data === "string" ? e.data : ""));
    const gone = () => this.core.onClose(server);
    server.addEventListener("close", gone);
    server.addEventListener("error", gone);
    return new Response(null, { status: 101, webSocket: client });
  }

  async alarm() {
    this.core.onAlarm();
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/ws" || url.pathname === "/jam/ws") {
      const code = (url.searchParams.get("room") || "").toUpperCase();
      if (!CODE_RE.test(code)) return new Response("bad room code", { status: 400 });
      if (request.headers.get("Upgrade") !== "websocket") return new Response("expected websocket", { status: 426 });
      const stub = env.JAM_ROOM.get(env.JAM_ROOM.idFromName(code));
      const u = new URL(request.url);
      u.searchParams.set("room", code);
      return stub.fetch(new Request(u.toString(), request));
    }
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response("Astra Jam server OK", { headers: { "content-type": "text/plain" } });
    }
    return new Response("not found", { status: 404 });
  },
};
