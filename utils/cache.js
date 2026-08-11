const DEFAULT_TTL_MS = 30 * 1000;
const store = new Map();

const buildCacheKey = (req) => {
  const userPart = req.user ? `user:${req.user.id}` : 'public';
  return `${req.method}:${req.baseUrl}${req.path}?${new URLSearchParams(req.query).toString()}:${userPart}`;
};

const setCache = (key, value, ttlMs = DEFAULT_TTL_MS) => {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
};

const getCache = (key) => {
  const entry = store.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }

  return entry.value;
};

const clearCacheByPrefix = (prefix) => {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
};

module.exports = {
  DEFAULT_TTL_MS,
  buildCacheKey,
  setCache,
  getCache,
  clearCacheByPrefix,
};
