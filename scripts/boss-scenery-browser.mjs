// Real directional input; only reads live gameplay. Measure the captured
// room's actual Canvas transform against the moving gameplay camera.
import {
  launchGameBrowser,
  browserOutputDirectory,
} from './lib/browser-test.mjs'
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
const out = browserOutputDirectory(),
  report = [],
  errors = []
const browser = await launchGameBrowser()
try {
  for (const [format, width, height] of [
    ['portrait', 390, 844],
    ['landscape', 844, 390],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      hasTouch: true,
    })
    page.on('pageerror', (e) => errors.push(e.message))
    await page.addInitScript(() => {
      const original = CanvasRenderingContext2D.prototype.drawImage
      CanvasRenderingContext2D.prototype.drawImage = function (...a) {
        if (a[0]?.src?.endsWith('/boss-background.png') && a.length === 3) {
          const t = this.getTransform(),
            g = window.goonk
          window.shipDraw = {
            x: t.e + a[1] * t.a,
            y: t.f + a[2] * t.d,
            scaleX: t.a,
            scaleY: t.d,
            cameraX: g.cameraBounds.x,
            worldWidth: (g.cameraBounds.halfX - 1) * 2,
            canvasWidth: this.canvas.width,
            playerX: g.player.x,
            floorY: t.f + 190 * t.d,
          }
        }
        return original.apply(this, a)
      }
    })
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5174/')
    await page.locator('.demo-2d-choices button').nth(1).click()
    await page.waitForFunction(() => !!window.shipDraw)
    await page.waitForTimeout(200)
    const snapshot = () =>
      page.evaluate(() => ({
        ...window.shipDraw,
        hp: window.goonk.player.hp,
        lives: window.goonk.lives,
      }))
    const before = await snapshot()
    await page.screenshot({ path: out + `boss-scenery-${format}-left.png` })
    const direction = await page
      .locator('.direction-button.right')
      .boundingBox()
    await page.mouse.move(
      direction.x + direction.width / 2,
      direction.y + direction.height / 2,
    )
    await page.mouse.down()
    await page.waitForFunction(() => window.goonk.player.x >= 10, null, {
      timeout: 3000,
    })
    await page.mouse.up()
    await page.waitForTimeout(250)
    const right = await snapshot()
    await page.screenshot({ path: out + `boss-scenery-${format}-right.png` })
    const leftDirection = await page
      .locator('.direction-button.left')
      .boundingBox()
    await page.mouse.move(
      leftDirection.x + leftDirection.width / 2,
      leftDirection.y + leftDirection.height / 2,
    )
    await page.mouse.down()
    await page.waitForFunction(() => window.goonk.player.x <= 3.2, null, {
      timeout: 3000,
    })
    await page.mouse.up()
    await page.waitForTimeout(300)
    const back = await snapshot()
    for (const [a, b] of [
      [before, right],
      [right, back],
    ]) {
      const pixelsPerWorld = (a.canvasWidth - 32) / a.worldWidth
      assert(Math.abs(b.cameraX - a.cameraX) > 1, 'Camera did not move')
      assert(
        Math.abs(b.x - a.x + (b.cameraX - a.cameraX) * pixelsPerWorld) < 0.01,
        'Ship did not share the gameplay camera',
      )
      assert.equal(a.scaleX, b.scaleX)
      assert.equal(a.scaleY, b.scaleY)
      assert.equal(a.floorY, b.floorY)
    }
    assert(
      right.x < before.x - 20,
      'Room did not scroll left when walking right',
    )
    assert(back.x > right.x + 20, 'Room did not scroll right when walking left')
    assert.equal(back.lives, 5)
    report.push({ format, before, right, back, sharedCamera: true })
    await page.close()
  }
  assert.deepEqual(errors, [])
  writeFileSync(
    out + 'boss-scenery-browser.json',
    JSON.stringify(
      { report, errors, inputOnly: true, liveStateWrites: false },
      null,
      2,
    ),
  )
  console.log(
    JSON.stringify({
      formats: report.map((r) => r.format),
      bidirectionalScrolling: true,
      sharedCamera: true,
      errors,
    }),
  )
} finally {
  await browser.close()
}
