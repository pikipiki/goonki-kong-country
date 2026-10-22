import { expect, it } from 'vitest'
import { Game, emptyInput } from '../src/game/engine'
import { bossArenaBounds } from '../src/game/bossArena'
import { assertDefined } from './helpers/assertDefined'
import { pick } from '../src/utils/pick'

it('uses coral terrain in floorAt and nudges spawn-blocking enemies', () => {
  const game = new Game()
  game.start(3, true)
  expect(game.level.originalTerrain).toBe('coral')
  game.floorAt(10, 20)
  const startX = assertDefined(game.level.start).x
  expect(game.enemies[0].x).toBeGreaterThan(startX + 3)
})

it('uses platform stacking in floorAt on authored levels', () => {
  const game = new Game()
  game.start(1)
  game.enemies = []
  expect(game.floorAt(16, 8)).not.toBeNull()
})

it('bumps the player off breakable walls without a roll', () => {
  const game = new Game()
  game.start(0, true)
  game.enemies = []
  const wall = assertDefined(game.level.breakableWalls)[0]
  const oldX = wall.x + 0.35
  Object.assign(game.player, {
    x: oldX,
    y: wall.y + 0.5,
    roll: 0,
    vx: -0.35,
    grounded: true,
  })
  game.update(emptyInput())
  expect(game.player.x).toBeCloseTo(oldX, 2)
  expect(game.player.vx).toBe(0)
  expect(game.brokenWalls.size).toBe(0)
})

it('breaks walls with thrown barrels', () => {
  const game = new Game()
  game.start(0, true)
  game.enemies = []
  const wallIndex = 1
  const wall = assertDefined(game.level.breakableWalls)[wallIndex]
  game.thrown.push({ x: wall.x, y: wall.y + 0.5, vx: 0, vy: 0, active: true })
  game.update(emptyInput())
  expect(game.brokenWalls.has(wallIndex)).toBe(true)
})

it('collects letter and balloon item caches', () => {
  for (const reward of [
    { kind: 'letter' as const, letter: 'G' },
    { kind: 'balloon' as const, amount: 1 },
  ] as const) {
    const game = new Game()
    game.start(0, true)
    game.level.itemCaches = [{ x: 5, y: 0, reward }]
    game.revealedCaches.add(0)
    const livesBefore = game.lives
    Object.assign(game.player, { x: 5, y: -0.2, grounded: true })
    game.update(emptyInput())
    expect(game.collectedCaches.has(0)).toBe(true)
    if (reward.kind === 'balloon') {
      expect(game.lives).toBe(livesBefore)
    }
  }
})

it('places a carried barrel on the ground instead of throwing', () => {
  const game = new Game()
  game.start(6)
  game.enemies = []
  game.animals = []
  game.player.x = 10
  game.player.carry = 1
  game.player.grounded = true
  const input = emptyInput()
  input.released.add('action')
  input.held.add('down')
  game.update(input)
  expect(game.player.carry).toBe(-1)
  expect(game.thrown).toHaveLength(0)
})

it('collects balloon pickups and grants a full-word life bonus', () => {
  const balloonGame = new Game()
  balloonGame.start(0)
  balloonGame.enemies = []
  const balloon = assertDefined(
    balloonGame.level.pickups.find((pickup) => pickup.kind === 'balloon'),
  )
  Object.assign(balloonGame.player, {
    x: balloon.x,
    y: balloon.y - 1,
    grounded: true,
  })
  const before = balloonGame.lives
  balloonGame.update(emptyInput())
  expect(balloonGame.lives).toBeGreaterThan(before)

  const wordGame = new Game()
  wordGame.start(0)
  wordGame.enemies = []
  const letterIndexes = wordGame.level.pickups
    .map((pickup, index) => pick(pickup.kind === 'letter', index, -1))
    .filter((index) => index >= 0)
  const last = assertDefined(letterIndexes.at(-1))
  letterIndexes.slice(0, -1).forEach((index) => {
    wordGame.collected.add(index)
    wordGame.letters.add(index)
  })
  const lives = wordGame.lives
  Object.assign(wordGame.player, {
    x: wordGame.level.pickups[last].x,
    y: wordGame.level.pickups[last].y - 1,
    grounded: true,
  })
  wordGame.update(emptyInput())
  expect(wordGame.lives).toBeGreaterThan(lives)
})

it('blocks horizontal movement into tall platform sides', () => {
  const game = new Game()
  game.start(0)
  game.enemies = []
  const platform = assertDefined(
    game.level.platforms.find((pickup) => pickup.h > 2),
  )
  const left = platform.x - platform.w / 2
  Object.assign(game.player, {
    x: left - 0.7,
    y: -1,
    vy: 0,
    vx: 0,
    grounded: false,
  })
  const input = emptyInput()
  input.held.add('right')
  game.update(input)
  expect(game.player.x).toBeLessThanOrEqual(left - 0.3 + 0.05)
})

it('resolves fleeing buddies, coral crates, nut collisions, and boss barrel bounds', () => {
  const coral = new Game()
  coral.start(3, true)
  coral.enemies = []
  const buddy = coral.animals[0]
  buddy.state = 'fleeing'
  buddy.timer = 2
  buddy.x = coral.player.x
  buddy.y = coral.player.y
  coral.update(emptyInput())

  const crate = new Game()
  crate.start(3, true)
  crate.enemies = []
  const enguarde = assertDefined(
    crate.animals.find((animal) => animal.state === 'crate'),
  )
  Object.assign(crate.player, {
    x: enguarde.x,
    y: enguarde.y + 1,
    roll: 0.3,
    vy: -1,
  })
  crate.update(emptyInput())

  const necky = new Game()
  necky.start(0, true)
  const shooter = assertDefined(necky.enemies.find((enemy) => enemy.throwsNuts))
  shooter.shootCooldown = 0
  Object.assign(necky.player, {
    x: shooter.x + 3,
    y: shooter.y,
    invincible: 0,
  })
  const barrel = necky.thrown[0] ?? {
    x: shooter.x + 1,
    y: shooter.y,
    vx: 0,
    vy: 0,
    active: true,
  }
  if (!necky.thrown.length) {
    necky.thrown.push(barrel)
  }
  necky.enemyShots.push({
    x: barrel.x,
    y: barrel.y,
    vx: 0,
    vy: 0,
    active: true,
  })
  necky.update(emptyInput())
  expect(barrel.active).toBe(false)

  const nutHit = new Game()
  nutHit.start(0, true)
  nutHit.enemyShots.push({
    x: nutHit.player.x,
    y: nutHit.player.y + 0.4,
    vx: 0,
    vy: 0,
    active: true,
  })
  nutHit.update(emptyInput())
  expect(nutHit.player.invincible).toBeGreaterThan(0)

  const boss = new Game()
  boss.start(6)
  boss.player.carry = 1
  const bounds = bossArenaBounds(boss.level.length)
  boss.thrown.push({ x: bounds.right + 2, y: 0, vx: 0, vy: 0, active: true })
  boss.update(emptyInput())
  expect(boss.thrown.every((barrel) => !barrel.active)).toBe(true)
})
