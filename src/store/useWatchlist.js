import { create } from "zustand";

const KEY = "mpm_watchlist_v1";

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || ["AAPL","MSFT","NVDA"]; }
  catch { return ["AAPL","MSFT","NVDA"]; }
};

export const useWatchlist = create((set, get) => ({
  symbols: load(),
  toggle: (sym) => {
    const next = new Set(get().symbols);
    next.has(sym) ? next.delete(sym) : next.add(sym);
    const arr = [...next];
    localStorage.setItem(KEY, JSON.stringify(arr));
    set({ symbols: arr });
  }
}));
