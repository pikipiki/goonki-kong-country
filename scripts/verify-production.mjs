import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { preview } from 'vite'
import {
  launchGameBrowser,
  browserOutputDirectory,
} from './lib/browser-test.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const server = await preview({
  root,
  preview: { host: '127.0.0.1', port: 5191, strictPort: true, open: false },
})
const origin = 'http://127.0.0.1:5191'
const base = `${origin}${server.config.base}`
let browser
const results = []
try {
  browser = await launchGameBrowser()
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    for (const mode of ['jungle2d', 'boss2d', 'jungle3d']) {
      const page = await browser.newPage({ viewport, hasTouch: true })
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text())
      })
      await page.addInitScript(() => {
        window.policyViolations = []
        window.addEventListener('securitypolicyviolation', (event) => {
          window.policyViolations.push(
            `${event.effectiveDirective}: ${event.blockedURI}`,
          )
        })
      })
      const query =
        mode === 'boss2d'
          ? '?demo=2d&stage=boss'
          : mode === 'jungle2d'
            ? '?demo=2d'
            : '?play=jungle'
      await page.goto(base + query)
      await page.waitForFunction(() => window.goonk?.phase === 'playing')
      await page.locator('.scene canvas').waitFor({ state: 'visible' })
      await page.waitForFunction(() => window.goonk.time > 0.25)
      const policy = await page
        .locator('meta[http-equiv="Content-Security-Policy"]')
        .getAttribute('content')
      assert(policy.includes("script-src 'self'"))
      assert(policy.includes("object-src 'none'"))
      const before = await page.evaluate(() => window.goonk.player.y)
      await page.keyboard.down('Space')
      await page.waitForFunction(
        (groundY) => window.goonk.player.y > groundY + 0.25,
        before,
      )
      await page.keyboard.up('Space')
      if (mode === 'jungle3d') {
        await page.waitForFunction(() => window.goonkDiagnostics?.fps > 0)
      }
      const evidence = await page.evaluate(() => ({
        violations: window.policyViolations,
        diagnostics: window.goonkDiagnostics ?? null,
        resources: performance
          .getEntriesByType('resource')
          .filter((entry) => entry.name.endsWith('.js'))
          .map((entry) => new URL(entry.name).pathname),
        finitePosition:
          Number.isFinite(window.goonk.player.x) &&
          Number.isFinite(window.goonk.player.y),
      }))
      assert.deepEqual(errors, [])
      assert.deepEqual(evidence.violations, [])
      assert(evidence.finitePosition)
      if (mode !== 'jungle3d') {
        assert(
          !evidence.resources.some((name) =>
            /\/(?:Scene|Goonk|profile)-/.test(name),
          ),
          'A 2D deep link must not load the 3D renderer',
        )
      }
      results.push({ mode, viewport, ...evidence })
      await page.close()
    }
  }
  const report = { base: server.config.base, cases: results, errors: [] }
  await writeFile(
    browserOutputDirectory() + 'production.json',
    JSON.stringify(report, null, 2) + '\n',
  )
  console.log(
    JSON.stringify({
      productionCases: results.length,
      base: server.config.base,
      cspViolations: 0,
      errors: [],
    }),
  )
} finally {
  await browser?.close()
  await new Promise((resolve, reject) =>
    server.httpServer.close((error) => (error ? reject(error) : resolve())),
  )
}
