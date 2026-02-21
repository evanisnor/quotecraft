import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['packages/*/src/**/*.ts', 'widget/src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // Allow underscore-prefixed parameters to mark intentionally unused args
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Jest globals for test files
    files: ['packages/*/src/**/*.test.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    ignores: ['**/dist/', '**/node_modules/', '**/.next/', '**/tmp/'],
  },
];
