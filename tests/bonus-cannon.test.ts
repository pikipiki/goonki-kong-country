import { describe, expect, it } from 'vitest'
import { Game, emptyInput, STEP } from '../src/game/engine'
import { ROM_JUNGLE } from '../src/game/originalJungle'
import bonusWalls from '../reference/jungle-bonus-walls.json'
describe('jungle bonus room metadata', () => {
  it('exposes four jungle bonus chambers tied to breakable walls', () => {
    expect(ROM_JUNGLE.bonusRooms).toHaveLength(4)
    expect(
      ROM_JUNGLE.bonusRooms?.every((room) => room.pickups.length >= 3),
    ).toBe(true)
    expect(ROM_JUNGLE.bonusRooms?.[0].romRam1375).toBe(92)
    expect(bonusWalls.breakableWalls[0].entranceLevelId).toBe(64)
    expect(bonusWalls.breakableWalls[1].entranceLevelId).toBe(45)
  })
})
describe('bonus room entry and collection', () => {
  it('enters a separate playable bonus, collects loot and returns without resetting the stage', () => {
    const game = new Game()
    game.start(0, true)
    game.enemies = []
    const room = game.level.bonusRooms?.[2]
    const wall = game.level.breakableWalls?.[room?.wallIndex ?? 0]
    expect(room).toBeDefined()
    expect(wall).toBeDefined()
    const animal = game.animals[0]
    animal.state = 'ridden'
    Object.assign(game.player, {
      x: wall.x - 1.25,
      y: wall.y,
      vx: 0,
      vy: 0,
      grounded: true,
      mount: 0,
    })
    game.collected.add(0)
    game.letters.add(1)
    const savedCollected = game.collected
    const savedLetters = game.letters
    const revision = game.sceneRevision
    const strike = emptyInput()
    strike.pressed.add('action')
    strike.held.add('right')
    game.update(strike)
    expect(game.brokenWalls.has(room.wallIndex)).toBe(true)
    expect(game.bonus?.index).toBe(2)
    expect(game.level.originalTerrain).toBeUndefined()
    expect(game.sceneRevision).toBeGreaterThan(revision)
    expect(game.player.mount).toBe(-1)
    const before = game.bananas
    const walk = emptyInput()
    walk.held.add('right')
    walk.held.add('run')
    for (let frame = 0; frame < 220 && game.bonus; frame++) {
      game.update(walk)
    }
    expect(game.bonus).toBeNull()
    expect(game.bananas).toBeGreaterThan(before)
    expect(game.collectedBonus.size).toBe(3)
    expect(game.collected).toBe(savedCollected)
    expect(game.letters).toBe(savedLetters)
    expect(game.player.mount).toBe(0)
    expect(game.brokenWalls.has(room.wallIndex)).toBe(true)
    expect(game.player.x).toBeLessThan(wall.x)
    expect(game.phase).toBe('playing')
  })
})
describe('bonus room entrance seals', () => {
  it('seals the entrance behind the player while leaving the right exit usable', () => {
    const game = new Game()
    game.start(0, true)
    game.enemies = []
    const room = game.level.bonusRooms?.[2]
    const wall = game.level.breakableWalls?.[room?.wallIndex ?? 0]
    expect(room).toBeDefined()
    expect(wall).toBeDefined()
    game.brokenWalls.add(room.wallIndex)
    Object.assign(game.player, { x: wall.x - 1.1, y: wall.y, grounded: true })
    const enter = emptyInput()
    enter.pressed.add('up')
    game.update(enter)
    expect(game.bonus).not.toBeNull()
    const left = emptyInput()
    left.held.add('left')
    left.held.add('run')
    for (let frame = 0; frame < 90; frame++) {
      game.update(left)
    }
    expect(game.bonus).not.toBeNull()
    expect(game.player.x).toBeGreaterThanOrEqual(1.04)
    const right = emptyInput()
    right.held.add('right')
    right.held.add('run')
    for (let frame = 0; frame < 240 && game.bonus; frame++) {
      game.update(right)
    }
    expect(game.bonus).toBeNull()
    expect(game.phase).toBe('playing')
  })
})
describe('bonus room completion flags', () => {
  it('marks a visited bonus completed without collecting loot', () => {
    const game = new Game()
    game.start(0, true)
    game.enemies = []
    game.animals = []
    const index = 2
    const room = game.level.bonusRooms?.[index]
    const wall = game.level.breakableWalls?.[room?.wallIndex ?? 0]
    expect(room).toBeDefined()
    expect(wall).toBeDefined()
    game.brokenWalls.add(room.wallIndex)
    Object.assign(game.player, {
      x: wall.x - 1.1,
      y: wall.y,
      grounded: true,
    })
    const enter = emptyInput()
    enter.pressed.add('up')
    game.update(enter)
    expect(game.bonus?.index).toBe(index)
    game.leaveBonus()
    expect(game.collectedBonus.size).toBe(0)
    expect(game.isBonusCompleted(index)).toBe(true)
    game.start(0, true)
    expect(game.isBonusCompleted(index)).toBe(false)
  })
  it('keeps a completed bonus sealed against re-entry tricks', () => {
    const game = new Game()
    game.start(0, true)
    game.enemies = []
    game.animals = []
    const index = 2
    const room = game.level.bonusRooms?.[index]
    const wall = game.level.breakableWalls?.[room?.wallIndex ?? 0]
    expect(room).toBeDefined()
    expect(wall).toBeDefined()
    const approach = () => {
      Object.assign(game.player, {
        x: wall.x - 1.1,
        y: wall.y,
        grounded: true,
      })
      const input = emptyInput()
      input.pressed.add('up')
      game.update(input)
    }
    game.brokenWalls.add(room.wallIndex)
    approach()
    game.leaveBonus()
    game.bonusDoorCooldown = 0
    approach()
    expect(game.bonus).toBeNull()
    game.player.invincible = 0
    game.damage(true)
    game.bonusDoorCooldown = 0
    approach()
    expect(game.bonus).toBeNull()
    game.player.roll = 0.4
    game.thrown.push({ x: wall.x, y: wall.y + 1, vx: 1, vy: 0, active: true })
    approach()
    expect(game.bonus).toBeNull()
    expect(game.isBonusCompleted(1)).toBe(false)
  })
  it('recognizes rewards from a completed visit in a hot-reloaded older game', () => {
    const game = new Game()
    game.start(0, true)
    game.collectedBonus.add('2-0')
    expect(game.isBonusCompleted(2)).toBe(true)
    expect(game.isBonusCompleted(1)).toBe(false)
  })
})
describe('cannon and Necky fidelity', () => {
  it('exposes ROM ExitDoor finish volume on jungle', () => {
    expect(ROM_JUNGLE.finishZone).toBeDefined()
    const zone = ROM_JUNGLE.finishZone
    expect(zone?.x).toBeCloseTo(5296 / 32, 3)
  })
  it('NutThrowingNecky throws nuts toward the player', () => {
    const game = new Game()
    game.start(0, true)
    const necky = game.enemies.find((entry) => entry.throwsNuts)
    expect(necky).toBeDefined()
    if (!necky) {
      return
    }
    expect(necky.throwsNuts).toBe(true)
    let sawShot = false
    for (let frame = 0; frame < 120; frame++) {
      game.player.x = necky.x + 10
      game.player.y = necky.y - 1.4
      game.player.vy = 0
      game.player.grounded = true
      necky.shootCooldown = Math.min(necky.shootCooldown, 0.05)
      game.update(emptyInput())
      if (game.enemyShots.length > 0) {
        sawShot = true
      }
    }
    expect(sawShot).toBe(true)
  })
  it('keeps Necky-family enemies on a fixed column', () => {
    const game = new Game()
    game.start(0, true)
    const necky = game.enemies.find((entry) => entry.pattern === 'necky')
    expect(necky).toBeDefined()
    if (!necky) {
      return
    }
    const startX = necky.x
    const input = emptyInput()
    input.held.add('right')
    for (let frame = 0; frame < 90; frame++) {
      game.update(input)
    }
    expect(necky.x).toBeCloseTo(startX, 5)
  })
  it('counts cannon gravity and control delays in simulation steps', () => {
    const game = new Game()
    game.start(0, true)
    const index = game.level.barrels.findIndex(
      (barrel) => barrel.kind === 'cannon',
    )
    expect(index).toBeGreaterThanOrEqual(0)
    const barrel = game.level.barrels[index]
    game.player.x = barrel.x
    game.player.y = barrel.y
    game.update(emptyInput())
    expect(game.player.cannon).toBe(index)
    const launch = emptyInput()
    launch.pressed.add('jump')
    game.update(launch)
    const gravityDelay = game.player.cannonGravityDelay
    const controlDelay = game.player.cannonControlDelay
    expect(gravityDelay).toBe(barrel.cannonGravityDelay ?? 16)
    expect(controlDelay).toBe(barrel.cannonControlDelay ?? 16)
    game.update(emptyInput())
    expect(game.player.cannonGravityDelay).toBe(Math.max(0, gravityDelay - 1))
    expect(game.player.cannonControlDelay).toBe(Math.max(0, controlDelay - 1))
    expect(STEP).toBeCloseTo(1 / 60, 8)
  })
})
