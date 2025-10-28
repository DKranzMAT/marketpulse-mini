import { useEffect, useMemo, useState } from "react";
import { MOCK_TICKERS } from "./data/mockTickers.js";
import { useWatchlist } from "./store/useWatchlist.js";
import { useSettings } from "./store/useSettings.js";
import PriceCard from "./components/PriceCard.jsx";
import Sparkline from "./components/Sparkline.jsx";
import { getQuote, clearAllQuoteCaches } from "./lib/alpha.js";

// ⏰ Small time formatter for “Last updated”
const fmtTime = (ts) =>
  ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

// ---- mock price loop (keeps free sparklines) ----
function useMockPrices(symbols) {
  const [ticks, setTicks] = useState(() =>
    symbols.reduce((acc, s) => {
      const start = 100 + Math.random() * 100;
      acc[s] = {
        price: start,
        change: 0,
        series: Array.from({ length: 30 }, (_, i) => ({ t: i, v: start })),
      };
      return acc;
    }, {})
  );

  useEffect(() => {
    const id = setInterval(() => {
      setTicks((prev) => {
        const next = { ...prev };
        symbols.forEach((s) => {
          const cur = next[s] || { price: 120, change: 0, series: [{ t: 0, v: 120 }] };
          const drift = (Math.random() - 0.5) * 0.8;
          const price = Math.max(1, cur.price * (1 + drift / 100));
          const base = cur.series[0]?.v ?? price;
          const change = ((price - base) / base) * 100;
          const series = [
            ...cur.series.slice(-29),
            { t: (cur.series.at(-1)?.t ?? 0) + 1, v: price },
          ];
          next[s] = { price, change, series };
        });
        return next;
      });
    }, 1200);

    return () => clearInterval(id);
  }, [symbols]);

  return [ticks, setTicks];
}

export default function App() {
  const { symbols, toggle } = useWatchlist();
  const { live, toggleLive } = useSettings();
  const [ticks, setTicks] = useMockPrices(symbols);

  const all = useMemo(() => {
    const map = new Map(MOCK_TICKERS.map((t) => [t.symbol, t]));
    return symbols.map((s) => ({ symbol: s, name: map.get(s)?.name ?? s }));
  }, [symbols]);

  // 💬 Overlay live quotes when Live mode is ON
  useEffect(() => {
    if (!live) return; // mock mode only
    let cancelled = false;

    async function hydrate() {
      for (let i = 0; i < symbols.length; i++) {
        const s = symbols[i];
        await new Promise((r) => setTimeout(r, 1200 * i)); // stagger calls
        const q = await getQuote(s);
        if (cancelled || !q) continue;
        setTicks((prev) => {
          const cur = prev[s];
          if (!cur) return prev;
          const next = { ...prev };
          next[s] = { ...cur, price: q.price, change: q.changePct, asOf: q.asOf };
          return next;
        });
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [symbols, live, setTicks]);

  // 🔄 Manual refresh (clears cache + refetches)
  async function refreshAll() {
    clearAllQuoteCaches();
    for (let i = 0; i < symbols.length; i++) {
      const s = symbols[i];
      await new Promise((r) => setTimeout(r, 600 * i)); // gentle stagger
      const q = await getQuote(s);
      if (!q) continue;
      setTicks((prev) => {
        const cur = prev[s];
        if (!cur) return prev;
        return {
          ...prev,
          [s]: { ...cur, price: q.price, change: q.changePct, asOf: q.asOf },
        };
      });
    }
  }

  const hasKey = Boolean(import.meta.env.VITE_ALPHA_VANTAGE_KEY);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">MarketPulse Mini</h1>
          <span
            className={`text-xs px-2 py-1 rounded-full border ${
              live
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-yellow-50 text-yellow-700 border-yellow-200"
            }`}
          >
            {live ? "LIVE DATA ON" : "MOCK MODE"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {MOCK_TICKERS.map((t) => (
            <button
              key={t.symbol}
              onClick={() => toggle(t.symbol)}
              className={`px-3 py-1 rounded-full border text-sm transition ${
                symbols.includes(t.symbol)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-200 hover:shadow"
              }`}
            >
              {t.symbol}
            </button>
          ))}
          <button
            onClick={toggleLive}
            className={`ml-3 px-3 py-1 rounded-full text-sm border transition ${
              live
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-700 border-gray-200 hover:shadow"
            }`}
            title="Toggle live API requests"
          >
            {live ? "Turn Live OFF" : "Turn Live ON"}
          </button>
          <button
            onClick={refreshAll}
            className="ml-2 px-3 py-1 rounded-full text-sm border bg-white text-gray-700 hover:shadow"
            title="Bypass cache and fetch fresh quotes"
          >
            Refresh now
          </button>
        </div>
      </header>

      {!hasKey && (
        <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
          No API key detected — staying in mock mode. Add <code>.env</code> with{" "}
          <code>VITE_ALPHA_VANTAGE_KEY</code>.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {all.map(({ symbol, name }) => {
          const p = ticks[symbol];
          return (
            <div
              key={symbol}
              className="rounded-2xl border bg-white p-4 shadow-sm space-y-3"
            >
              <PriceCard
                symbol={symbol}
                name={name}
                price={p?.price ?? 0}
                change={p?.change ?? 0}
              />
              <Sparkline data={p?.series ?? []} />
              {p?.asOf && (
                <div className="text-[11px] text-gray-500">
                  Last updated:{" "}
                  <span className="font-medium">{fmtTime(p.asOf)}</span>
                </div>
              )}
            </div>
          );
        })}
      </section>

      <footer className="text-xs text-gray-500">
        Quotes overlay live when enabled; sparklines are mock to keep it free.
      </footer>
    </div>
  );
}
