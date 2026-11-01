// Copyright (c) 2026 Ronacul. All rights reserved. Provided as is, without warranty of any kind. Unofficial fan-made tracker, not affiliated with the owners of Rail Baron or its trademarks.
// POST /api/results  { id, map, players:[{pid,name,cash,trips:[{from,to,pay}]}] }  -> { ok }   (saving the same id again replaces it)
// GET  /api/results  -> { results:[{ id, map, at, players }] }   newest 500 games
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

const str = (v, n) => (typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n) : "");

function clean(b) {
  if (!b || typeof b !== "object" || !/^[\w-]{4,40}$/.test(b.id || "") || (b.map !== "US" && b.map !== "UK")) return null;
  if (!Array.isArray(b.players) || !b.players.length || b.players.length > 8) return null;
  const players = [];
  for (const p of b.players) {
    const pid = str(p && p.pid, 40), name = str(p && p.name, 40);
    if (!/^[\w-]{2,40}$/.test(pid) || !name || !Array.isArray(p.trips) || p.trips.length > 300) return null;
    const trips = p.trips.map(t => ({ from: str(t && t.from, 60), to: str(t && t.to, 60), pay: Number.isFinite(t && t.pay) ? Math.round(t.pay) : 0 }));
    if (trips.some(t => !t.from || !t.to)) return null;
    players.push({ pid, name, cash: Number.isFinite(p.cash) ? Math.round(p.cash) : 0, trips });
  }
  return { id: b.id, map: b.map, players };
}

export async function onRequestPost({ request, env }) {
  const text = await request.text();
  if (text.length > 100_000) return json({ error: "too large" }, 413);
  let body; try { body = JSON.parse(text); } catch { return json({ error: "bad json" }, 400); }
  const r = clean(body);
  if (!r) return json({ error: "bad result" }, 400);
  await env.DB.prepare("INSERT OR REPLACE INTO results (id, map, players, at) VALUES (?, ?, ?, ?)")
    .bind(r.id, r.map, JSON.stringify(r.players), Date.now()).run();
  return json({ ok: true });
}

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare("SELECT id, map, players, at FROM results ORDER BY at DESC LIMIT 500").all();
  return json({ results: results.map(r => ({ id: r.id, map: r.map, at: r.at, players: JSON.parse(r.players) })) });
}
