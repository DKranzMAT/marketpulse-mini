import { useEffect, useMemo, useState } from "react";
import { MOCK_TICKERS } from "./data/mockTickers.js";
import { useWatchlist } from "./store/useWatchlist.js";
import { useSettings } from "./store/useSettings.js";
import PriceCard from "./components/PriceCard.jsx";
import Sparkline from "./components/Sparkline.jsx";
import { getQuote, clearAllQuoteCaches } from "./lib/alpha.js";

import { LIGHT, DARK } from "./theme.js";

// Format timestamp → "12:34 PM"
const fmtTime = (ts) =>
  ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

// -------------------------------------------
// Mock sparkline price generator
// -------------------------------------------
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
          const cur = next[s];
          const drift = (Math.random() - 0.5) * 0.8;
          const price = Math.max(1, cur.price * (1 + drift / 100));
          const base = cur.series[0].v;
          const change = ((price - base) / base) * 100;

          const series = [
            ...cur.series.slice(-29),
            { t: cur.series.at(-1).t + 1, v: price },
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

// -------------------------------------------
// MAIN APP
// -------------------------------------------
export default function App() {
  const { symbols, toggle } = useWatchlist();
  const { live, toggleLive, darkMode, toggleDark } = useSettings();

  const theme = darkMode ? DARK : LIGHT;

  const [ticks, setTicks] = useMockPrices(symbols);

  const all = useMemo(() => {
    const map = new Map(MOCK_TICKERS.map((t) => [t.symbol, t]));
    return symbols.map((s) => ({ symbol: s, name: map.get(s)?.name ?? s }));
  }, [symbols]);

  // Live API hydration
  useEffect(() => {
    if (!live) return;
    let cancelled = false;

    async function hydrate() {
      for (let i = 0; i < symbols.length; i++) {
        const s = symbols[i];
        await new Promise((r) => setTimeout(r, 1200 * i));
        const q = await getQuote(s);
        if (!q || cancelled) continue;

        setTicks((prev) => ({
          ...prev,
          [s]: { ...prev[s], price: q.price, change: q.changePct, asOf: q.asOf },
        }));
      }
    }

    hydrate();
    return () => (cancelled = true);
  }, [symbols, live]);

  async function refreshAll() {
    clearAllQuoteCaches();
    for (let i = 0; i < symbols.length; i++) {
      const s = symbols[i];
      await new Promise((r) => setTimeout(r, 600 * i));
      const q = await getQuote(s);
      if (!q) continue;

      setTicks((prev) => ({
        ...prev,
        [s]: { ...prev[s], price: q.price, change: q.changePct, asOf: q.asOf },
      }));
    }
  }

  const hasKey = Boolean(import.meta.env.VITE_ALPHA_VANTAGE_KEY);

  return (
    <div
      style={{
        background: theme.bg,
        color: theme.text,
        minHeight: "100vh",
        padding: "24px",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <header className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold">MarketPulse Mini</h1>
            <span
              style={{
                fontSize: "11px",
                padding: "4px 10px",
                borderRadius: "9999px",
                background: live ? "#bbf7d0" : "#fde68a",
                color: live ? "#064e3b" : "#78350f",
                border: "1px solid rgba(0,0,0,0.1)",
              }}
            >
              {live ? "LIVE DATA ON" : "MOCK MODE"}
            </span>
          </div>

          {/* Desktop controls */}
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={toggleLive} className="px-3 py-1 rounded-full border">
              {live ? "Turn Live OFF" : "Turn Live ON"}
            </button>

            <button onClick={refreshAll} className="px-3 py-1 rounded-full border">
              Refresh
            </button>

            <button onClick={toggleDark} className="px-3 py-1 rounded-full border">
              {darkMode ? "Light" : "Dark"}
            </button>
          </div>
        </div>

        {/* Tickers */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {MOCK_TICKERS.map((t) => (
            <button
              key={t.symbol}
              onClick={() => toggle(t.symbol)}
              className="whitespace-nowrap rounded-full px-4 py-2 border"
              style={{
                background: symbols.includes(t.symbol) ? "#2563eb" : theme.card,
                borderColor: theme.cardBorder,
                color: symbols.includes(t.symbol) ? "#fff" : theme.text,
              }}
            >
              {t.symbol}
            </button>
          ))}
        </div>

        {/* Mobile controls */}
        <div className="flex sm:hidden gap-2">
          <button onClick={toggleLive} className="flex-1 px-3 py-1 rounded-full border">
            {live ? "Turn Live OFF" : "Turn Live ON"}
          </button>

          <button onClick={refreshAll} className="flex-1 px-3 py-1 rounded-full border">
            Refresh
          </button>

          <button onClick={toggleDark} className="px-3 py-1 rounded-full border">
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      {!hasKey && (
        <div style={{ background: "#fef9c3", padding: "8px", borderRadius: "6px" }}>
          No API key detected — mock mode only.
        </div>
      )}

      {/* GRID */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {all.map(({ symbol, name }) => {
          const p = ticks[symbol];
          return (
            <div
              key={symbol}
              style={{
                background: theme.card,
                color: theme.text,
                border: `1px solid ${theme.cardBorder}`,
                borderRadius: "16px",
                padding: "16px",
              }}
            >
              <PriceCard
                symbol={symbol}
                name={name}
                price={p?.price ?? 0}
                change={p?.change ?? 0}
              />

              <Sparkline data={p?.series ?? []} />

              {p?.asOf && (
                <div style={{ fontSize: "11px", opacity: 0.7 }}>
                  Last updated: {fmtTime(p.asOf)}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <footer style={{ fontSize: "12px", opacity: 0.7 }}>
        Quotes overlay live when enabled; sparklines remain mock.
      </footer>
    </div>
  );
}
