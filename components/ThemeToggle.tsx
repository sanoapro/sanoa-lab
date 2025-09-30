// components/ThemeToggle.tsx
"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "sanoa.theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const useDark = theme === "dark" || (theme === "system" && systemDark);
  root.classList.toggle("dark", useDark);
  root.setAttribute("data-theme", useDark ? "dark" : "light");
}

export default function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>("system");

  // Cargar preferencia
  React.useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  // Escuchar cambios del sistema si está en "system"
  React.useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [theme]);

  function change(next: Theme) {
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  return (
    <div className="inline-flex items-center gap-2" role="group" aria-label="Tema de la interfaz">
      <button
        type="button"
        onClick={() => change("light")}
        aria-pressed={theme === "light"}
        className={btn(theme === "light")}
        title="Modo claro"
      >
        ☀️ <span className="sr-only">Claro</span>
      </button>
      <button
        type="button"
        onClick={() => change("system")}
        aria-pressed={theme === "system"}
        className={btn(theme === "system")}
        title="Según el sistema"
      >
        🖥️ <span className="sr-only">Sistema</span>
      </button>
      <button
        type="button"
        onClick={() => change("dark")}
        aria-pressed={theme === "dark"}
        className={btn(theme === "dark")}
        title="Modo oscuro"
      >
        🌙 <span className="sr-only">Oscuro</span>
      </button>
    </div>
  );
}

function btn(active: boolean) {
  return [
    "inline-flex items-center gap-2 px-3 py-2 rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
    active
      ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
      : "bg-white text-slate-900 dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/10",
  ].join(" ");
}
