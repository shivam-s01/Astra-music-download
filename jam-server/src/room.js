// Astra Jam room logic — pure JS, no Cloudflare APIs, so it can be unit-tested
// in Node. The Durable Object in index.js only wires sockets/storage/alarms in.
//
// Wire format: { type, payload }. See PROTOCOL.md.

export const MAX_MEMBERS = 4;
export const APPROVAL_TIMEOUT_MS = 75_000; // host has this long to answer a join request
export const HOST_GRACE_MS = 30_000; // host offline this long -> Jam moves to a guest
export const SEAT_GRACE_MS = 10 * 60_000; // a dropped member can come back this long
export const CODE_RE = /^[2-9A-HJKMNP-Z]{6}$/;
const MAX_MSG_BYTES = 64 * 1024;
const MAX_RELAY_BYTES = 32 * 1024;
const MAX_MSGS_PER_SEC = 100;
const STATUSES = new Set(["ok", "buffering", "syncing"]);
const TRACK_KEYS = ["id", "title", "artist", "album", "artworkUrl", "duration", "language", "year", "source", "artistChannelId"];

const str = (v, max) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";
const avatarOf = (v) => {
  const s = str(v, 300);
  return /^https?:\/\//i.test(s) ? s : null;
};

function cleanTrack(t) {
  if (!t || typeof t !== "object") return null;
  const out = {};
  for (const k of TRACK_KEYS) {
    const v = t[k];
    if (v === undefined || v === null) continue;
    if (k === "duration") {
      if (typeof v === "number" && Number.isFinite(v) && v >= 0) out[k] = Math.round(v);
    } else if (typeof v === "string") {
      out[k] = v.slice(0, k === "artworkUrl" ? 400 : 200);
    }
  }
  if (!out.id || !out.title) return null;
  return out;
}

export class JamRoomCore {
  /**
   * io = { send(ws, text), close(ws, code, reason), now(), uuid(), save(snapshot|null), setAlarm(ms|null) }
   */
  constructor(io) {
    this.io = io;
    this.code = "";
    this.room = null;
    this.conns = new Map(); // ws -> {ws, userId, pendingId, hits, windowStart}
  }

  setCode(code) {
    if (!this.code) this.code = code;
  }

  // ── lifecycle ────────────────────────────────────────────────────────────
  load(snap) {
    if (!snap || !Array.isArray(snap.users)) return;
    const now = this.io.now();
    this.code = snap.code || this.code;
    this.room = {
      code: snap.code,
      name: snap.name,
      hostId: snap.hostId,
      song: snap.song || "",
      createdAt: snap.createdAt || now,
      users: new Map(),
      pending: new Map(),
      suggestions: new Map(),
    };
    for (const u of snap.users) {
      this.room.users.set(u.id, { ...u, ws: null, connected: false, lostAt: now });
    }
    if (!this.room.users.size) this.room = null;
    this.schedule();
  }

  onOpen(ws) {
    this.conns.set(ws, { ws, userId: null, pendingId: null, hits: 0, windowStart: this.io.now() });
  }

  onClose(ws) {
    const c = this.conns.get(ws);
    this.conns.delete(ws);
    if (!c || !this.room) return;
    if (c.pendingId) {
      this.#dropPending(c.pendingId, true);
      return;
    }
    const u = c.userId ? this.room.users.get(c.userId) : null;
    if (u && u.ws === ws) {
      u.ws = null;
      u.connected = false;
      u.lostAt = this.io.now();
      this.#broadcastState();
    }
  }

