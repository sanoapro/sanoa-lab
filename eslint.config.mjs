// eslint.config.mjs
import js from "@eslint/js";
import next from "eslint-config-next";
import ts from "typescript-eslint";

export default [
  { ignores: ["node_modules/**", ".next/**", "dist/**"] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...next,
  {
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "react-hooks/exhaustive-deps": "off",
    },
  },
];
