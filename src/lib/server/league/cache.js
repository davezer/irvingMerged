const CACHE = globalThis.__irvingLeagueRuntimeCache ?? new Map();

globalThis.__irvingLeagueRuntimeCache = CACHE;

export async function getOrSetRuntimeCache(key, ttlMs, factory) {
  const now = Date.now();
  const existing = CACHE.get(key);

  if (existing && existing.expiresAt > now) {
    return existing.value;
  }

  const value = await factory();
  CACHE.set(key, {
    value,
    expiresAt: now + ttlMs
  });
  return value;
}

export function clearRuntimeCache(prefix = '') {
  for (const key of CACHE.keys()) {
    if (!prefix || String(key).startsWith(prefix)) {
      CACHE.delete(key);
    }
  }
}
