"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps as NextThemesProviderProps,
} from "next-themes";

/**
 * Wrapper compatible con React 19:
 * - Asegura que siempre pasamos {children}
 * - Usa attribute="class" (coincide con tus estilos .dark)
 * - Permite configurar defaultTheme/enableSystem desde props
 */
export type AppThemeProviderProps = Omit<NextThemesProviderProps, "children" | "attribute"> & {
  children: React.ReactNode;
  attribute?: "class" | "data-theme" | (string & {}); // por si quieres migrar a data-theme
};

export function AppThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = true,
  ...rest
}: AppThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
      {...rest}
    >
      {children}
    </NextThemesProvider>
  );
}
