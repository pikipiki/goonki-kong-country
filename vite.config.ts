/// <reference types="vitest/config" />
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, type Plugin, type HtmlTagDescriptor } from 'vite'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const githubPagesBase = '/goonki-kong-country/'

// GitHub Pages cannot set response headers. Scope the meta policy to the app build;
// development and Storybook need their own script injection and are not published here.
function productionContentSecurityPolicy(): Plugin {
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "connect-src 'self'",
    "font-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ')
  return {
    name: 'app-content-security-policy',
    apply: 'build',
    transformIndexHtml(html, context) {
      const tags: HtmlTagDescriptor[] = []
      if (context.filename === path.join(dirname, 'index.html')) {
        tags.push({
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
          injectTo: 'head-prepend',
        })
      }
      return { html, tags }
    },
  }
}

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? githubPagesBase : '/',
  plugins: [react(), productionContentSecurityPolicy()],
  resolve: {
    alias: {
      '@game3d': fileURLToPath(new URL('./src/game3d', import.meta.url)),
    },
  },
  server: { port: 5174, strictPort: true },
  build: { chunkSizeWarningLimit: 1400 },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/game/**/*.ts'],
      exclude: ['src/game/**/__tests__/**'],
      thresholds: {
        lines: 100,
        functions: 100,
        statements: 100,
        branches: 100,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'game',
          environment: 'node',
          pool: 'forks',
          isolate: false,
          include: ['tests/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
          css: true,
          include: ['src/**/*.test.tsx'],
          exclude: ['**/node_modules/**', '**/dist/**'],
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
