// eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["**/.next/**", "dist/**", "build/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  nextPlugin.flatConfig.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
];
