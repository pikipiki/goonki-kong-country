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
    for (const kind of ['rambi', 'enguarde']) {
      await page.evaluate((kind) => {
        const g = window.goonk
        g.start(kind === 'rambi' ? 0 : 3, false)
        g.enemies = []
        g.animals[0].state = 'ridden'
        Object.assign(g.player, {
          mount: 0,
          x: kind === 'rambi' ? 12 : 20,
          y: kind === 'rambi' ? 0 : 2,
          invincible: 0,
        })
      }, kind)
      console.log(orientation, kind)
      await page.waitForFunction(
        (kind) =>
          document
            .querySelector('.controller-center')
            ?.textContent.toLowerCase()
            .includes(kind),
        kind,
      )
      await page.getByRole('button', { name: 'Charge', exact: true }).waitFor()
      // Both touch and click steering modes use tap-to-charge. A free finger
      // can now jump/steer while the screen action remains latched.
      await page.getByRole('button', { name: 'Charge', exact: true }).tap()
      await page.waitForFunction(() => window.goonk.player.mountCharge >= 0.65)
      assert(
        await page
          .getByRole('progressbar', { name: 'Puissance de charge' })
          .isVisible(),
      )
      assert.equal(
        await page
          .getByRole('button', { name: 'Lancer', exact: true })
          .getAttribute('aria-pressed'),
        'true',
      )
      const pose = () =>
        page.evaluate(() => {
          let model
          window.goonkScene.traverse((o) => {
            if (
              o.name === 'animal-model' &&
              o.userData.kind === window.goonk.mount.kind
            )
              model = o
          })
          let tail, head, windup
          model.traverse((o) => {
            if (o.name === 'animal-tail') tail = o.rotation.y
            if (o.name === 'animal-attack') head = o.rotation.z
            if (o.name === 'animal-charge-windup') windup = o.visible
          })
          return {
            x: model.position.x,
            tail,
            head,
            windup,
            animation: model.userData.animation,
          }
        })
      const before = await pose()
      await page.waitForTimeout(200)
      const after = await pose()
      assert.equal(after.animation, 'ready')
      assert(after.windup)
      assert(
        Math.abs(before.x - after.x) > 0.0001 ||
          Math.abs((before.tail ?? 0) - (after.tail ?? 0)) > 0.0001,
      )
      if (kind === 'rambi') {
        await page.getByRole('button', { name: 'Sauter', exact: true }).tap()
        await page.waitForFunction(() => window.goonk.player.y > 0.25)
        assert(
          await page.evaluate(() => window.goonk.player.mountCharge >= 0.65),
        )
      }
      await page.screenshot({
        path: out + `mechanics-${kind}-charging-${orientation}.png`,
      })
      await page.getByRole('button', { name: 'Lancer', exact: true }).tap()
      await page.waitForFunction(() => window.goonk.player.mountCharged)
      const state = await page.evaluate(() => ({
        vx: window.goonk.player.vx,
        charge: window.goonk.player.mountCharge,
        attack: window.goonk.player.mountAttack,
      }))
      assert(Math.abs(state.vx) > 12)
      results.push({
        orientation,
        kind,
        tapCharge: true,
        jumpWhileCharging: kind === 'rambi',
        before,
        after,
        ...state,
      })
      await page.screenshot({
        path: out + `mechanics-${kind}-${orientation}.png`,
      })
    }
    // Click-only charge: one click prepares, the next releases. No timed short pulse.
    await page.getByRole('button', { name: 'Mode tactile' }).click()
    await page.getByRole('button', { name: 'Mode clic' }).waitFor()
    await page.getByRole('button', { name: 'Charge', exact: true }).click()
    await page.waitForFunction(() => window.goonk.player.mountCharge >= 0.65)
    assert.equal(
      await page
        .getByRole('button', { name: 'Lancer', exact: true })
        .getAttribute('aria-pressed'),
      'true',
    )
    await page.getByRole('button', { name: 'Lancer', exact: true }).click()
    await page.waitForFunction(() => window.goonk.player.mountCharged)
    results.push({ orientation, clickCharge: true })
    // Imported reef: actual mount event, then vertical steering from the screen.
    await page.evaluate(() => {
      const g = window.goonk
      g.start(3, true)
      g.enemies = []
      g.animals[0].state = 'idle'
      Object.assign(g.player, {
        x: g.animals[0].x,
        y: g.animals[0].y,
        invincible: 0,
      })
    })
    await page.waitForFunction(() => window.goonk.mount?.kind === 'enguarde')
    const y = await page.evaluate(() => window.goonk.player.y)
    await page
      .getByRole('button', { name: 'Nager vers le haut', exact: true })
      .click()
    await page.waitForFunction((y) => window.goonk.player.y > y + 0.8, y)
    await page
      .getByRole('button', { name: 'Nager vers le haut', exact: true })
      .click()
    results.push({ orientation, enguardeRises: true })
    await page.evaluate(() => {
      const g = window.goonk
      g.start(4)
      g.enemies = []
      g.animals[0].state = 'ridden'
      Object.assign(g.player, {
        mount: 0,
        x: 20,
        y: 5,
        vy: -8,
        grounded: false,
      })
    })
    await page.getByRole('button', { name: 'Planer', exact: true }).click()
    const flutterStart = await page.evaluate(() => window.goonk.player.y)
    await page.waitForTimeout(700)
    const flutter = await page.evaluate(() => ({
      y: window.goonk.player.y,
      vy: window.goonk.player.vy,
      wings: (() => {
        const a = []
        window.goonkScene.traverse((o) => {
          if (o.name === 'animal-wing') a.push(o.rotation.x)
        })
        return a
      })(),
    }))
    assert(
      flutter.y > flutterStart - 0.6,
      JSON.stringify({ flutter, flutterStart }),
    )
    assert(flutter.vy >= -0.66)
    assert(flutter.wings.some((x) => Math.abs(x) > 0.3))
    await page.screenshot({
      path: out + `mechanics-expresso-${orientation}.png`,
    })
    await page.getByRole('button', { name: 'Replier', exact: true }).click()
    await page.waitForFunction(() => window.goonk.player.vy < -2)
    results.push({ orientation, expressoFlutters: true })
    // Carry with one tap, release the finger, jump, then throw in mid-air.
    await page.evaluate(() => {
      const g = window.goonk
      g.start(6)
      g.enemies = []
      g.animals = []
      Object.assign(g.player, { x: 10, y: 0, grounded: true })
    })
    await page.getByRole('button', { name: 'Action', exact: true }).tap()
    await page.waitForFunction(() => window.goonk.player.carry >= 0)
    await page.getByRole('button', { name: 'Sauter', exact: true }).tap()
    await page.waitForFunction(() => window.goonk.player.y > 0.25)
    assert(await page.evaluate(() => window.goonk.player.carry >= 0))
    await page.getByRole('button', { name: 'Lancer', exact: true }).tap()
    await page.waitForFunction(
      () => window.goonk.player.carry < 0 && window.goonk.thrown.length > 0,
    )
    results.push({ orientation, carryJumpThrow: true })
    // Move into an already-open real jungle wall; entering cannot require passing through source terrain.
    await page.evaluate(() => {
      const g = window.goonk
      g.start(0, true)
      g.enemies = []
      const w = g.level.breakableWalls[2]
      g.brokenWalls.add(2)
      Object.assign(g.player, {
        x: w.x - 1.15,
        y: w.y,
        grounded: true,
        invincible: 0,
      })
    })
    await page
      .getByRole('button', { name: 'Aller à droite', exact: true })
      .click()
    await page
      .waitForFunction(() => !!window.goonk.bonus, null, { timeout: 4000 })
      .catch(async (error) => {
        console.log(
          await page.evaluate(() => ({
            phase: window.goonk.phase,
            player: window.goonk.player,
            broken: [...window.goonk.brokenWalls],
            bonus: window.goonk.bonus,
          })),
        )
        throw error
      })
    await page.getByRole('button', { name: 'Arrêter le déplacement' }).click()
    const bonus = await page.evaluate(() => ({
      name: window.goonk.level.name,
      x: window.goonk.player.x,
      terrain: window.goonk.level.originalTerrain,
    }))
    assert.equal(bonus.terrain, undefined)
    assert(bonus.x < 4)
    results.push({ orientation, bonusEntered: true })
    await page.waitForFunction(
      () => !!window.goonkScene.getObjectByName('sealed-bonus-entrance'),
    )
    await page
      .getByRole('button', { name: 'Aller à gauche', exact: true })
      .click()
    await page.waitForTimeout(800)
    const sealed = await page.evaluate(() => ({
      x: window.goonk.player.x,
      inside: !!window.goonk.bonus,
    }))
    assert(sealed.inside)
    assert(sealed.x >= 1.04)
    assert(sealed.x < 1.2)
    results.push({ orientation, bonusEntranceSealed: true, ...sealed })
    await page.getByRole('button', { name: 'Arrêter le déplacement' }).click()
    await page.screenshot({ path: out + `mechanics-bonus-${orientation}.png` })
    await page
      .getByRole('button', { name: 'Aller à droite', exact: true })
      .click()
    await page.waitForFunction(
      () => !window.goonk.bonus,
      {},
      { timeout: 15000 },
    )
    await page.getByRole('button', { name: 'Arrêter le déplacement' }).click()
    assert.equal(await page.evaluate(() => window.goonk.collectedBonus.size), 3)
    results.push({ orientation, bonusReturn: true })
    // Once the room has been exited, its outside doorway is plugged for this run.
    await page.waitForFunction(() => window.goonk.bonusDoorCooldown === 0)
    await page.evaluate(() => {
      const g = window.goonk,
        w = g.level.breakableWalls[g.level.bonusRooms[2].wallIndex]
      Object.assign(g.player, {
        x: w.x - 1.1,
        y: w.y,
        vx: 0,
        vy: 0,
        grounded: true,
      })
    })
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(300)
    const closed = await page.evaluate(() => {
      const g = window.goonk
      let door
      window.goonkScene.traverse((o) => {
        if (o.name === 'bonus-door' && o.userData.roomIndex === 2) door = o
      })
      return {
        completed: g.isBonusCompleted(2),
        inside: !!g.bonus,
        doorVisible: door?.visible,
        plug: door?.getObjectByName('completed-bonus-plug')?.visible,
        openSign: door?.getObjectByName('open-bonus-entrance')?.visible,
      }
    })
    assert(
      closed.completed &&
        !closed.inside &&
        closed.doorVisible &&
        closed.plug &&
        !closed.openSign,
      JSON.stringify(closed),
    )
    results.push({ orientation, bonusCannotReenter: true, ...closed })
    await page.screenshot({
      path: out + `mechanics-bonus-closed-${orientation}.png`,
    })
    await context.close()
  }
  assert.deepEqual(errors, [])
  writeFileSync(
    out + 'mechanics-regression.json',
    JSON.stringify({ results, errors }, null, 2),
  )
  console.log(JSON.stringify({ results, errors }))
} finally {
  await browser.close()
}
