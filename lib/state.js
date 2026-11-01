export function validState(s) {
  return !!s && typeof s === "object" && (s.map === "US" || s.map === "UK")
    && Array.isArray(s.players) && s.players.length <= 8 && Number.isInteger(s.nextId);
}
