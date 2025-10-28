const now = () => Date.now();

export function getCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { exp, val } = JSON.parse(raw);
    if (exp && exp < now()) {
      localStorage.removeItem(key);
      return null;
    }
    return val;
  } catch {
    return null;
  }
}

export function setCache(key, val, ttlMs = 0) {
  try {
    const exp = ttlMs ? now() + ttlMs : 0;
    localStorage.setItem(key, JSON.stringify({ exp, val }));
  } catch {}
}

export async function withCache(key, ttlMs, fetcher) {
  const hit = getCache(key);
  if (hit != null) return hit;
  const val = await fetcher();
  if (val != null) setCache(key, val, ttlMs);
  return val;
}

// NEW: small helpers used by Refresh button
export function delCache(key) {
  try { localStorage.removeItem(key); } catch {}
}

export function keysByPrefix(prefix) {
  try {
    return Object.keys(localStorage).filter((k) => k.startsWith(prefix));
  } catch {
    return [];
  }
}
