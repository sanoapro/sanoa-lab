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
        card: "0 24px 48px -28px rgba(15,23,42,0.45), 0 12px 24px -16px rgba(15,23,42,0.18)",
        "card-hover": "0 32px 64px -24px rgba(15,23,42,0.55), 0 16px 28px -18px rgba(15,23,42,0.22)",
        elevated: "0 40px 80px -36px rgba(30,41,59,0.55)",
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
