export interface TtlCacheOptions {
  ttlMs: number;
  maxEntries?: number;
}

export function createTtlCache<V>({ ttlMs, maxEntries = 500 }: TtlCacheOptions) {
  const map = new Map<string, { value: V; expiresAt: number }>();

  return {
    get(key: string): V | undefined {
      const hit = map.get(key);
      if (!hit) return undefined;
      if (Date.now() > hit.expiresAt) {
        map.delete(key);
        return undefined;
      }
      // LRU touch: delete + re-insert moves to insertion order tail.
      map.delete(key);
      map.set(key, hit);
      return hit.value;
    },
    set(key: string, value: V): void {
      // Evict oldest entry if at capacity.
      if (map.size >= maxEntries) {
        const oldestKey = map.keys().next().value;
        if (oldestKey !== undefined) map.delete(oldestKey);
      }
      map.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
  };
}
