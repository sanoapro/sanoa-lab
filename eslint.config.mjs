import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Ignora artefactos y generados
  { ignores: ["node_modules/**", ".next/**", "logs/**", "public/sw.js", "eslint.config.*", ".safety/**"] },

  // JS/MJS/CJS
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: { sourceType: "module" },
    plugins: { "@next/next": nextPlugin, "react": react, "react-hooks": reactHooks, "import": importPlugin },
    rules: {
      "no-unused-vars": "off",
      "@next/next/no-img-element": "off",
      "import/order": "off"
    }
  },

  // TS/TSX (proyecto tipado)
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { project: "./tsconfig.typecheck.json", sourceType: "module", ecmaFeatures: { jsx: true } }
    },
    plugins: { "@next/next": nextPlugin, "@typescript-eslint": tseslint.plugin, "react": react, "react-hooks": reactHooks, "import": importPlugin },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/triple-slash-reference": "off",
      "@next/next/no-img-element": "off",
      "import/order": "off"
    }
  },

  // Archivo generado por Supabase
  { files: ["lib/database.types.ts"], rules: { "@typescript-eslint/no-empty-object-type": "off" } },

  // Sentry boilerplate
  { files: ["sentry.*.config.ts"], rules: { "@typescript-eslint/no-explicit-any": "off" } }
];
