const { buildCacheKey, getCache, setCache } = require('../utils/cache');

const cacheMiddleware = (ttlMs) => (req, res, next) => {
  const key = buildCacheKey(req);
  const cached = getCache(key);

  if (cached) {
    return res.status(200).json(cached);
  }

  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      setCache(key, body, ttlMs);
    }
    return originalJson(body);
  };

  return next();
};

module.exports = cacheMiddleware;
