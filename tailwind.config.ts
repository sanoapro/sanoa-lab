import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1280px" } },
    extend: {
      borderRadius: { lg: "12px", xl: "16px", "2xl": "20px" },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.04), 0 10px 24px rgba(0,0,0,.10)",
        "card-hover": "0 2px 6px rgba(0,0,0,.06), 0 12px 28px rgba(0,0,0,.14)",
        elevated: "0 12px 32px rgba(0,0,0,.18)",
      },
      colors: {
        background: "hsl(var(--bg))",
        foreground: "hsl(var(--fg))",
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-fg))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-fg))" },
        border: "hsl(var(--border))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-fg))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-fg))" },
        success: { DEFAULT: "hsl(var(--success))", foreground: "hsl(var(--success-fg))" },
        danger: { DEFAULT: "hsl(var(--danger))", foreground: "hsl(var(--danger-fg))" },
        warning: { DEFAULT: "hsl(var(--warning))", foreground: "hsl(var(--warning-fg))" },
      },
      fontSize: {
        xs: ["0.8125rem", "1.2"],
        sm: ["0.875rem", "1.45"],
        base: ["1rem", "1.6"],
        lg: ["1.125rem", "1.55"],
        xl: ["1.25rem", "1.4"],
        "2xl": ["1.5rem", "1.3"],
        "3xl": ["1.875rem", "1.2"],
      },
      transitionTimingFunction: { soft: "cubic-bezier(.2,.8,.2,1)" },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/forms")],
};

export default config;
