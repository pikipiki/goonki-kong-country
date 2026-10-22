// Mobile Enguarde: repeatable quick attacks alongside the separate power charge.
import {
  launchGameBrowser,
  browserOutputDirectory,
} from './lib/browser-test.mjs'
import { writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const out = browserOutputDirectory()
const browser = await launchGameBrowser(),
  results = [],
  errors = []
try {
  for (const [orientation, width, height] of [
    ['portrait', 390, 844],
    ['landscape', 844, 390],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      hasTouch: true,
      isMobile: true,
    })
    const page = await context.newPage()
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5174/')
    await page.waitForFunction(() => !!window.goonk && !!window.goonkScene)
    await page.locator('.lang-select-input').selectOption('fr')
    await page.waitForFunction(() => document.documentElement.lang === 'fr')
    for (const mode of ['touch', 'click']) {
      console.log(orientation, mode)
      if (mode === 'click')
        await page.getByRole('button', { name: 'Mode tactile' }).click()
      await page.evaluate(() => {
        const g = window.goonk
        g.start(3)
        g.enemies = []
        g.animals[0].state = 'ridden'
        Object.assign(g.player, {
          mount: 0,
          x: 20,
          y: 2,
          vx: 0,
          vy: 0,
          invincible: 0,
        })
        g.quickEvents = 0
        g.originalQuickEvent ??= g.onEvent
        g.onEvent = (e) => {
          if (e === 'roll') g.quickEvents++
          g.originalQuickEvent(e)
        }
      })
      const quick = page.getByRole('button', {
        name: 'Attaque rapide',
        exact: true,
      })
      await quick.waitFor()
      await page.waitForFunction(() =>
        document
          .querySelector('.controller-center')
          ?.textContent.toLowerCase()
          .includes('enguarde'),
      )
      for (let i = 0; i < 8; i++) {
        await quick.tap()
        await page.waitForFunction((n) => window.goonk.quickEvents === n, i + 1)
      }
      const rapid = await page.evaluate(() => ({
        count: window.goonk.quickEvents,
        charge: window.goonk.player.mountCharge,
        charged: window.goonk.player.mountCharged,
        attack: window.goonk.player.mountAttack,
        vx: window.goonk.player.vx,
      }))
      assert.equal(rapid.count, 8)
      assert.equal(rapid.charge, 0)
      assert.equal(rapid.charged, false)
      assert(rapid.vx > 0 && rapid.vx < 18)
      await page.getByRole('button', { name: 'Charge', exact: true }).tap()
      await page.waitForFunction(() => window.goonk.player.mountCharge >= 0.65)
      await quick.tap()
      await page.waitForFunction(
        () =>
          window.goonk.player.mountCharge === 0 &&
          !window.goonk.player.mountCharged &&
          window.goonk.player.mountAttack > 0,
      )
      await page.getByRole('button', { name: 'Charge', exact: true }).waitFor()
      assert.equal(
        await page
          .getByRole('button', { name: 'Charge', exact: true })
          .getAttribute('aria-pressed'),
        'false',
      )
      await page.screenshot({
        path: out + `enguarde-quick-${orientation}-${mode}.png`,
      })
      await page.getByRole('button', { name: 'Charge', exact: true }).tap()
      await page.waitForFunction(() => window.goonk.player.mountCharge >= 0.65)
      await page.getByRole('button', { name: 'Lancer', exact: true }).tap()
      await page.waitForFunction(() => window.goonk.player.mountCharged)
      assert.equal(await page.evaluate(() => window.goonk.player.vx), 18)
      results.push({
        orientation,
        mode,
        rapid,
        cancelsReadyCharge: true,
        strongChargeStillWorks: true,
      })
    }
    await context.close()
  }
  assert.deepEqual(errors, [])
  writeFileSync(
    out + 'enguarde-quick-regression.json',
    JSON.stringify({ results, errors }, null, 2),
  )
  console.log(JSON.stringify({ results, errors }))
} finally {
  await browser.close()
}
