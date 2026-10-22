// Visual checks only: rain is staged after a normal crown phase.
// For an input-only complete fight use boss-battle-browser.mjs instead.
import {
  launchGameBrowser,
  browserOutputDirectory,
} from './lib/browser-test.mjs'
import { writeFileSync } from 'node:fs'
const out = browserOutputDirectory()
const b = await launchGameBrowser(),
  errors = []
try {
  for (const [mode, width, height] of [
    ['3d', 390, 844],
    ['3d', 844, 390],
    ['2d', 390, 844],
    ['2d', 844, 390],
  ]) {
    const p = await b.newPage({ viewport: { width, height }, hasTouch: true })
    p.on('pageerror', (e) => errors.push(e.message))
    await p.goto(process.env.GAME_URL || 'http://127.0.0.1:5174/')
    await p.waitForFunction(() => !!window.goonk)
    if (mode === '2d') await p.locator('.demo-2d-choices button').nth(1).click()
    else {
      await p
        .getByRole('button', { name: 'Explore the island', exact: true })
        .click()
      await p.locator('.map-stage').nth(6).click()
      await p
        .locator('.map-mode-buttons button')
        .filter({ hasText: /^3D$/ })
        .click()
      await p.locator('.map-enter').click()
    }
    await p.waitForFunction(
      () =>
        window.goonk.levelId === 6 &&
        window.goonk.bossBattle?.phase === 'catch',
    )
    await p.waitForTimeout(400)
    await p.screenshot({ path: out + `boss-${mode}-${width}.png` })
    // Isolated phase visualization setup, not a claimed playthrough.
    await p.evaluate(() => {
      const g = window.goonk,
        b = g.enemies[0]
      Object.assign(g.bossBattle, {
        phase: 'rain',
        phaseTime: 0,
        spawned: 0,
        rainCount: 17,
        ballClock: 0,
        crowned: true,
      })
      g.player.invincible = 10
      g.bossProjectiles = []
      b.y = 0
    })
    await p.waitForFunction(() => window.goonk.bossProjectiles.length >= 4)
    await p.screenshot({ path: out + `boss-${mode}-rain-${width}.png` })
    await p.close()
  }
  writeFileSync(
    out + 'boss-visual-errors.json',
    JSON.stringify(
      {
        formats: ['2d portrait', '2d landscape', '3d portrait', '3d landscape'],
        controlledRainVisualization: true,
        errors,
      },
      null,
      2,
    ),
  )
  console.log(JSON.stringify({ errors }))
  if (errors.length) process.exitCode = 1
} finally {
  await b.close()
}
