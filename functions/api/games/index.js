// Copyright (c) 2026 Ronacul. All rights reserved. Provided as is, without warranty of any kind. Unofficial fan-made tracker, not affiliated with the owners of Rail Baron or its trademarks.
// POST /api/games  { state }  ->  { id, version }
import { validState } from "../../../lib/state.js";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
const MAX_BYTES = 100_000;
const KEEP_DAYS = 90;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export async function onRequestPost({ request, env }) {
  const text = await request.text();
  if (text.length > MAX_BYTES) return json({ error: "too large" }, 413);
  let body;
  try { body = JSON.parse(text); } catch { return json({ error: "bad json" }, 400); }
  if (!validState(body.state)) return json({ error: "bad state" }, 400);

  const now = Date.now();
  await env.DB.prepare("DELETE FROM games WHERE updated_at < ?")
    .bind(now - KEEP_DAYS * 86400000).run();

  for (let i = 0; i < 5; i++) {
    const id = newId();
    try {
      await env.DB.prepare("INSERT INTO games (id, state, version, updated_at) VALUES (?, ?, 1, ?)")
        .bind(id, JSON.stringify(body.state), now).run();
      return json({ id, version: 1 });
    } catch (e) {
      // id collision: try another
    }
  }
  return json({ error: "could not create game" }, 500);
}
