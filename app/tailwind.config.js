/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#FFF8F1",
        ink: "#3A2E22",
        sub: "#8C7A66",
        muted: "#A89684",
        accent: "#FF8A4C",
        accentDark: "#E0723A",
        ok: "#7BC47F",
        warn: "#F4A261",
        bad: "#E76F51",
        cardBorder: "#F0E2CB",
        hpEmpty: "#F2E2C9",
      },
    },
  },
  plugins: [],
};
