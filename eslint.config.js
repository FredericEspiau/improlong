/* eslint-disable import-x/no-named-as-default-member */
import { includeIgnoreFile } from "@eslint/config-helpers";
import eslint from "@eslint/js";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import eslintPluginImportX, {
  createNodeResolver,
} from "eslint-plugin-import-x";
import nodePlugin from "eslint-plugin-n";
import perfectionist from "eslint-plugin-perfectionist";
import pluginPromise from "eslint-plugin-promise";
import * as regexpPlugin from "eslint-plugin-regexp";
import sonarjs from "eslint-plugin-sonarjs";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

const GLOB_EXCLUDE = [
  "**/.nx/**",
  "**/.svelte-kit/**",
  "**/build/**",
  "**/coverage/**",
  "**/dist/**",
  "**/snap/**",
  "**/vite.config.*.timestamp-*.*",
];

export default defineConfig(
  // Global ignores (from nearest .gitignore in directory tree)
  includeIgnoreFile(gitignorePath),

  eslint.configs.recommended,
  // @ts-expect-error - eslint-plugin-import-x is not typed correctly
  eslintPluginImportX.flatConfigs.recommended,
  eslintPluginImportX.flatConfigs.typescript,
  eslintPluginUnicorn.configs.recommended,
  regexpPlugin.configs["flat/recommended"],
  sonarjs.configs.recommended,
  pluginPromise.configs["flat/recommended"],
  nodePlugin.configs["flat/recommended-script"],
  perfectionist.configs["recommended-natural"],
  {
    ignores: GLOB_EXCLUDE,
  },
  {
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "@typescript-eslint/array-type": [
        "error",
        { default: "generic", readonly: "generic" },
      ],
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { minimumDescriptionLength: 0 },
      ],
      /**
      Enforce import type { T }
      */
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],
      /**
      Shorthand method style is less strict
      */
      "@typescript-eslint/method-signature-style": ["error", "property"],
      /**
      Duplicate values can lead to bugs that are hard to track down
      */
      "@typescript-eslint/no-duplicate-enum-values": "error",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      /**
      Using the operator any more than once does nothing
      */
      "@typescript-eslint/no-extra-non-null-assertion": "error",
      "@typescript-eslint/no-floating-promises": "error",
      /**
      There are several potential bugs with this compared to other loops
      */
      "@typescript-eslint/no-for-in-array": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      /**
      Don't over-define types for simple things like strings
      */
      "@typescript-eslint/no-inferrable-types": [
        "error",
        { ignoreParameters: true },
      ],
      /**
      Enforce valid definition of new and constructor
      */
      "@typescript-eslint/no-misused-new": "error",
      /**
      Disallow TypeScript namespaces
      */
      "@typescript-eslint/no-namespace": "error",
      /**
      Disallow non-null assertions after an optional chain expression
      */
      "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
      /**
      Detects conditionals which will always evaluate truthy or falsy
      */
      "@typescript-eslint/no-unnecessary-condition": "error",
      /**
      Checks if the the explicit type is identical to the inferred type
      */
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      /**
      Disallow using the unsafe built-in Function type
      */
      "@typescript-eslint/no-unsafe-function-type": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      /**
      Disallow using confusing built-in primitive class wrappers
      */
      "@typescript-eslint/no-wrapper-object-types": "error",
      /**
      Enforce the use of as const over literal type
      */
      "@typescript-eslint/prefer-as-const": "error",
      /**
      Prefer for-of loop over the standard for loop
      */
      "@typescript-eslint/prefer-for-of": "warn",
      "@typescript-eslint/prefer-readonly": "error",
      /**
      Warn about async functions which have no await expression
      */
      "@typescript-eslint/require-await": "warn",
      /**
      Prefer of ES6-style import declarations
      */
      "@typescript-eslint/triple-slash-reference": "error",
      "for-direction": "error",
      "import-x/consistent-type-specifier-style": ["error", "prefer-top-level"],
      "import-x/first": "error",
      "import-x/newline-after-import": "error",
      "import-x/no-commonjs": "error",
      "import-x/no-duplicates": "error",
      "import-x/no-unresolved": "off",
      "n/no-missing-import": "off",
      "n/no-unpublished-import": "off",
      "n/no-unsupported-features/node-builtins": "off",
      "n/prefer-node-protocol": "error",
      "no-async-promise-executor": "error",
      "no-case-declarations": "error",
      "no-class-assign": "error",
      "no-compare-neg-zero": "error",
      "no-cond-assign": "error",
      "no-constant-binary-expression": "error",
      "no-constant-condition": "error",
      "no-control-regex": "error",
      "no-debugger": "error",
      "no-delete-var": "error",
      "no-dupe-else-if": "error",
      "no-duplicate-case": "error",
      "no-empty-character-class": "error",
      "no-empty-pattern": "error",
      "no-empty-static-block": "error",
      "no-ex-assign": "error",
      "no-extra-boolean-cast": "error",
      "no-fallthrough": "error",
      "no-global-assign": "error",
      "no-invalid-regexp": "error",
      "no-irregular-whitespace": "error",
      "no-loss-of-precision": "error",
      "no-misleading-character-class": "error",
      "no-nonoctal-decimal-escape": "error",
      "no-octal": "error",
      "no-regex-spaces": "error",
      "no-self-assign": "error",
      /**
      Warn about variable with identical names in the outer scope
      */
      "no-shadow": "warn",
      "no-shadow-restricted-names": "error",
      "no-sparse-arrays": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-optional-chaining": "error",
      "no-unused-labels": "error",
      "no-unused-private-class-members": "error",
      "no-useless-backreference": "error",
      "no-useless-catch": "error",
      "no-useless-escape": "error",
      /**
      Prefer let and const
      */
      "no-var": "error",
      "no-with": "error",
      "perfectionist/sort-classes": "off",
      "perfectionist/sort-imports": [
        "error",
        {
          groups: [
            ["value-builtin", "value-external", "type-import"],
            "type-internal",
            "value-internal",
            ["type-parent", "type-sibling", "type-index"],
            ["value-parent", "value-sibling", "value-index"],
            "ts-equals-import",
            "unknown",
          ],
        },
      ],
      /**
      Prefer const if never re-assigned
      */
      "prefer-const": "error",
      "require-yield": "error",
      "sonarjs/cognitive-complexity": "off",
      "sonarjs/no-empty-test-file": "off",
      "sonarjs/no-nested-conditional": "off",
      // Concept guard is named exactly `is` by convention (entity + value object surface)
      "unicorn/consistent-boolean-name": "off",
      "unicorn/consistent-function-scoping": "off",
      "unicorn/filename-case": "off",
      "unicorn/name-replacements": "off",
      "unicorn/no-abusive-eslint-disable": "off",
      "unicorn/no-array-reduce": "off",
      "unicorn/no-nested-ternary": "off",
      "unicorn/no-null": "off",
      "unicorn/number-literal-case": "off",
      "unicorn/prevent-abbreviations": "off",
      "use-isnan": "error",
      "valid-typeof": "error",
    },
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver(),
        createNodeResolver(),
      ],
      node: {
        version: ">=26.0.0",
      },
    },
  },

  // Disable type checking for JS files
  {
    extends: [tseslint.configs.disableTypeChecked],
    files: ["**/*.{js,cjs,mjs,jsx}", "*.{js,cjs,mjs,jsx}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      sourceType: "module",
    },
    rules: {
      "n/no-unpublished-import": "off",
    },
    settings: {
      node: {
        version: ">=26.0.0",
      },
    },
  },
);
