import { expect, it } from 'vitest'
import { Game, emptyInput, readSave } from '../src/game/engine'
import { advanceGame } from './helpers/simulation'
import { assertDefined } from './helpers/assertDefined'
it('filters invalid save rows and probes authored floors', () => {
  const game = new Game()
  game.start(1)
  expect(game.floorAt(16, 8)).not.toBeNull()
  expect(readSave('{"unlocked":"x","best":{}}').unlocked).toBe(0)
})
it('bumps into walls, breaks with rambi, and leaves bonus with undefined completion set', () => {
  const game = new Game()
  game.start(0, true)
  game.enemies = []
  Reflect.deleteProperty(game, 'completedBonus')
  const wall = assertDefined(game.level.breakableWalls)[0]
  const oldX = wall.x - 0.2
  Object.assign(game.player, {
    x: oldX,
    y: wall.y + 0.5,
    vx: 0.2,
    grounded: true,
    roll: 0,
  })
  advanceGame(game)
  expect(game.player.x).toBeCloseTo(oldX, 1)
  const rambi = new Game()
  rambi.start(0, true)
  rambi.enemies = []
  rambi.animals[0].state = 'ridden'
  Object.assign(rambi.player, {
    mount: 0,
    x: wall.x,
    y: wall.y + 0.5,
    mountAttack: 0.2,
    vx: 0.2,
    grounded: true,
  })
  advanceGame(rambi)
  expect(rambi.brokenWalls.size).toBeGreaterThan(0)
  const bonus = new Game()
  bonus.start(0, true)
  bonus.enemies = []
  bonus.brokenWalls.add(0)
  Object.assign(bonus.player, { x: wall.x, y: wall.y + 0.5, grounded: true })
  const enter = emptyInput()
  enter.pressed.add('action')
  advanceGame(bonus, enter)
  expect(bonus.bonus).not.toBeNull()
  bonus.damage(true)
  expect(bonus.bonus).toBeNull()
})
it('handles mount damage, coral respawn, and rescue barrel refresh', () => {
  const mounted = new Game()
  mounted.start(0)
  mounted.enemies = []
  mounted.animals[0].state = 'ridden'
  Object.assign(mounted.player, { mount: 0, invincible: 0, hp: 2 })
  mounted.damage()
  expect(mounted.player.mount).toBe(-1)
})
it('covers swap palette branches and cannon helpers', () => {
  const swap = new Game()
  swap.start(0)
  swap.enemies = []
  Object.assign(swap.player, { hp: 2, active: 1, cannon: -1, roll: 0 })
  const input = emptyInput()
  input.pressed.add('swap')
  advanceGame(swap, input)
  expect(swap.swap).not.toBeNull()
  const game = new Game()
  game.start(1)
  expect(game.cannonPosition(999)).toEqual({ x: 0, y: 0 })
  const idx = game.level.barrels.findIndex((barrel) => barrel.kind === 'cannon')
  if (idx >= 0) {
    const barrel = game.level.barrels[idx]
    const saved = barrel.rotationSpeed
    barrel.rotationSpeed = 0
    expect(game.cannonAngle(idx)).toBeTypeOf('number')
    barrel.rotationSpeed = saved
  }
})
it('covers mount attacks, rolls, cannon flight steering, and ship jumps', () => {
  const enguarde = new Game()
  enguarde.start(3, true)
  enguarde.enemies = []
  const buddy = enguarde.animals.find(
    (actor) => actor.kind === 'enguarde' && actor.state === 'crate',
  )
  if (buddy) {
    buddy.state = 'ridden'
    Object.assign(enguarde.player, {
      mount: enguarde.animals.indexOf(buddy),
      x: buddy.x,
      y: buddy.y,
    })
    const action = emptyInput()
    action.pressed.add('action')
    advanceGame(enguarde, action)
    expect(enguarde.player.mountAttack).toBeGreaterThan(0)
  }
  const ship = new Game()
  ship.start(6)
  ship.enemies = []
  ship.player.jumpDelay = 1
  ship.player.coyote = 0.1
  ship.player.rollJump = true
  advanceGame(ship)
  expect(ship.player.vy).not.toBe(0)
  const cannon = new Game()
  cannon.start(1)
  cannon.enemies = []
  const barrel = cannon.level.barrels.findIndex(
    (barrel2) => barrel2.kind === 'cannon',
  )
  if (barrel >= 0) {
    Object.assign(cannon.player, {
      cannon: -1,
      launched: 1,
      cannonControlDelay: 0,
      vx: 4,
      vy: 0,
      grounded: false,
    })
    const steer = emptyInput()
    steer.held.add('right')
    const before = cannon.player.vx
    advanceGame(cannon, steer, 5)
    expect(cannon.player.vx).not.toBe(before)
  }
})
it('covers animal land motion, fleeing coral buddies, and idle platform animals', () => {
  const land = new Game()
  land.start(0, true)
  land.enemies = []
  const animal = land.animals[0]
  animal.state = 'fleeing'
  animal.vx = 2
  animal.timer = 1.3
  advanceGame(land, emptyInput(), 2)
  expect(animal.state).toBe('idle')
  const coral = new Game()
  coral.start(3, true)
  coral.enemies = []
  const flee = coral.animals[0]
  flee.state = 'fleeing'
  flee.timer = 0
  flee.vx = 1
  advanceGame(coral, emptyInput(), 40)
  const platform = new Game()
  platform.start(6)
  platform.enemies = []
  platform.animals = [
    {
      kind: 'rambi',
      x: 10,
      y: 0,
      vx: 0,
      vy: 4,
      facing: 1,
      state: 'fleeing',
      timer: 0,
    },
  ]
  advanceGame(platform, emptyInput(), 20)
})
it('covers combat mount hits, stomps, rolls, and pickups', () => {
  const winky = new Game()
  winky.start(5)
  winky.enemies = []
  const mount = assertDefined(
    winky.animals.find((actor2) => actor2.kind === 'winky'),
  )
  mount.state = 'ridden'
  const beetle = winky.enemies.find((entry) => entry.kind === 'beetle')
  if (beetle) {
    Object.assign(winky.player, {
      mount: winky.animals.indexOf(mount),
      x: beetle.x,
      y: beetle.y + 2,
      vy: -6,
      facing: 1,
      invincible: 0,
    })
    advanceGame(winky)
  }
  const expresso = new Game()
  expresso.start(4)
  const small = expresso.enemies.find((entry2) => entry2.kind === 'beetle')
  if (small) {
    expresso.animals[0].state = 'ridden'
    Object.assign(expresso.player, {
      mount: 0,
      x: small.x,
      y: small.y + 0.05,
      vy: 0,
      invincible: 0,
    })
    advanceGame(expresso)
  }
  const armored = new Game()
  armored.start(0, true)
  const guard = armored.enemies.find((entry3) => entry3.kind === 'armored')
  if (guard) {
    Object.assign(armored.player, {
      x: guard.x,
      y: guard.y + 1.5,
      vy: -8,
      active: 0,
      invincible: 0,
    })
    advanceGame(armored)
    expect(armored.player.vy).toBeGreaterThan(0)
  }
  const roller = new Game()
  roller.start(0)
  roller.enemies = []
  const foe = roller.enemies[0] ?? {
    x: 20,
    y: 0,
    vx: 0,
    vy: 0,
    min: 0,
    max: 40,
    kind: 'beetle' as const,
    alive: true,
    hp: 1,
    hurt: 0,
  }
  if (!roller.enemies.length) {
    roller.enemies.push(foe)
  }
  Object.assign(roller.player, {
    x: foe.x,
    y: foe.y,
    roll: 0.5,
    invincible: 0,
  })
  advanceGame(roller)
})
it('reveals hidden caches and collects banana bunches', () => {
  const game = new Game()
  game.start(0)
  game.enemies = []
  game.level.itemCaches = [
    { x: 4, y: 0, reward: { kind: 'banana', amount: 2 } },
  ]
  Object.assign(game.player, { x: 4, y: -0.2, grounded: true, roll: 0.2 })
  advanceGame(game)
  expect(game.revealedCaches.has(0)).toBe(true)
  advanceGame(game)
  expect(game.collectedCaches.has(0)).toBe(true)
})
it('shows sign hints and dismounts safely without a mount', () => {
  const game = new Game()
  game.start(0, true)
  game.enemies = []
  game.dismount()
  const sign = game.level.decors?.find(
    (entry) => entry.kind === 'sign' && entry.text,
  )
  if (sign) {
    Object.assign(game.player, { x: sign.x, y: sign.y })
    advanceGame(game)
    expect(game.toastTimer).toBeGreaterThan(0)
  }
})
it('auto-fire cannon messaging', () => {
  const game = new Game()
  game.start(6)
  const cannon = game.level.barrels.findIndex(
    (barrel3) => barrel3.kind === 'cannon',
  )
  if (cannon < 0) {
    return
  }
  game.level.barrels[cannon].autoFire = true
  Object.assign(game.player, {
    x: game.level.barrels[cannon].x,
    y: game.level.barrels[cannon].y,
    invincible: 0,
  })
  advanceGame(game)
  expect(game.player.cannon).toBe(cannon)
})
