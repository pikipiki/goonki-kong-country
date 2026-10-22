import { expect, type Page } from '@playwright/test'

/** Wait until the engine is in a live round (2D canvas or 3D scene, not the error shell). */
export async function waitForPlaying(page: Page) {
  await expect
    .poll(async () => page.evaluate(() => window.goonk.phase))
    .toBe('playing')
  await expect
    .poll(async () =>
      page
        .getByRole('heading', {
          name: /affichage 3D|pause technique|3D display|Technical pause/i,
        })
        .isVisible()
        .catch(() => false),
    )
    .toBe(false)
  await expect(page.locator('canvas').first()).toBeVisible()
}
