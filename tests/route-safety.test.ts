import { expect, it } from 'vitest'
import {
  normalizeLandEnemyFeet,
  mineBeePatrolBounds,
} from '../src/game/routeSafety'
import { terrainSolidSpans } from '../src/game/terrainSolids'
import { ROM_REVERB } from '../src/game/originalReverb'
import { ROM_MINE_CART } from '../src/game/originalMineCart'
import { ENEMY_DESIGNS } from '../src/game/enemies'
import { cannonMomentumDuration } from '../src/game/routeSafety'
import { Game, emptyInput } from '../src/game/engine'
import playerSource from '../reference/player-states.json'
import { assertDefined } from './helpers/assertDefined'
import { pick } from '../src/utils/pick'

it('places all canyon land enemies above an exposed floor with body headroom', () => {
  let placed = 0
  for (const enemy of ROM_REVERB.enemies.filter(
    (entry) => entry.kind !== 'bee',
  )) {
    const design = ENEMY_DESIGNS[enemy.kind],
      body = { radius: design.width * 0.65, height: design.height }
    const posY = normalizeLandEnemyFeet('cave', enemy.x, enemy.y, body)
    expect(posY, `no support at ${String(enemy.x)}`).not.toBeNull()
    for (const posX of [
      enemy.x - body.radius,
      enemy.x,
      enemy.x + body.radius,
    ]) {
      expect(
        terrainSolidSpans('cave', posX).some(
          (state) =>
            assertDefined(posY) + body.height > state.bottom + 0.015 &&
            assertDefined(posY) < state.top - 0.015,
        ),
        `embedded at ${String(enemy.x)}`,
      ).toBe(false)
    }
    placed++
  }
  expect(placed).toBeGreaterThan(20)
  const entry2 = ROM_REVERB.enemies[0],
    body = { radius: 0.4, height: 1.2 }
  const floor = assertDefined(
    normalizeLandEnemyFeet('cave', entry2.x, entry2.y, body),
  )
  expect(normalizeLandEnemyFeet('cave', entry2.x, floor - 0.6, body)).toBe(
    floor,
  )
})
it('keeps imported mine Zingers near their anchors and in encounter order', () => {
  const bees = ROM_MINE_CART.enemies.filter(
    (entry3) => entry3.kind === 'bee' && entry3.pattern !== 'necky',
  )
  for (const bee of bees) {
    const bounds = mineBeePatrolBounds(
      bee,
      ROM_MINE_CART.enemies,
      ROM_MINE_CART.length,
    )
    expect(bounds.min).toBeLessThanOrEqual(bee.x)
    expect(bounds.max).toBeGreaterThanOrEqual(bee.x)
    expect(bounds.max - bounds.min).toBeLessThanOrEqual(1.201)
    for (const other of bees.filter((entry4) => entry4.x > bee.x)) {
      expect(bounds.max).toBeLessThan(
        mineBeePatrolBounds(other, ROM_MINE_CART.enemies, ROM_MINE_CART.length)
          .min,
      )
    }
  }
})

it('keeps source cannon vertical velocities in the same positive-up frame as jumps', () => {
  const source = assertDefined(
    playerSource.cannonBaseTemplateVectors.find(
      (value) => value.quantizedAngleRaw === 0x8000,
    ),
  )
  expect(source.velocityYRaw).toBeGreaterThan(0)
  const game = new Game()
  game.start(1, true)
  game.enemies = []
  game.animals = []
  const barrel = game.level.barrels[1]
  Object.assign(game.player, {
    x: barrel.x,
    y: barrel.y,
    cannon: 1,
    grounded: false,
  })
  const input = emptyInput()
  input.pressed.add('action')
  game.update(input)
  expect(game.player.vy).toBeGreaterThan(15)
  expect(game.player.y).toBeGreaterThan(barrel.y)
})

for (const index of [9, 36]) {
  it(`lands safely after the real horizontal canyon cannon ${String(index)} without early braking`, () => {
    const game2 = new Game()
    game2.start(1, true)
    game2.enemies = []
    game2.animals = []
    const barrel2 = game2.level.barrels[index]
    Object.assign(game2.player, {
      x: barrel2.x,
      y: barrel2.y,
      cannon: index,
      grounded: false,
      invincible: 100,
    })
    const input = emptyInput()
    input.pressed.add('action')
    game2.update(input)
    expect(game2.player.launched).toBeGreaterThanOrEqual(
      cannonMomentumDuration(barrel2) - 1 / 60,
    )
    let completed = false
    for (let frame = 0; frame < 330; frame++) {
      game2.update(emptyInput())
      expect(game2.lives).toBe(5)
      if (game2.player.cannon >= 0 || game2.player.grounded) {
        completed = true
        break
      }
    }
    expect(completed).toBe(true)
    expect(game2.player.x).toBeGreaterThan(barrel2.x + 10)
  })
}

