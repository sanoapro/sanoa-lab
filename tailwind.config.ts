import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      backdropBlur: { xs: "2px" },
      boxShadow: {
        glass: "0 10px 30px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.15)",
      },
      borderRadius: {
        "2xl": "1rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
