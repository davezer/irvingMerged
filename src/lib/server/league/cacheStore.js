const memoryState = new Map();
const knownKeys = new Set();

function nowMs() {
  return Date.now();
}

function cacheRequestForKey(key) {
  return new Request(`https://league-cache.internal/${encodeURIComponent(key)}`);
}

function hasEdgeCacheApi() {
  return typeof caches !== 'undefined'
    && Boolean(caches?.default)
    && typeof Request !== 'undefined'
    && typeof Response !== 'undefined';
}

async function readEdgeCache(key) {
  if (!hasEdgeCacheApi()) return null;

  try {
    const hit = await caches.default.match(cacheRequestForKey(key));
    if (!hit) return null;
    const payload = await hit.json().catch(() => null);
    if (!payload) return null;
    if (payload.expiresAt && payload.expiresAt <= nowMs()) {
      await caches.default.delete(cacheRequestForKey(key)).catch(() => {});
      return null;
    }
    return payload.value;
  } catch {
    return null;
  }
}

async function writeEdgeCache(key, value, ttlMs) {
  if (!hasEdgeCacheApi()) return value;

  const payload = JSON.stringify({
    value,
    expiresAt: ttlMs ? nowMs() + ttlMs : null
  });

  try {
    await caches.default.put(
      cacheRequestForKey(key),
      new Response(payload, {
        headers: {
          'content-type': 'application/json',
          'cache-control': `public, max-age=${Math.max(1, Math.floor((ttlMs || 60_000) / 1000))}`
        }
      })
    );
  } catch {
    // edge cache failures should never crash league pages
  }

  return value;
}

async function deleteEdgeCache(key) {
  if (!hasEdgeCacheApi()) return;
  await caches.default.delete(cacheRequestForKey(key)).catch(() => {});
}

function rememberKey(key) {
  knownKeys.add(key);
}

function createMemoryCacheProvider() {
  return {
    name: 'memory',
    async get(key) {
      const hit = memoryState.get(key);
      if (!hit) return null;
      if (hit.expiresAt && hit.expiresAt <= nowMs()) {
        memoryState.delete(key);
        return null;
      }
      return hit.value;
    },
    async set(key, value, ttlMs) {
      rememberKey(key);
      memoryState.set(key, {
        value,
        expiresAt: ttlMs ? nowMs() + ttlMs : null
      });
      return value;
    },
    async delete(key) {
      memoryState.delete(key);
      knownKeys.delete(key);
    },
    async clear(prefix = '') {
      for (const key of [...memoryState.keys()]) {
        if (!prefix || key.startsWith(prefix)) memoryState.delete(key);
      }
      if (!prefix) {
        knownKeys.clear();
      } else {
        for (const key of [...knownKeys]) {
          if (key.startsWith(prefix)) knownKeys.delete(key);
        }
      }
    },
    keys(prefix = '') {
      return [...knownKeys].filter((key) => !prefix || key.startsWith(prefix));
    }
  };
}

function createHybridCacheProvider() {
  const memory = createMemoryCacheProvider();

  return {
    name: hasEdgeCacheApi() ? 'edge+memory' : 'memory',
    async get(key) {
      const memoryHit = await memory.get(key);
      if (memoryHit !== null && memoryHit !== undefined) return memoryHit;

      const edgeHit = await readEdgeCache(key);
      if (edgeHit !== null && edgeHit !== undefined) {
        await memory.set(key, edgeHit, 30_000);
        return edgeHit;
      }

      return null;
    },
    async set(key, value, ttlMs) {
      rememberKey(key);
      await memory.set(key, value, ttlMs);
      await writeEdgeCache(key, value, ttlMs);
      return value;
    },
    async delete(key) {
      await memory.delete(key);
      await deleteEdgeCache(key);
    },
    async clear(prefix = '') {
      const keys = memory.keys(prefix);
      await Promise.all(keys.map((key) => deleteEdgeCache(key)));
      await memory.clear(prefix);
      return { keysCleared: keys.length, prefix: prefix || null };
    },
    keys(prefix = '') {
      return memory.keys(prefix);
    }
  };
}

let cacheProvider = createHybridCacheProvider();

export function getLeagueCacheProvider() {
  return cacheProvider;
}

export function setLeagueCacheProvider(provider) {
  if (!provider || typeof provider.get !== 'function' || typeof provider.set !== 'function') {
    throw new Error('Cache provider must expose async get() and set() methods.');
  }
  cacheProvider = provider;
}

export async function withLeagueCache(key, ttlMs, loader) {
  const cached = await cacheProvider.get(key);
  if (cached !== null && cached !== undefined) return cached;

  const value = await loader();
  await cacheProvider.set(key, value, ttlMs);
  return value;
}

export async function clearLeagueCache(options = {}) {
  const prefix = String(options?.prefix || '').trim();
  return cacheProvider.clear(prefix);
}

export async function clearLeagueCacheKey(key) {
  await cacheProvider.delete(key);
}

export function listLeagueCacheKeys(prefix = '') {
  return cacheProvider.keys(prefix);
}
