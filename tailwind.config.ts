import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Contraste mejor en dark
        bg: {
          DEFAULT: "#0b0f14",
          glass: "rgba(255,255,255,0.06)",
          border: "rgba(255,255,255,0.14)",
        },
        fg: {
          DEFAULT: "#0d1218",
          glass: "rgba(13,18,24,0.5)",
          border: "rgba(255,255,255,0.08)",
        }
      },
      backdropBlur: {
        xs: "2px",
      }
    },
  },
  plugins: [],
} satisfies Config;
