/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',   // ⬅️ Add this line
  content: [
  "./index.html",
  "./src/**/*.{js,jsx,ts,tsx}",
  "./marketpulse-mini/index.html",
  "./marketpulse-mini/src/**/*.{js,jsx,ts,tsx}",],
  theme: {
    extend: {},
  },
  plugins: [],
};
