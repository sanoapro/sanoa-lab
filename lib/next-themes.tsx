"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

export type ThemeProviderProps = {
  attribute?: string;
  defaultTheme?: "light" | "dark" | "system" | (string & {});
  enableSystem?: boolean;
  children: ReactNode;
};

function resolveTheme({ defaultTheme = "system", enableSystem = true }: ThemeProviderProps) {
  if (defaultTheme === "system" && enableSystem && typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return (defaultTheme === "system" ? "light" : defaultTheme) as "light" | "dark" | (string & {});
}

function applyTheme(attribute: string, theme: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (attribute === "class") {
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  } else {
    root.setAttribute(attribute, theme);
  }
}

export function ThemeProvider({
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  children,
}: ThemeProviderProps) {
  useEffect(() => {
    const initial = resolveTheme({ defaultTheme, enableSystem });
    applyTheme(attribute, initial);

    if (defaultTheme === "system" && enableSystem && typeof window !== "undefined") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = (event: MediaQueryListEvent) => applyTheme(attribute, event.matches ? "dark" : "light");
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
    return undefined;
  }, [attribute, defaultTheme, enableSystem]);

  return <>{children}</>;
}
