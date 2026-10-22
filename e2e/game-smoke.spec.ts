import { expect, test } from '@playwright/test'
import type { Game } from '../src/game/engine'
import { collectPageErrors } from './helpers/collectPageErrors'
declare global {
  interface Window {
    goonk: Game
  }
}
test.describe('gameplay smoke', () => {
  test('title flow, jump, buddy swap, and stage loads', async ({ page }) => {
    const errors = collectPageErrors(page)
    await page.goto('/')
    await page.locator('.lang-select-input').selectOption('fr')
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.lang))
      .toBe('fr')
    await page.getByRole('button', { name: 'Commencer l’aventure' }).click()
    await page.keyboard.down('Space')
    await expect
      .poll(async () => page.evaluate(() => window.goonk.player.y))
      .toBeGreaterThan(0.5)
    await page.keyboard.up('Space')
    await page.keyboard.press('KeyC')
    await expect
      .poll(async () => page.evaluate(() => window.goonk.player.active))
      .toBe(1)
    for (const levelId of [1, 2, 3, 4, 5, 6]) {
      await page.evaluate((stageId: number) => {
        window.goonk.load(stageId)
      }, levelId)
      await expect
        .poll(async () => page.evaluate(() => window.goonk.phase))
        .toBe('playing')
    }
    expect(errors).toEqual([])
  })
  test('ROM dev routes mount without errors', async ({ page }) => {
    const errors = collectPageErrors(page)
    for (const query of [
      '?play=jungle',
      '?play=reverb',
      '?play=minecart',
      '?play=coral',
    ]) {
      await page.goto(`/${query}`)
      await expect
        .poll(async () => page.evaluate(() => window.goonk.phase))
        .toBe('playing')
    }
    expect(errors).toEqual([])
  })
  test('mobile touch steering moves the player', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/?play=jungle')
    await page.locator('.lang-select-input').selectOption('fr')
    await expect
      .poll(async () => page.evaluate(() => window.goonk.phase))
      .toBe('playing')
    const before = await page.evaluate(() => window.goonk.player.x)
    const button = page.getByRole('button', {
      name: 'Aller à droite',
      exact: true,
    })
    const rect = await button.boundingBox()
    expect(rect).not.toBeNull()
    if (!rect) {
      return
    }
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2)
    await page.mouse.down()
    await expect
      .poll(async () => page.evaluate(() => window.goonk.player.x))
      .toBeGreaterThan(before + 0.7)
    await page.mouse.up()
  })
})
