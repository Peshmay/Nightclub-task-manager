/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        neonPurple: "#a855f7",
        neonCyan: "#06b6d4",
        bgDark: "#0a0a0f",
        cardDark: "#1a1a2e"
      }
    }
  },
  plugins: []
};
