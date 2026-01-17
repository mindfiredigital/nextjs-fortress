import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import js from "@eslint/js";
import globals from "globals";

export default [
  // 1. Tell ESLint which folders to ignore globally
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/build/**",
      "packages/nextjs-fortress/tests/**/*.ts",
      "packages/nextjs-fortress/tests/**/*.tsx"
    ]
  },

  // 2. Define the configuration for your TypeScript packages
  {
    // Point specifically to the workspaces
    files: [
      "packages/nextjs-fortress/src/**/*.ts",
      "examples/demoApp/**/*.{ts,tsx}" 
    ],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.node, // This defines 'process', 'console', etc.
        ...globals.jest,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        // This is key: it tells ESLint to respect the project's types
        project: [
          "./packages/nextjs-fortress/tsconfig.json",
          "./examples/demoApp/tsconfig.json",
        ],
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": "off",
    },
  }
];