it('chains the four actual alternating canyon cannons at x276..292.75', () => {
  const game3 = new Game()
  game3.start(1, true)
  game3.enemies = []
  game3.animals = []
  const barrel3 = game3.level.barrels[32]
  Object.assign(game3.player, {
    x: barrel3.x,
    y: barrel3.y,
    cannon: 32,
    grounded: false,
    invincible: 100,
  })
  const captures = [32]
  for (let frame = 0; frame < 130 && captures.at(-1) !== 35; frame++) {
    const input = emptyInput()
    if (game3.player.cannon >= 0) {
      input.pressed.add('action')
    }
    game3.update(input)
    if (game3.player.cannon >= 0 && captures.at(-1) !== game3.player.cannon) {
      captures.push(game3.player.cannon)
    }
    expect(game3.lives).toBe(5)
  }
  expect(captures).toEqual([32, 33, 34, 35])
})

for (const [phase, lead, heldFrames] of [
  [0, 6, 3],
  [Math.PI / 4, 3.5, 18],
  [Math.PI / 2, 3, 9],
  [(Math.PI * 3) / 4, 3.5, 27],
]) {
  it(`permits one jump past the real stacked mine Zingers at hover phase ${phase.toFixed(2)}`, () => {
    const game4 = new Game()
    game4.start(2, true)
    const anchor = 297.5
    game4.enemies = game4.enemies.filter(
      (entry5) =>
        entry5.kind === 'bee' &&
        entry5.pattern !== 'necky' &&
        Math.abs(entry5.x - anchor) < 0.01,
    )
    expect(game4.enemies).toHaveLength(2)
    game4.animals = []
    game4.level.barrels.forEach((_, index) => game4.usedBarrels.add(index))
    const posX2 = anchor - 8,
      posY2 = normalizeLandEnemyFeet(
        'mineCart',
        posX2,
        game4.enemies[0].originY - 1.5,
        {
          radius: 0.3,
          height: 1.35,
        },
      )
    expect(posY2).not.toBeNull()
    Object.assign(game4.player, {
      x: posX2,
      y: posY2,
      grounded: true,
      vx: 8.5,
      vy: 0,
      coyote: 0.1,
      invincible: 0,
    })
    for (const entry6 of game4.enemies) {
      entry6.timer = phase
    }
    let jumpAt = -1
    for (let frame = 0; frame < 150 && game4.player.x < anchor + 9; frame++) {
      const input = emptyInput()
      if (jumpAt < 0 && game4.player.x >= anchor - lead) {
        jumpAt = frame
        input.pressed.add('jump')
      }
      if (jumpAt >= 0 && frame - jumpAt < heldFrames) {
        input.held.add('jump')
      }
      game4.update(input)
      expect(game4.lives).toBe(5)
      expect(game4.player.hp).toBe(2)
    }
    expect(game4.player.x).toBeGreaterThanOrEqual(anchor + 9)
  })
}

it('lets the cart queue its next jump shortly before landing', () => {
  const game5 = new Game()
  game5.start(2)
  game5.enemies = []
  game5.animals = []
  Object.assign(game5.player, { x: 10, y: 1.2, vy: -3, grounded: false })
  let jumps = 0
  game5.onEvent = (name) => {
    if (name === 'jump') {
      jumps++
    }
  }
  const input = emptyInput()
  input.pressed.add('jump')
  game5.update(input)
  for (let count = 0; count < 24 && !jumps; count++) {
    game5.update(emptyInput())
  }
  expect(jumps).toBe(1)
  expect(game5.player.vy).toBeGreaterThan(0)
})
it('allows stomping a Necky bird while keeping real Zingers dangerous', () => {
  for (const pattern of ['necky', undefined] as const) {
    const game6 = new Game()
    game6.start(2, true)
    const bird = assertDefined(
      game6.enemies.find((entry7) => entry7.pattern === 'necky'),
    )
    bird.pattern = pattern
    bird.vx = 0
    game6.enemies = [bird]
    game6.animals = []
    Object.assign(game6.player, {
      x: bird.x,
      y: bird.y + ENEMY_DESIGNS.bee.height + 0.01,
      vy: -8,
      grounded: false,
    })
    game6.update(emptyInput())
    expect(bird.alive).toBe(pattern !== 'necky')
    expect(game6.player.hp).toBe(pick(pattern === 'necky', 2, 1))
  }
})