  onAlarm() {
    const r = this.room;
    if (!r) return;
    const now = this.io.now();
    for (const p of [...r.pending.values()]) {
      if (now - p.at >= APPROVAL_TIMEOUT_MS) {
        this.#tx(p.ws, "join_rejected", { reason: "timeout" });
        this.#dropPending(p.id, true);
      }
    }
    let changed = false;
    for (const u of [...r.users.values()]) {
      if (!u.connected && u.lostAt && now - u.lostAt >= SEAT_GRACE_MS) {
        this.#removeUser(u.id, false);
        changed = true;
        if (!this.room) return;
      }
    }
    const host = r.users.get(r.hostId);
    if (host && !host.connected && host.lostAt && now - host.lostAt >= HOST_GRACE_MS) {
      const next = this.#nextHost(host.id, true);
      if (next) {
        this.#setHost(next);
        changed = true;
      }
    }
    if (changed) this.#broadcastState();
    else this.schedule();
  }

  onMessage(ws, text) {
    const c = this.conns.get(ws);
    if (!c) return;
    const now = this.io.now();
    if (now - c.windowStart >= 1000) {
      c.windowStart = now;
      c.hits = 0;
    }
    if (++c.hits > MAX_MSGS_PER_SEC) {
      this.io.close(ws, 1008, "rate limit");
      return;
    }
    if (typeof text !== "string" || text.length > MAX_MSG_BYTES) return;
    let msg;
    try {
      msg = JSON.parse(text);
    } catch {
      return;
    }
    if (!msg || typeof msg.type !== "string") return;
    const p = msg.payload && typeof msg.payload === "object" ? msg.payload : {};
    try {
      this.#dispatch(c, msg.type, p);
    } catch (e) {
      this.#err(ws, "internal", "server error");
    }
  }

