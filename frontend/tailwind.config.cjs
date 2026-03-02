/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#020617",
        surface: "#020617",
        surfaceAlt: "#0f172a",
        accent: "#38bdf8",
        accentSoft: "#0ea5e9"
      },
      boxShadow: {
        "glow": "0 0 20px rgba(56, 189, 248, 0.25)"
      }
    }
  },
  plugins: []
};
