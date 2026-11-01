// Copyright (c) 2026 Ronacul. All rights reserved. Provided as is, without warranty of any kind. Unofficial fan-made tracker, not affiliated with the owners of Rail Baron or its trademarks.
export function validState(s) {
  return !!s && typeof s === "object" && (s.map === "US" || s.map === "UK")
    && Array.isArray(s.players) && s.players.length <= 8 && Number.isInteger(s.nextId);
}
