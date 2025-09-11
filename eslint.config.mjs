// /workspaces/sanoa-lab/eslint.config.mjs
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";

// Config base de Next (core-web-vitals)
const nextCore = nextPlugin.configs["core-web-vitals"] ?? { rules: {}, plugins: {} };

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Ignora artefactos
  { ignores: ["node_modules/**", ".next/**", "logs/**", "public/sw.js", "eslint.config.*", ".safety/**"] },

  // Bloque único JS/TS/React con Next
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        // Más liviano que apuntar a un tsconfig concreto:
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true },
      },
    },
    // Mezclamos plugins del preset de Next con los nuestros
    plugins: {
      ...nextCore.plugins,
      "@next/next": nextPlugin,
      "@typescript-eslint": tseslint.plugin,
      react,
      "react-hooks": reactHooks,
      import: importPlugin,
    },
    // (Opcional) si un día activas reglas de react:
    // settings: { react: { version: "detect" } },

    // Reglas: partimos de core-web-vitals y silenciamos lo que no quieres
    rules: {
      ...nextCore.rules,
      "@next/next/no-img-element": "off",

      // Silencios “de ruido”
      "import/order": "off",
      "react-hooks/exhaustive-deps": "off",
      "no-console": "off",
      "no-unused-vars": "off",

      // TS
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },

  // Archivo generado por Supabase
  { files: ["lib/database.types.ts"], rules: { "@typescript-eslint/no-empty-object-type": "off" } },

  // Sentry boilerplate
  { files: ["sentry.*.config.ts"], rules: { "@typescript-eslint/no-explicit-any": "off" } },
];