import {
  launchGameBrowser,
  browserOutputDirectory,
} from './lib/browser-test.mjs'
import assert from 'node:assert/strict'
const output = browserOutputDirectory()
const browser = await launchGameBrowser()
const page = await browser.newPage({
  viewport: { width: 844, height: 390 },
  hasTouch: true,
  isMobile: true,
})
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
try {
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5174/')
  await page.locator('.lang-select-input').selectOption('fr')
  await page.waitForFunction(() => document.documentElement.lang === 'fr')
  await page.getByRole('button', { name: 'Commencer l’aventure' }).click()
  await page.waitForFunction(
    () => window.goonk.level.originalTerrain === 'jungle',
  )
  assert.equal(await page.evaluate(() => window.goonk.letterWord), 'KONG')
  await page.waitForFunction(
    () =>
      window.goonkAudio.inspect().playing &&
      window.goonkAudio.inspect().trackId === 0 &&
      window.goonkAudio.inspect().currentTime > 0.25,
    null,
    { timeout: 15000 },
  )
  await page.evaluate(() => window.goonk.onEvent('banana'))
  await page.waitForFunction(
    () => window.goonkAudio.inspect().loadedEffects > 0,
  )
  const spawn = await page.evaluate(() => ({
    x: window.goonk.player.x,
    y: window.goonk.player.y,
  }))
  await page.screenshot({ path: output + 'original-jungle-landscape.png' })
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(400)
  await page.keyboard.up('ArrowRight')
  await page.waitForTimeout(1200)
  assert((await page.evaluate(() => window.goonk.player.x)) > spawn.x + 0.7)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(350)
  await page.screenshot({ path: output + 'original-jungle-portrait.png' })
  await page.getByRole('button', { name: 'Mettre en pause' }).click()
  await page.waitForTimeout(200)
  assert.equal(
    await page.evaluate(() => window.goonkAudio.inspect().playing),
    false,
  )
  await page.getByRole('button', { name: 'Reprendre', exact: true }).click()
  await page.waitForFunction(() => window.goonkAudio.inspect().playing)
  await page.evaluate(() => window.goonk.start(3))
  await page.waitForFunction(
    () =>
      window.goonkAudio.inspect().trackId === 3 &&
      window.goonkAudio.inspect().playing,
  )
  const audio = await page.evaluate(() => window.goonkAudio.inspect())
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      originalTerrain: true,
      letters: 'KONG',
      movement: true,
      musicAndFX: true,
      musicTransition: audio.trackName,
      pauseResume: true,
      formats: 2,
      errors,
    }),
  )
} finally {
  await browser.close()
}
