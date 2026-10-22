import { expect, test } from '@playwright/test'
import type { Game } from '../src/game/engine'
import { collectPageErrors } from './helpers/collectPageErrors'
import { waitForPlaying } from './helpers/waitForPlaying'

declare global {
  interface Window {
    goonk: Game
  }
}

test('title flow, jump, buddy swap, and stage loads', async ({ page }) => {
  test.setTimeout(60_000)
  const errors = collectPageErrors(page)
  await page.goto('/')
  await page.locator('.lang-select-input').selectOption('fr')
  await expect
    .poll(async () => page.evaluate(() => document.documentElement.lang))
    .toBe('fr')
  await expect(
    page.getByRole('button', { name: 'Commencer l’aventure' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /Explorer l’île/ }),
  ).toBeVisible()

  await page.goto('/?demo=2d')
  await waitForPlaying(page)
  await page.keyboard.down('Space')
  await expect
    .poll(async () => page.evaluate(() => window.goonk.player.y), {
      timeout: 10_000,
    })
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
  await page.goto('/?demo=2d')
  await waitForPlaying(page)
  const padToggle = page.getByRole('button', {
    name: /Afficher la manette virtuelle|Show virtual controller/i,
  })
  if (await padToggle.isVisible()) {
    await padToggle.click()
  }
  const before = await page.evaluate(() => window.goonk.player.x)
  const button = page.getByRole('button', {
    name: /Aller à droite|Move right/i,
    exact: true,
  })
  await button.evaluate((element) => {
    const down = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
      buttons: 1,
    })
    element.dispatchEvent(down)
    if (element instanceof HTMLElement) {
      element.setPointerCapture(1)
    }
  })
  await expect
    .poll(async () => page.evaluate(() => window.goonk.player.x), {
      timeout: 10_000,
    })
    .toBeGreaterThan(before + 0.7)
  await button.evaluate((element) => {
    element.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        buttons: 0,
      }),
    )
    if (element instanceof HTMLElement) {
      element.releasePointerCapture(1)
    }
  })
})
