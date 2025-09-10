// eslint.config.mjs
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import nextPlugin from "@next/eslint-plugin-next";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // 0) Ignorar artefactos y generados
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "logs/**",
      "public/sw.js",
      ".safety/**",
      // Si quieres ignorar los caches/infos de TS:
      "*.tsbuildinfo",
    ],
  },

  // 1) Base para JS/MJS/CJS/TS/TSX
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      // Plugins
      "@next/next": nextPlugin,
      "react": react,
      "react-hooks": reactHooks,
      "import": importPlugin,
    },
    settings: {
      // Resolver para imports (TS/JS)
      "import/resolver": {
        typescript: {
          project: ["./tsconfig.json", "./tsconfig.typecheck.json"],
        },
        node: {
          extensions: [".js", ".mjs", ".cjs", ".ts", ".tsx"],
        },
      },
      react: {
        version: "detect",
      },
    },
    rules: {
      // --- Next.js core-web-vitals (equivalente a "extends: next/core-web-vitals")
      ...(nextPlugin.configs["core-web-vitals"]?.rules ?? {}),

      // --- React Hooks recomendado
      ...(reactHooks.configs?.recommended?.rules ?? {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      }),

      // --- Orden y limpieza de imports
      "import/order": [
        "warn",
        {
          "groups": ["builtin", "external", "internal", "parent", "sibling", "index", "object", "type"],
          "newlines-between": "always",
          "alphabetize": { "order": "asc", "caseInsensitive": true }
        }
      ],
      "import/no-unresolved": "error",

      // --- Reglas varias
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@next/next/no-img-element": "off",
    },
  },

  // 2) Soporte de TypeScript con project refs (aplica solo a TS/TSX)
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.typecheck.json",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      // Ajustes TS (puedes ir endureciendo luego)
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/triple-slash-reference": "off",
      // Si usas types-only imports con TS 5.5+, esta ayuda a evitar falsos positivos:
      "import/no-duplicates": "warn",
    },
  },

  // 3) Excepciones por archivos
  { files: ["lib/database.types.ts"], rules: { "@typescript-eslint/no-empty-object-type": "off" } },
  { files: ["sentry.*.config.ts"], rules: { "@typescript-eslint/no-explicit-any": "off" } },
];  