import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // src/App.jsx is the pre-backend UI prototype, mounted only at /prototype on mock
  // data. It is not part of the production app (see Frontend-Implementation-Standards.md
  // §9, "Out of scope") and is intentionally excluded from lint.
  globalIgnores(['dist', 'src/App.jsx']),
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['scripts/**'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // Previously unmatched by any config block -- ESLint silently skips
    // files with no matching `files` glob on a directory-wide `eslint .`
    // run (no warning, no error), so .ts/.tsx were never actually linted
    // despite being almost the entire app (ADR-033). Added 2026-08-24
    // alongside the types/api.ts vs types/api-aliases.ts split below.
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // tsc already enforces unused locals/params (tsconfig.json's
      // noUnusedLocals/noUnusedParameters) -- avoid a duplicate, differently-
      // configured report from ESLint's own base rule.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Turning on .ts/.tsx coverage surfaced 228 pre-existing findings
      // (2026-08-24). react-hooks/refs (6), react-hooks/set-state-in-effect
      // (10), and no-empty (1) were fixed/reviewed and closed out the same
      // day (see Frontend-Implementation-Standards.md §7.1a) -- left at
      // their default 'error' severity below so any *new* occurrence fails
      // lint immediately, not just this backlog.
      //
      // no-explicit-any (214) and react-refresh/only-export-components (3)
      // remain genuine backlog -- 214 is a multi-day, file-by-file cleanup
      // (see §7.1a), not something to rush. Kept as warnings (visible, not
      // silenced) so `npm run lint` doesn't fail project-wide over pre-
      // existing debt while that backlog is worked through.
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-refresh/only-export-components': 'warn',
      // src/types/api.ts is fully overwritten by `npm run generate:types`
      // (openapi-typescript's raw output) and exports no named types of its
      // own -- src/types/api-aliases.ts is the permanent, hand-maintained
      // home for named type aliases over it (see Frontend-Implementation-
      // Standards.md §7.1). This rule makes a stray import straight from
      // api.ts fail lint instead of relying on someone noticing.
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['**/types/api'],
          message: 'Import named types from "types/api-aliases", not "types/api" directly -- api.ts holds no named exports and is fully overwritten by `npm run generate:types`. Add the alias in api-aliases.ts if it does not exist yet.',
        }],
      }],
    },
  },
  {
    // The one file allowed to import from ./api directly -- it exists
    // specifically to re-export named aliases over its `components` type.
    files: ['src/types/api-aliases.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['scripts/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
  },
])
