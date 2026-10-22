// Actual R3F arrow directions must follow the engine's quantized shot vectors.
import {
  launchGameBrowser,
  browserOutputDirectory,
} from './lib/browser-test.mjs'
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
const out = browserOutputDirectory()
const browser = await launchGameBrowser()
const results = [],
  errors = []
try {
  for (const [width, height] of [
    [390, 844],
    [844, 390],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } })
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5174/')
    await page.waitForFunction(() => !!window.goonk && !!window.goonkScene)
    await page.evaluate(() => {
      const g = window.goonk
      g.start(1, true)
      const b = g.level.barrels[2]
      Object.assign(g.player, { x: b.x, y: b.y, cannon: 2, grounded: false })
    })
    await page.waitForFunction(() => {
      let n = 0
      window.goonkScene.traverse((o) => {
        if (o.name === 'cannon-direction') n++
      })
      return n === 50
    })
    await page.waitForTimeout(150)
    const directions = await page.evaluate(() => {
      const result = []
      window.goonkScene.traverse((o) => {
        if (o.name !== 'cannon') return
        const arrow = o.getObjectByName('cannon-direction')
        if (!arrow) return
        const e = arrow.matrixWorld.elements,
          mag = Math.hypot(e[4], e[5]),
          angle = window.goonk.cannonAngle(o.userData.barrelIndex)
        result.push({
          i: o.userData.barrelIndex,
          dot: (e[4] * Math.cos(angle) + e[5] * Math.sin(angle)) / mag,
          billboard: arrow.children.some((c) => c.isSprite),
        })
      })
      return result
    })
    assert.equal(directions.length, 50)
    assert(directions.every((d) => d.dot > 0.999999 && !d.billboard))
    results.push({
      width,
      height,
      count: directions.length,
      minDot: Math.min(...directions.map((d) => d.dot)),
    })
    await page.screenshot({ path: out + `cannon-direction-${width}.png` })
    await page.close()
  }
  assert.deepEqual(errors, [])
  writeFileSync(
    out + 'cannon-direction-regression.json',
    JSON.stringify({ results, errors }, null, 2),
  )
  console.log(JSON.stringify({ results, errors }))
} finally {
  await browser.close()
}
