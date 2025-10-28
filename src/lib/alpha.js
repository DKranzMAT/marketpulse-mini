import { withCache, delCache, keysByPrefix } from "./cache.js";

const API = "https://www.alphavantage.co/query";
const KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY;

export const QUOTE_PREFIX = "av_quote_";
export const QUOTE_TTL = 15 * 60 * 1000; // 15 minutes

function toNum(x) {
  const n = Number(String(x).replace(/[%,$]/g, ""));
  return Number.isFinite(n) ? n : null;
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Live price + change% (cached)
export async function getQuote(symbol) {
  if (!KEY) return null;
  const cacheKey = `${QUOTE_PREFIX}${symbol}`;
  return withCache(cacheKey, QUOTE_TTL, async () => {
    const url = `${API}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${KEY}`;
    const data = await fetchJSON(url);
    if (data.Note || data.Information) return null; // rate limit or key issue
    const q = data["Global Quote"];
    if (!q) return null;
    const price = toNum(q["05. price"]);
    const changePct = toNum(q["10. change percent"]);
    return price == null || changePct == null ? null : {
      price,
      changePct,
      asOf: Date.now(),
    };
  });
}

// Cache clear helpers (used by "Refresh now")
export function clearQuoteCache(symbol) {
  delCache(`${QUOTE_PREFIX}${symbol}`);
}

export function clearAllQuoteCaches() {
  keysByPrefix(QUOTE_PREFIX).forEach((k) => delCache(k));
}
