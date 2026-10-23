import assert from "node:assert/strict";
import { JamRoomCore, MAX_MEMBERS, APPROVAL_TIMEOUT_MS, HOST_GRACE_MS, SEAT_GRACE_MS } from "../src/room.js";

let T = 1_000_000, n = 0, saved, alarm;
const io = {
  send: (ws, t) => ws.inbox.push(JSON.parse(t)),
  close: (ws) => { ws.closed = true; },
  now: () => T,
  uuid: () => `${(++n).toString(16).padStart(8, "0")}-0000-0000-0000-000000000000`,
  save: (s) => { saved = s; },
  setAlarm: (t) => { alarm = t; },
};
const mk = () => { const c = new JamRoomCore(io); c.setCode("ABC234"); return c; };
const sock = (core) => { const ws = { inbox: [], closed: false }; core.onOpen(ws); return ws; };
const send = (core, ws, type, payload = {}) => core.onMessage(ws, JSON.stringify({ type, payload }));
const last = (ws, type) => [...ws.inbox].reverse().find((m) => m.type === type);
const all = (ws, type) => ws.inbox.filter((m) => m.type === type);

function setup() {
  const core = mk();
  const h = sock(core);
  send(core, h, "create_room", { username: "Host" });
  const created = last(h, "room_created");
  return { core, h, hid: created.payload.user_id, htoken: created.payload.session_token };
}
function joinGuest(core, h, name = "G") {
  const g = sock(core);
  send(core, g, "join_room", { username: name });
  const req = last(h, "join_request");
  send(core, h, "approve_join", { user_id: req.payload.user_id });
  const ap = last(g, "join_approved");
  return { g, gid: ap.payload.user_id, token: ap.payload.session_token };
}
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test("create + duplicate", () => {
  const { core, h } = setup();
  assert.equal(last(h, "room_created").payload.room_code, "ABC234");
  const h2 = sock(core);
  send(core, h2, "create_room", { username: "X" });
  assert.equal(last(h2, "error").payload.code, "room_exists");
});
test("peek unknown / known", () => {
  const core = mk(); const a = sock(core);
  send(core, a, "peek_room");
  assert.equal(last(a, "error").payload.code, "room_not_found");
  send(core, a, "create_room", { username: "H" });
  const b = sock(core); send(core, b, "peek_room");
  assert.equal(last(b, "room_info").payload.count, 1);
});
test("join approval flow", () => {
  const { core, h } = setup();
  const g = sock(core);
  send(core, g, "join_room", { username: "Gue" });
  assert.ok(last(g, "join_pending"));
  assert.equal(last(h, "join_request").payload.username, "Gue");
  const { gid } = joinGuest(core, h, "Two");
  assert.equal(last(h, "room_state").payload.users.length, 2);
  assert.ok(gid);
});
test("reject", () => {
  const { core, h } = setup();
  const g = sock(core); send(core, g, "join_room", { username: "G" });
  send(core, h, "reject_join", { user_id: last(h, "join_request").payload.user_id });
  assert.equal(last(g, "join_rejected").payload.reason, "rejected");
});
test("approval timeout", () => {
  const { core, h } = setup();
  const g = sock(core); send(core, g, "join_room", { username: "G" });
  T += APPROVAL_TIMEOUT_MS + 1; core.onAlarm();
  assert.equal(last(g, "join_rejected").payload.reason, "timeout");
  assert.ok(last(h, "join_request_cancelled"));
});
test("pending guest leaves -> host told", () => {
  const { core, h } = setup();
  const g = sock(core); send(core, g, "join_room", { username: "G" });
  core.onClose(g);
  assert.ok(last(h, "join_request_cancelled"));
});
test("room full", () => {
  const { core, h } = setup();
  for (let i = 0; i < MAX_MEMBERS - 1; i++) joinGuest(core, h, "g" + i);
  const x = sock(core); send(core, x, "join_room", { username: "X" });
  assert.equal(last(x, "error").payload.code, "room_full");
});
test("only host moderates", () => {
  const { core, h } = setup(); const { g, gid } = joinGuest(core, h);
  send(core, g, "kick_user", { user_id: "x" });
  assert.equal(last(g, "error").payload.code, "not_host");
  send(core, g, "end_room");
  assert.equal(last(g, "error").payload.code, "not_host");
});
test("kick", () => {
  const { core, h } = setup(); const { g, gid } = joinGuest(core, h);
  send(core, h, "kick_user", { user_id: gid });
  assert.ok(last(g, "kicked"));
  assert.equal(last(h, "room_state").payload.users.length, 1);
});
test("relay targeted/broadcast", () => {
  const { core, h, hid } = setup(); const a = joinGuest(core, h, "a"); const b = joinGuest(core, h, "b");
  send(core, h, "relay", { data: { k: 1 } });
  assert.equal(last(a.g, "relay").payload.from, hid);
  assert.ok(last(b.g, "relay"));
  send(core, a.g, "relay", { to: "host", data: { k: 2 } });
  assert.equal(last(h, "relay").payload.data.k, 2);
  const before = b.g.inbox.length;
  send(core, a.g, "relay", { to: "host", data: { k: 3 } });
  assert.equal(b.g.inbox.length, before);
});
test("transfer host", () => {
  const { core, h } = setup(); const { g, gid } = joinGuest(core, h);
  send(core, h, "transfer_host", { new_host_id: gid });
  assert.equal(last(g, "host_changed").payload.new_host_id, gid);
  assert.equal(last(g, "room_state").payload.host_id, gid);
});
test("host leaves -> migrates", () => {
  const { core, h } = setup(); const { g, gid } = joinGuest(core, h);
  send(core, h, "leave_room");
  assert.equal(last(g, "room_state").payload.host_id, gid);
});
test("last leaves -> room deleted", () => {
  const { core, h } = setup(); send(core, h, "leave_room");
  assert.equal(saved, null);
  const a = sock(core); send(core, a, "peek_room");
  assert.equal(last(a, "error").payload.code, "room_not_found");
});
test("end room", () => {
  const { core, h } = setup(); const { g } = joinGuest(core, h);
  send(core, h, "end_room");
  assert.ok(last(g, "room_ended"));
});
test("reconnect within grace + replaced socket", () => {
  const { core, h } = setup(); const { g, token } = joinGuest(core, h);
  core.onClose(g);
  assert.equal(last(h, "room_state").payload.users[1].is_connected, false);
  const g2 = sock(core); send(core, g2, "reconnect", { session_token: token });
  assert.ok(last(g2, "reconnected"));
  assert.equal(last(h, "room_state").payload.users[1].is_connected, true);
  const g3 = sock(core); send(core, g3, "reconnect", { session_token: token });
  assert.ok(g2.closed);
  core.onClose(g2); // stale close must not mark offline
  assert.equal(last(h, "room_state").payload.users[1].is_connected, true);
});
test("bad token", () => {
  const { core } = setup(); const x = sock(core);
  send(core, x, "reconnect", { session_token: "nope" });
  assert.equal(last(x, "error").payload.code, "session_not_found");
});
test("host offline > grace -> guest promoted; host returns as guest", () => {
  const { core, h, htoken } = setup(); const { g, gid } = joinGuest(core, h);
  core.onClose(h);
  T += HOST_GRACE_MS + 1; core.onAlarm();
  assert.equal(last(g, "room_state").payload.host_id, gid);
  const h2 = sock(core); send(core, h2, "reconnect", { session_token: htoken });
  assert.equal(last(h2, "reconnected").payload.is_host, false);
});
test("seat expiry removes member", () => {
  const { core, h } = setup(); const { g } = joinGuest(core, h);
  core.onClose(g); T += SEAT_GRACE_MS + 1; core.onAlarm();
  assert.equal(last(h, "room_state").payload.users.length, 1);
});
test("suggestions", () => {
  const { core, h } = setup(); const { g } = joinGuest(core, h);
  send(core, g, "suggest_track", { track: { id: "t1", title: "Song", artist: "A", evil: "x" } });
  const s = last(h, "suggestion_received");
  assert.equal(s.payload.track.evil, undefined);
  send(core, h, "approve_suggestion", { suggestion_id: s.payload.suggestion_id });
  assert.equal(last(g, "suggestion_approved").payload.track.id, "t1");
  send(core, g, "suggest_track", { track: { id: "t2", title: "S2" } });
  send(core, h, "reject_suggestion", { suggestion_id: last(h, "suggestion_received").payload.suggestion_id });
  assert.ok(last(g, "suggestion_rejected"));
  send(core, g, "suggest_track", { track: {} });
  assert.equal(last(g, "error").payload.code, "bad_request");
});
test("ping/pong + garbage + rate limit", () => {
  const core = mk(); const a = sock(core);
  send(core, a, "ping", { t0: 5 });
  assert.equal(last(a, "pong").payload.t0, 5);
  core.onMessage(a, "not json"); core.onMessage(a, "[]"); core.onMessage(a, JSON.stringify({ type: 5 }));
  for (let i = 0; i < 150; i++) send(core, a, "ping", { t0: i });
  assert.ok(a.closed);
});
test("persist + load after eviction", () => {
  const { core, h, hid, htoken } = setup(); joinGuest(core, h);
  const snap = JSON.parse(JSON.stringify(saved));
  const core2 = new JamRoomCore(io); core2.load(snap);
  const h2 = sock(core2); send(core2, h2, "reconnect", { session_token: htoken });
  const r = last(h2, "reconnected");
  assert.equal(r.payload.user_id, hid);
  assert.equal(r.payload.state.users.length, 2);
});
test("create sanitises name", () => {
  const core = mk(); const a = sock(core);
  send(core, a, "create_room", { username: "  a\n\nb  very long name here ", avatar: "javascript:x" });
  const st = last(a, "room_created").payload.state;
  assert.ok(st.users[0].username.length <= 14);
  assert.equal(st.users[0].avatar, null);
});

let fail = 0;
for (const [name, fn] of tests) {
  try { fn(); console.log("ok  ", name); } catch (e) { fail++; console.log("FAIL", name, "\n  ", e.message); }
}
console.log(fail ? `${fail} failed` : `all ${tests.length} passed`);
process.exit(fail ? 1 : 0);
