import { expect, it } from 'vitest'
import {
  mineEncounterClearance,
  normalizeLandEnemyFeet,
} from '../src/game/routeSafety'
import { ROM_MINE_CART } from '../src/game/originalMineCart'
import { Game, emptyInput } from '../src/game/engine'
import { assertDefined } from './helpers/assertDefined'

function runCloseMinePair(
  anchor: number,
  distance: number,
  placement: number,
  sign: number,
  lead: number,
  held: number,
) {
  const game = new Game()
  game.start(2, true)
  game.enemies = game.enemies.filter(
    (entry) =>
      entry.kind === 'bee' &&
      entry.pattern !== 'necky' &&
      entry.x >= anchor - 0.01 &&
      entry.x <= anchor + 6.5,
  )
  const goal = Math.max(...game.enemies.map((entry) => entry.x)) + 1.6
  const source = assertDefined(
    game.level.enemies.find((entry) => Math.abs(entry.x - anchor) < 0.01),
  )
  const posX = anchor - distance
  const posY = normalizeLandEnemyFeet('mineCart', posX, source.y - 1.5, {
    radius: 0.3,
    height: 1.35,
  })
  if (posY === null) {
    return false
  }
  Object.assign(game.player, {
    x: posX,
    y: posY,
    grounded: true,
    vx: 8.5,
    vy: 0,
    coyote: 0.1,
    invincible: 0,
  })
  game.animals = []
  game.level.barrels.forEach((_, index) => game.usedBarrels.add(index))
  for (const entry of game.enemies) {
    entry.x = entry.min + (entry.max - entry.min) * placement
    entry.vx = Math.abs(entry.vx) * sign
    entry.timer = 2.356
  }
  let jumpAt = -1
  for (let frame = 0; frame < 180 && game.player.x < goal; frame++) {
    const input = emptyInput()
    if (lead >= 0 && jumpAt < 0 && game.player.x >= game.enemies[0].x - lead) {
      jumpAt = frame
      input.pressed.add('jump')
    }
    if (jumpAt >= 0 && frame - jumpAt < held) {
      input.held.add('jump')
    }
    game.update(input)
    if (game.lives !== 5 || game.player.hp !== 2) {
      return false
    }
  }
  return game.player.x >= goal
}

it('adapts close mine formations on runtime copies and keeps a real low jump obstacle', () => {
  const source = JSON.stringify(ROM_MINE_CART.enemies)
  const adapted = mineEncounterClearance(ROM_MINE_CART.enemies)
  expect(JSON.stringify(ROM_MINE_CART.enemies)).toBe(source)
  expect(adapted).toHaveLength(ROM_MINE_CART.enemies.length)
  const changed = adapted.filter(
    (entry, index) => entry.y !== ROM_MINE_CART.enemies[index].y,
  )
  expect(changed.map((entry) => entry.x)).toEqual([
    114.90625, 269.34375, 272.84375, 372.84375, 377.46875, 381.96875, 412.90625,
  ])
  expect(changed.every((entry) => entry.hoverAmplitude === 0)).toBe(true)
  for (const anchor of [269.34375, 372.84375]) {
    const lower = assertDefined(adapted.find((entry) => entry.x === anchor))
    const original = assertDefined(
      ROM_MINE_CART.enemies.find((entry) => entry.x === anchor),
    )
    expect(original.y - lower.y).toBeLessThanOrEqual(0.401)
    expect(
      runCloseMinePair(anchor, anchor === 269.34375 ? 8 : 7, 0.5, 1, -1, 0),
    ).toBe(false)
  }
  expect(
    adapted.filter((entry) => entry.x === 297.5).map((entry) => entry.y),
  ).toEqual(
    ROM_MINE_CART.enemies
      .filter((entry) => entry.x === 297.5)
      .map((entry) => entry.y),
  )
})

for (const [anchor, distance] of [
  [269.34375, 8],
  [372.84375, 7],
  [377.46875, 8],
]) {
  it(`leaves a playable jump corridor near mine X=${String(anchor)} at both patrol directions and extremes`, () => {
    for (const placement of [0, 0.5, 1]) {
      for (const sign of [-1, 1]) {
        let safe = false
        for (let lead = 0.5; lead <= 6 && !safe; lead += 0.25) {
          for (let held = 3; held <= 45 && !safe; held += 3) {
            safe = runCloseMinePair(
              anchor,
              distance,
              placement,
              sign,
              lead,
              held,
            )
          }
        }
        expect(
          safe,
          `placement=${String(placement)}, direction=${String(sign)}`,
        ).toBe(true)
      }
    }
  })
}
