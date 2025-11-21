import { create } from "zustand";

const KEY = "mpm_settings_v1";

const load = () => {
  try {
    return (
      JSON.parse(localStorage.getItem(KEY)) ?? {
        live: true,
        darkMode: false,
      }
    );
  } catch {
    return { live: true, darkMode: false };
  }
};

export const useSettings = create((set, get) => ({
  ...load(),

  toggleLive: () => {
    const live = !get().live;
    const next = { ...get(), live };
    localStorage.setItem(KEY, JSON.stringify(next));
    set(next);
  },

  toggleDark: () => {
    const darkMode = !get().darkMode;
    const next = { ...get(), darkMode };
    localStorage.setItem(KEY, JSON.stringify(next));
    set(next);
  },
}));
