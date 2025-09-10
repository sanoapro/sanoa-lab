<<<<<<< HEAD
// eslint.config.mjs

import { existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";

const require = createRequire(import.meta.url);

/** Helpers to make Flat Config work nicely with pnpm */
const loadFromPnpm = (specifier) => {
  try {
    return require(specifier);
  } catch (initialError) {
    const baseDir = dirname(fileURLToPath(import.meta.url));
    const pnpmDir = join(baseDir, "node_modules", ".pnpm");
    if (!existsSync(pnpmDir)) throw initialError;

    const parts = specifier.split("/");
    const prefix = specifier.startsWith("@")
      ? `${parts[0]}+${parts[1]}@`
      : `${specifier}@`;

    const matchedEntry = readdirSync(pnpmDir).find((entry) =>
      entry.startsWith(prefix),
    );
    if (!matchedEntry) throw initialError;

    const packagePath = join(pnpmDir, matchedEntry, "node_modules", ...parts);
    return require(packagePath);
  }
};

const resolveFromPnpm = (specifier) => {
  try {
    return require.resolve(specifier);
  } catch (initialError) {
    const baseDir = dirname(fileURLToPath(import.meta.url));
    const pnpmDir = join(baseDir, "node_modules", ".pnpm");
    if (!existsSync(pnpmDir)) throw initialError;

    const parts = specifier.split("/");
    const prefix = specifier.startsWith("@")
      ? `${parts[0]}+${parts[1]}@`
      : `${specifier}@`;

    const matchedEntry = readdirSync(pnpmDir).find((entry) =>
      entry.startsWith(prefix),
    );
    if (!matchedEntry) throw initialError;

    return join(pnpmDir, matchedEntry, "node_modules", ...parts);
  }
};

const js = loadFromPnpm("@eslint/js");
const globals = loadFromPnpm("globals");
const importPlugin = loadFromPnpm("eslint-plugin-import");
const reactPlugin = loadFromPnpm("eslint-plugin-react");
const reactHooksPlugin = loadFromPnpm("eslint-plugin-react-hooks");
const jsxA11yPlugin = loadFromPnpm("eslint-plugin-jsx-a11y");
const nextPlugin = loadFromPnpm("@next/eslint-plugin-next");

const tsParserPath = resolveFromPnpm("@typescript-eslint/parser");
const importResolverNodePath = resolveFromPnpm("eslint-import-resolver-node");
const importResolverTsPath = resolveFromPnpm("eslint-import-resolver-typescript");

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const nextConfigs = [
  ...compat.extends("plugin:react/recommended"),
  ...compat.extends("plugin:react-hooks/recommended"),
  ...compat.extends("plugin:@next/next/recommended"),
];

export default [
  {
    ignores: ["**/.next/**", "dist/**", "build/**", "node_modules/**"],
  },
  js.configs.recommended,
  ...nextConfigs,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      import: importPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "jsx-a11y": jsxA11yPlugin,
      "@next/next": nextPlugin,
    },
    settings: {
      react: { version: "detect" },
      "import/parsers": {
        [tsParserPath]: [".ts", ".mts", ".cts", ".tsx", ".d.ts"],
      },
      "import/resolver": {
        [importResolverNodePath]: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
        [importResolverTsPath]: {
          alwaysTryTypes: true,
          project: ["./tsconfig.json"],
        },
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/triple-slash-reference": "off",
      "prefer-const": "off",
      "prefer-rest-params": "off",
      "no-empty": "off",
      "react-hooks/exhaustive-deps": "off",
      "import/no-anonymous-default-export": "warn",
      "react/no-unknown-property": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "jsx-a11y/alt-text": [
        "warn",
        {
          elements: ["img"],
          img: ["Image"],
        },
      ],
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-proptypes": "warn",
      "jsx-a11y/aria-unsupported-elements": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",
      "react/jsx-no-target-blank": "off",
    },
  },
];
=======
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  { ignores: ["node_modules/**", ".next/**", "logs/**"] },

  // Base TS
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx,js,mjs}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.typecheck.json",
        sourceType: "module"
      }
    },
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      // relajamos mientras saneamos el repo
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
      "react-hooks/exhaustive-deps": "off"
    }
  }
];
>>>>>>> 92ccf8f (WIP: antes de parche ESLint/Supabase)
