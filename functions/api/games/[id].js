// Copyright (c) 2026 Ronacul. All rights reserved. Provided as is, without warranty of any kind. Unofficial fan-made tracker, not affiliated with the owners of Rail Baron or its trademarks.
// GET /api/games/:id            -> { state, version }
// PUT /api/games/:id { base, state }
//   200 { version }              saved (base matched the stored version)
//   409 { state, version }       someone saved first; client adopts this state
import { validState } from "../../../lib/state.js";

const MAX_BYTES = 100_000;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const validId = (id) => /^[A-Z2-9]{6}$/.test(id);

async function load(env, id) {
  const row = await env.DB.prepare("SELECT state, version FROM games WHERE id = ?").bind(id).first();
  return row ? { state: JSON.parse(row.state), version: row.version } : null;
}

export async function onRequestGet({ params, env }) {
  const id = String(params.id).toUpperCase();
  if (!validId(id)) return json({ error: "not found" }, 404);
  const game = await load(env, id);
  return game ? json(game) : json({ error: "not found" }, 404);
}

export async function onRequestPut({ params, request, env }) {
  const id = String(params.id).toUpperCase();
  if (!validId(id)) return json({ error: "not found" }, 404);
  const text = await request.text();
  if (text.length > MAX_BYTES) return json({ error: "too large" }, 413);
  let body;
  try { body = JSON.parse(text); } catch { return json({ error: "bad json" }, 400); }
  if (!validState(body.state) || !Number.isInteger(body.base)) return json({ error: "bad request" }, 400);

  // Compare-and-set: only saves if nobody else saved since `base`.
  const res = await env.DB.prepare(
    "UPDATE games SET state = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ?"
  ).bind(JSON.stringify(body.state), Date.now(), id, body.base).run();

  if (res.meta.changes === 1) return json({ version: body.base + 1 });

  const game = await load(env, id);
  return game ? json(game, 409) : json({ error: "not found" }, 404);
}
