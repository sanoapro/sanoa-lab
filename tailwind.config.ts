import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./config/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./supabase/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        base: "1.06rem",
        lg: "1.18rem",
        xl: "1.32rem",
        "2xl": "1.6rem",
      },
      colors: {
        contrast: "rgb(var(--contrast) / <alpha-value>)",
      },
      boxShadow: {
        glass: "0 8px 24px rgba(0,0,0,0.25)",
      },
      backdropBlur: {
        xs: "2px",
      },
      borderRadius: {
        "2xl": "1rem",
        xl2: "1.25rem",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
