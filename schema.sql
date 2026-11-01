-- Copyright (c) 2026 Ronacul. All rights reserved. Provided as is, without warranty of any kind. Unofficial fan-made tracker, not affiliated with the owners of Rail Baron or its trademarks.
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS games_updated ON games (updated_at);

-- Finished games saved from the Stats page ("Save game to history"), one row per game, keyed by the game's gid.
CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  map TEXT NOT NULL,
  players TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS results_at ON results (at);
