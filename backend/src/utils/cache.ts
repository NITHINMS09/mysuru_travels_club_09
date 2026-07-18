interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cacheMap = new Map<string, CacheEntry<any>>();

export function getCache<T>(key: string): T | null {
  const entry = cacheMap.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cacheMap.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache<T>(key: string, data: T, ttlMs: number): void {
  cacheMap.set(key, {
    data,
    expiry: Date.now() + ttlMs
  });
}

export function clearCache(prefix?: string): void {
  if (!prefix) {
    cacheMap.clear();
    return;
  }
  for (const key of cacheMap.keys()) {
    if (key.startsWith(prefix)) {
      cacheMap.delete(key);
    }
  }
}
