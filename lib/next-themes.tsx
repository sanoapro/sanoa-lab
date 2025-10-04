import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

/**
 * Export canónico que usarás en app/providers.tsx:
 *   import { ThemeProvider } from "@/lib/next-themes";
 */
export const ThemeProvider = NextThemesProvider;

/**
 * Compatibilidad hacia atrás:
 * - Si en algún lugar aún importaste AppThemeProvider/AppThemeProviderProps,
 *   seguirán funcionando sin tocar ese archivo.
 */
export const AppThemeProvider = NextThemesProvider;
export type AppThemeProviderProps = ThemeProviderProps;

/** Re-export del tipo por si lo usas con el nombre "ThemeProviderProps". */
export type { ThemeProviderProps };
