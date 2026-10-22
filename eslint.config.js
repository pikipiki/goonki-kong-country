import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import sonarjs from 'eslint-plugin-sonarjs'
import storybook from 'eslint-plugin-storybook'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/** Aligné sur tontie-re : noms ≥3 caractères, fichiers ≤300 lignes, fonctions ≤80 lignes. */
export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'public',
      'reference',
      'coverage/**',
      'scripts/**',
      'storybook-static/**',
      'playwright-report/**',
      '**/*.monolith.ts',
    ],
  },
  ...storybook.configs['flat/recommended'],
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: { globals: globals.node },
  },
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        project: [
          './tsconfig.eslint.json',
          './tsconfig.test.json',
          './tsconfig.node.json',
          './tsconfig.storybook.json',
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      sonarjs,
    },
    rules: {
      ...sonarjs.configs.recommended.rules,
      'sonarjs/prefer-read-only-props': 'off',
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'id-length': [
        'error',
        {
          min: 3,
          properties: 'never',
          exceptions: ['_', 'tr'],
        },
      ],
      'max-lines': [
        'error',
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'error',
        {
          max: 80,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
    },
  },
  {
    files: ['vite.config.ts', 'eslint.config.js', 'playwright.config.ts'],
    rules: { 'id-length': 'off' },
  },
  {
    files: ['.storybook/**/*.{ts,tsx}', '**/*.stories.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: [
      'src/**/__tests__/**/*.{ts,tsx}',
      'tests/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
    ],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'sonarjs/no-floating-point-equality': 'off',
      'sonarjs/public-static-readonly': 'off',
      'sonarjs/no-fixed-wait-in-tests': 'off',
    },
  },
  {
    files: ['src/game/original*.ts', 'src/game/**/original*.ts'],
    rules: {
      'max-lines': 'off',
      'id-length': 'off',
    },
  },
  {
    files: ['src/game/audioInternal.ts'],
    rules: { 'max-lines': 'off' },
  },
  eslintConfigPrettier,
)
