"use client";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved === "light" || saved === "dark") return saved;
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch {}
  return "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const t = getInitialTheme();
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try { localStorage.setItem("theme", next); } catch {}
    document.documentElement.setAttribute("data-theme", next);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Cambiar tema"
      className="fixed bottom-4 right-4 z-40 rounded-full border border-[var(--color-brand-border)] bg-white/90 px-3 py-2 shadow hover:bg-[var(--color-brand-background)]"
      title={theme === "dark" ? "Cambiar a claro" : "Cambiar a oscuro"}
    >
      <span className="text-lg">{theme === "dark" ? "🌞" : "🌙"}</span>
    </button>
  );
}