  // ── dispatch ─────────────────────────────────────────────────────────────
  #dispatch(c, type, p) {
    const ws = c.ws;
    switch (type) {
      case "ping":
        return this.#tx(ws, "pong", { t0: p.t0, ts: this.io.now() });
      case "peek_room":
        return this.#peek(ws);
      case "create_room":
        return this.#create(c, p);
      case "join_room":
        return this.#join(c, p);
      case "reconnect":
        return this.#reconnect(c, p);
      case "leave_room":
        return this.#leave(c);
    }
    // everything below needs a seat
    const u = this.#me(c);
    if (!u) return this.#err(ws, "not_in_room", "join a room first");
    const isHost = this.room.hostId === u.id;
    switch (type) {
      case "status": {
        const s = STATUSES.has(p.status) ? p.status : "ok";
        if (isHost && typeof p.song === "string") this.room.song = str(p.song, 120);
        if (u.status !== s) {
          u.status = s;
          this.#broadcastState();
        }
        return;
      }
      case "relay":
        return this.#relay(u, p);
      case "suggest_track":
        return this.#suggest(u, p);
    }
    if (!isHost) return this.#err(ws, "not_host", "only the host can do that");
    switch (type) {
      case "approve_join":
        return this.#approve(String(p.user_id || ""));
      case "reject_join":
        return this.#reject(String(p.user_id || ""), str(p.reason, 40) || "rejected");
      case "kick_user": {
        const t = this.room.users.get(String(p.user_id || ""));
        if (!t || t.id === u.id) return;
        if (t.ws) {
          this.#tx(t.ws, "kicked", { reason: str(p.reason, 60) || "kicked" });
          const tc = this.conns.get(t.ws);
          if (tc) tc.userId = null;
        }
        this.#removeUser(t.id, true);
        return;
      }
      case "transfer_host": {
        const t = this.room.users.get(String(p.new_host_id || ""));
        if (!t || t.id === u.id || !t.connected) return this.#err(ws, "bad_request", "can't hand over to that person");
        this.#setHost(t.id);
        this.#broadcastState();
        return;
      }
      case "end_room":
        return this.#destroy("ended", u.id);
      case "approve_suggestion":
      case "reject_suggestion": {
        const id = String(p.suggestion_id || "");
        const s = this.room.suggestions.get(id);
        if (!s) return;
        this.room.suggestions.delete(id);
        const from = this.room.users.get(s.fromUserId);
        if (from?.ws) {
          if (type === "approve_suggestion") this.#tx(from.ws, "suggestion_approved", { suggestion_id: id, track: s.track });
          else this.#tx(from.ws, "suggestion_rejected", { suggestion_id: id, reason: str(p.reason, 60) || null });
        }
        return;
      }
    }
    this.#err(ws, "bad_request", "unknown message");
  }

  // ── pre-room ─────────────────────────────────────────────────────────────
  #peek(ws) {
    const r = this.room;
    if (!r) return this.#err(ws, "room_not_found", "no such Jam");
    const host = r.users.get(r.hostId);
    this.#tx(ws, "room_info", {
      room_name: r.name,
      host_name: host?.username || "",
      host_avatar: host?.avatar || null,
      song: r.song || "",
      count: r.users.size,
      avatars: [...r.users.values()].map((u) => u.avatar),
    });
  }

  #create(c, p) {
    if (c.userId || c.pendingId) return this.#err(c.ws, "bad_request", "already in a room");
    if (this.room) return this.#err(c.ws, "room_exists", "code taken");
    const now = this.io.now();
    const username = str(p.username, 14) || "Host";
    const u = this.#newUser(username, avatarOf(p.avatar), now);
    u.ws = c.ws;
    this.room = {
      code: this.code,
      name: str(p.room_name, 24) || `${username}’s Jam`,
      hostId: u.id,
      song: "",
      createdAt: now,
      users: new Map([[u.id, u]]),
      pending: new Map(),
      suggestions: new Map(),
    };
    c.userId = u.id;
    this.#tx(c.ws, "room_created", { room_code: this.code, user_id: u.id, session_token: u.token, state: this.#state() });
    this.#persist();
    this.schedule();
  }

  #join(c, p) {
    const r = this.room;
    if (c.userId || c.pendingId) return this.#err(c.ws, "bad_request", "already in a room");
    if (!r) return this.#err(c.ws, "room_not_found", "no such Jam");
    if (r.users.size >= MAX_MEMBERS) return this.#err(c.ws, "room_full", "Jam is full");
    const id = this.io.uuid().slice(0, 8);
    const pend = { id, username: str(p.username, 14) || "Guest", avatar: avatarOf(p.avatar), ws: c.ws, at: this.io.now() };
    r.pending.set(id, pend);
    c.pendingId = id;
    this.#tx(c.ws, "join_pending", {});
    this.#notifyHostOf(pend);
    this.schedule();
  }

  #reconnect(c, p) {
    const token = typeof p.session_token === "string" ? p.session_token : "";
    const r = this.room;
    const u = r && token ? [...r.users.values()].find((x) => x.token === token) : null;
    if (!u) return this.#err(c.ws, "session_not_found", "seat expired");
    if (c.userId || c.pendingId) return this.#err(c.ws, "bad_request", "already in a room");
    if (u.ws && u.ws !== c.ws) {
      const old = this.conns.get(u.ws);
      if (old) old.userId = null; // so its close event doesn't mark us offline
      this.io.close(u.ws, 4000, "replaced");
    }
    u.ws = c.ws;
    u.connected = true;
    u.lostAt = null;
    c.userId = u.id;
    this.#tx(c.ws, "reconnected", {
      room_code: r.code,
      user_id: u.id,
      is_host: r.hostId === u.id,
      state: this.#state(),
    });
    if (r.hostId === u.id) this.#resendPending();
    this.#broadcastState();
  }

  #leave(c) {
    if (!this.room) return;
    if (c.pendingId) {
      this.#dropPending(c.pendingId, true);
      c.pendingId = null;
      return;
    }
    const u = this.#me(c);
    if (!u) return;
    c.userId = null;
    this.#removeUser(u.id, true);
  }

  // ── host actions ─────────────────────────────────────────────────────────
  #approve(id) {
    const r = this.room;
    const pend = r.pending.get(id);
    if (!pend) return;
    r.pending.delete(id);
    if (r.users.size >= MAX_MEMBERS) {
      this.#tx(pend.ws, "join_rejected", { reason: "full" });
      this.#clearPendingConn(pend);
      return this.schedule();
    }
    const u = this.#newUser(pend.username, pend.avatar, this.io.now(), id);
    u.ws = pend.ws;
    const conn = this.conns.get(pend.ws);
    if (!conn) return this.schedule(); // socket vanished meanwhile
    conn.pendingId = null;
    conn.userId = id;
    r.users.set(id, u);
    this.#tx(pend.ws, "join_approved", { room_code: r.code, user_id: id, session_token: u.token, state: this.#state() });
    this.#broadcastState();
  }

  #reject(id, reason) {
    const r = this.room;
    const pend = r.pending.get(id);
    if (!pend) return;
    r.pending.delete(id);
    this.#tx(pend.ws, "join_rejected", { reason });
    this.#clearPendingConn(pend);
    this.schedule();
  }

  // ── members ──────────────────────────────────────────────────────────────
  #relay(u, p) {
    const data = p.data;
    if (!data || typeof data !== "object") return;
    const out = JSON.stringify({ type: "relay", payload: { from: u.id, data } });
    if (out.length > MAX_RELAY_BYTES) return;
    const r = this.room;
    const to = typeof p.to === "string" ? p.to : "";
    if (to) {
      const t = to === "host" ? r.users.get(r.hostId) : r.users.get(to);
      if (t?.ws && t.id !== u.id) this.io.send(t.ws, out);
      return;
    }
    for (const t of r.users.values()) if (t.ws && t.id !== u.id) this.io.send(t.ws, out);
  }

  #suggest(u, p) {
    const r = this.room;
    if (r.hostId === u.id) return;
    const track = cleanTrack(p.track);
    if (!track) return this.#err(u.ws, "bad_request", "bad track");
    const mine = [...r.suggestions.values()].filter((s) => s.fromUserId === u.id).length;
    if (mine >= 5 || r.suggestions.size >= 20) return;
    const id = this.io.uuid().slice(0, 8);
    r.suggestions.set(id, { fromUserId: u.id, track });
    const host = r.users.get(r.hostId);
    if (host?.ws) {
      this.#tx(host.ws, "suggestion_received", {
        suggestion_id: id,
        from_user_id: u.id,
        from_username: u.username,
        track,
      });
    }
  }

  // ── helpers ──────────────────────────────────────────────────────────────
  #me(c) {
    const r = this.room;
    if (!r || !c.userId) return null;
    const u = r.users.get(c.userId);
    return u && u.ws === c.ws ? u : null;
  }

  #newUser(username, avatar, now, id) {
    return {
      id: id || this.io.uuid().slice(0, 8),
      username,
      avatar,
      joinedAt: now,
      status: "ok",
      token: this.io.uuid(),
      ws: null,
      connected: true,
      lostAt: null,
    };
  }

  #notifyHostOf(pend) {
    const host = this.room.users.get(this.room.hostId);
    if (host?.ws) this.#tx(host.ws, "join_request", { user_id: pend.id, username: pend.username, avatar: pend.avatar });
  }

  #resendPending() {
    for (const pend of this.room.pending.values()) this.#notifyHostOf(pend);
  }

  #dropPending(id, tellHost) {
    const r = this.room;
    if (!r) return;
    const pend = r.pending.get(id);
    if (!pend) return;
    r.pending.delete(id);
    this.#clearPendingConn(pend);
    const host = r.users.get(r.hostId);
    if (tellHost && host?.ws) this.#tx(host.ws, "join_request_cancelled", { user_id: id });
    this.schedule();
  }

  #clearPendingConn(pend) {
    const c = this.conns.get(pend.ws);
    if (c && c.pendingId === pend.id) c.pendingId = null;
  }

  /** Oldest connected member (any member if [anyIfNone] and nobody is connected). */
  #nextHost(excludeId, connectedOnly) {
    const list = [...this.room.users.values()]
      .filter((u) => u.id !== excludeId && (!connectedOnly || u.connected))
      .sort((a, b) => a.joinedAt - b.joinedAt);
    return list[0]?.id || null;
  }

  #setHost(id) {
    const r = this.room;
    r.hostId = id;
    const u = r.users.get(id);
    for (const t of r.users.values()) {
      if (t.ws) this.#tx(t.ws, "host_changed", { new_host_id: id, new_host_name: u?.username || "" });
    }
    this.#resendPending();
  }

  #removeUser(id, broadcast) {
    const r = this.room;
    const u = r.users.get(id);
    if (!u) return;
    r.users.delete(id);
    for (const [sid, s] of r.suggestions) if (s.fromUserId === id) r.suggestions.delete(sid);
    if (r.users.size === 0) return this.#destroy(null);
    if (r.hostId === id) {
      const next = this.#nextHost(id, true) || this.#nextHost(id, false);
      this.#setHost(next);
    }
    if (broadcast) this.#broadcastState();
    else this.#persist();
  }

  #destroy(reason, exceptId) {
    const r = this.room;
    if (!r) return;
    for (const u of r.users.values()) {
      if (u.ws && u.id !== exceptId && reason) this.#tx(u.ws, "room_ended", { reason });
      const c = u.ws ? this.conns.get(u.ws) : null;
      if (c) c.userId = null;
    }
    for (const pend of r.pending.values()) {
      this.#tx(pend.ws, "join_rejected", { reason: "ended" });
      this.#clearPendingConn(pend);
    }
    const ender = exceptId ? r.users.get(exceptId) : null;
    if (ender?.ws) {
      const c = this.conns.get(ender.ws);
      if (c) c.userId = null;
    }
    this.room = null;
    this.io.save(null);
    this.io.setAlarm(null);
  }

  #state() {
    const r = this.room;
    const users = [...r.users.values()]
      .sort((a, b) => (a.id === r.hostId ? -1 : b.id === r.hostId ? 1 : a.joinedAt - b.joinedAt))
      .map((u) => ({
        user_id: u.id,
        username: u.username,
        avatar: u.avatar,
        is_host: u.id === r.hostId,
        is_connected: u.connected,
        status: u.status,
        joined_at: u.joinedAt,
      }));
    return { room_code: r.code, room_name: r.name, host_id: r.hostId, users };
  }

  #broadcastState() {
    const r = this.room;
    if (!r) return;
    const msg = JSON.stringify({ type: "room_state", payload: this.#state() });
    for (const u of r.users.values()) if (u.ws) this.io.send(u.ws, msg);
    this.#persist();
    this.schedule();
  }

  #persist() {
    const r = this.room;
    if (!r) return;
    this.io.save({
      code: r.code,
      name: r.name,
      hostId: r.hostId,
      song: r.song,
      createdAt: r.createdAt,
      users: [...r.users.values()].map((u) => ({
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        joinedAt: u.joinedAt,
        status: u.status,
        token: u.token,
      })),
    });
  }

  schedule() {
    const r = this.room;
    if (!r) return this.io.setAlarm(null);
    let next = Infinity;
    for (const p of r.pending.values()) next = Math.min(next, p.at + APPROVAL_TIMEOUT_MS);
    for (const u of r.users.values()) {
      if (!u.connected && u.lostAt) {
        next = Math.min(next, u.lostAt + SEAT_GRACE_MS);
        if (u.id === r.hostId) next = Math.min(next, u.lostAt + HOST_GRACE_MS);
      }
    }
    this.io.setAlarm(Number.isFinite(next) ? next : null);
  }

  #tx(ws, type, payload) {
    if (ws) this.io.send(ws, JSON.stringify({ type, payload }));
  }

  #err(ws, code, message) {
    this.#tx(ws, "error", { code, message });
  }
}
