# Astra Jam server protocol (v1)

Transport: WebSocket, JSON text frames `{ "type": "...", "payload": { ... } }`.
Endpoint: `wss://<worker>/jam/ws?room=<CODE>&v=1` — one Durable Object per room code.
Code alphabet: `23456789ABCDEFGHJKMNPQRSTUVWXYZ`, 6 chars. Max 4 members.

## Client -> Server
| type | payload | reply |
|---|---|---|
| `peek_room` | `{}` | `room_info` or `error room_not_found` |
| `create_room` | `{username, avatar, room_name}` | `room_created` or `error room_exists` |
| `join_room` | `{room_code, username, avatar}` | `join_pending`, later `join_approved` / `join_rejected` |
| `approve_join` / `reject_join` | `{user_id[, reason]}` (host only) | joiner gets `join_approved` / `join_rejected{reason}` |
| `leave_room` | `{}` | - (also cancels a pending join -> host gets `join_request_cancelled`) |
| `end_room` | `{}` (host) | everyone gets `room_ended`, room destroyed |
| `kick_user` | `{user_id, reason}` (host) | target gets `kicked`, then `room_state` to rest |
| `transfer_host` | `{new_host_id}` (host) | `host_changed` + `room_state` |
| `status` | `{status: ok/buffering/syncing, song?}` | stored, shown in `room_state` (`song` only from host, used by `room_info`) |
| `relay` | `{to?: user_id, data: {...}}` | server forwards `{from, data}` to `to`, or to every other member |
| `ping` | `{t0}` | `pong {t0, ts}` where `ts = Date.now()` on the server (shared clock) |
| `reconnect` | `{session_token}` | `reconnected` or `error session_not_found` |
| `suggest_track` | `{track}` | host gets `suggestion_received` |
| `approve_suggestion` / `reject_suggestion` | `{suggestion_id[, reason]}` (host) | suggester gets `suggestion_approved{suggestion_id, track}` / `suggestion_rejected` |

## Server -> Client
- `room_info {room_name, host_name, host_avatar, song, count, avatars[]}`
- `room_created {room_code, user_id, session_token, state}`
- `join_pending {}` / `join_approved {room_code, user_id, session_token, state}` / `join_rejected {reason}` (reasons: rejected, blocked, full, timeout)
- `reconnected {room_code, user_id, is_host, state}`
- `room_state` = the state object (sent on every membership / host / status change)
- `join_request {user_id, username, avatar}` (host only; re-send pending ones to a new host) / `join_request_cancelled {user_id}`
- `host_changed {new_host_id, new_host_name}`, `kicked {reason}`, `room_ended {reason}`
- `relay {from, data}`
- `suggestion_received {suggestion_id, from_user_id, from_username, track}`
- `error {code, message}` codes: room_not_found, room_exists, room_full, not_host, session_not_found, bad_request

State object: `{room_code, room_name, host_id, users:[{user_id, username, avatar, is_host, is_connected, status, joined_at}]}`

## Server rules
- `create_room` on a code that already has a room -> `error room_exists`.
- A join request is held until the host answers; no answer in 75 s -> `join_rejected{reason:"timeout"}`.
- Socket drop = member `is_connected:false`, seat kept 10 min (session_token). Host gone > 30 s -> host moves to the oldest connected guest (`host_changed`). Room with nobody for 10 min is deleted.
- Host `leave_room` with guests left -> host moves to oldest guest. Last person leaving deletes the room.
- `relay` is opaque: never inspect `data`. Rate-limit lightly (~30 msg/s per socket).
- Use WebSocket auto-response for protocol pings (hibernation API is fine).
