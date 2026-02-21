import js from '@eslint/js';
import globals from 'globals';

export default [
  // Global ignores
  {
    ignores: [
      'dist/',
      'node_modules/',
      // TypeScript files are type-checked by tsc (pnpm run typecheck).
      // TypeScript-specific ESLint rules and parser are configured in INFR-US1-A009.
      '**/*.ts',
      '**/*.tsx',
      '**/*.mts',
    ],
  },
  // JavaScript and MJS files
  {
    files: ['**/*.js', '**/*.mjs'],
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
];
