/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        accent: "#10b981",
        darkbg: "#0b1120",
        card: "#111827"
      }
    },
  },
  plugins: [],
}