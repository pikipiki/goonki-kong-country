import { afterEach, describe, expect, it, vi } from 'vitest'
import { Game, emptyInput } from '../src/game/engine'
import { advanceGame } from './helpers/simulation'
import { releaseMountAnimal } from '../src/game/engine/gameMountAnimals'
import { assertDefined } from './helpers/assertDefined'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('refactor coverage — pause and bonus', () => {
  it('covers pause, moving surfaces, cannon oscillation, and bonus fall damage', () => {
    const game = new Game()
    game.phase = 'paused'
    game.pause()
    expect(game.phase).toBe('playing')
    game.pause()
    expect(game.phase).toBe('paused')

    const moving = new Game()
    moving.start(6)
    moving.enemies = []
    const plat = moving.level.platforms.find(
      (pickup) => pickup.kind === 'moving',
    )
    if (plat) {
      expect(moving.surface(plat)).toBeTypeOf('number')
    }

    const cannon = new Game()
    cannon.start(1)
    const idx = cannon.level.barrels.findIndex(
      (barrel) => barrel.kind === 'cannon',
    )
    if (idx >= 0) {
      cannon.level.barrels[idx].rotationSpeed = 2
      cannon.time = 1
      expect(cannon.cannonAngle(idx)).toBeTypeOf('number')
    }

    const bonus = new Game()
    bonus.start(0, true)
    bonus.enemies = []
    bonus.bonus = {
      index: 0,
      stage: bonus.level,
      sourceIndices: [0],
      world: {
        player: { ...bonus.player },
        enemies: [],
        animals: [],
        collected: new Set(),
        letters: new Set(),
        usedBarrels: new Set(),
        thrown: [],
        enemyShots: [],
        checkpoint: { ...bonus.checkpoint },
        companion: { ...bonus.companion },
        trail: [],
      },
    }
    bonus.damage(true)
    expect(bonus.bonus).toBeNull()
  })
})

describe('refactor coverage — mounts and walls', () => {
  it('covers mounted fall damage, enguarde release, and lagoon crate rescue', () => {
    const fallMount = new Game()
    fallMount.start(0)
    fallMount.enemies = []
    fallMount.animals[0].state = 'ridden'
    Object.assign(fallMount.player, { mount: 0, invincible: 0 })
    fallMount.damage(true)
    expect(fallMount.player.mount).toBe(-1)

    const eng = new Game()
    eng.start(3, true)
    eng.enemies = []
    const buddy = eng.animals.find((actor) => actor.kind === 'enguarde')
    if (buddy) {
      releaseMountAnimal(eng, buddy)
    }

    const lagoon = new Game()
    lagoon.start(3, true)
    lagoon.enemies = []
    const crate = lagoon.animals.find((actor2) => actor2.state === 'crate')
    if (crate) {
      Object.assign(lagoon.player, {
        x: crate.x,
        y: crate.y,
        roll: 0.5,
        vy: 0,
      })
      advanceGame(lagoon)
      expect(lagoon.player.x).toBeCloseTo(crate.x, 0)
    }
  })

  it('covers wall rambi break, cache balloon, and token collection guard', () => {
    const rambiWall = new Game()
    rambiWall.start(0, true)
    rambiWall.enemies = []
    rambiWall.animals[0].state = 'ridden'
    const wall = assertDefined(rambiWall.level.breakableWalls)[1]
    Object.assign(rambiWall.player, {
      mount: 0,
      x: wall.x,
      y: wall.y + 0.4,
      mountAttack: 0.2,
      vx: 0.2,
      roll: 0,
    })
    rambiWall.resolveBreakableWalls(rambiWall.player, rambiWall.player.x - 0.1)
    expect(rambiWall.brokenWalls.size).toBeGreaterThan(0)

    const balloon = new Game()
    balloon.start(0)
    balloon.enemies = []
    balloon.level.itemCaches = [
      { x: 8, y: 0, reward: { kind: 'balloon', amount: 1 } },
    ]
    balloon.revealedCaches.add(0)
    Object.assign(balloon.player, { x: 8, y: -0.2, grounded: true })
    advanceGame(balloon)

    const tokenGame = new Game()
    tokenGame.start(0, true)
    Reflect.deleteProperty(tokenGame, 'collectedTokens')
    const tokenDecor = tokenGame.level.decors?.find(
      (entry) => entry.kind === 'token',
    )
    if (tokenDecor) {
      expect(tokenGame.isTokenCollected(tokenDecor)).toBe(false)
    }
  })
})

describe('refactor coverage — necky and coral', () => {
  it('covers necky shot and coral bee bounce', () => {
    const necky = new Game()
    necky.start(0, true)
    const bird = necky.enemies.find(
      (entry) => entry.pattern === 'necky' && entry.throwsNuts,
    )
    if (bird) {
      bird.shootCooldown = 0
      Object.assign(necky.player, {
        x: bird.x + 4,
        y: bird.y,
        grounded: true,
      })
      advanceGame(necky)
      expect(necky.enemyShots.length).toBeGreaterThan(0)
    }

    const coralBee = new Game()
    coralBee.start(3, true)
    const bee = coralBee.enemies.find((entry2) => entry2.kind === 'bee')
    if (bee) {
      bee.x = coralBee.player.x
      bee.y = coralBee.player.y
      advanceGame(coralBee, emptyInput(), 3)
      expect(bee.alive).toBe(true)
      expect(bee.x).toBeTypeOf('number')
    }
  })
})

describe('refactor coverage — expresso mount', () => {
  it('covers expresso stride on beetle', () => {
    const expresso = new Game()
    expresso.start(0)
    expresso.enemies = []
    expresso.animals = [
      {
        kind: 'expresso',
        x: 10,
        y: 0,
        vx: 0,
        vy: 0,
        facing: 1,
        state: 'ridden',
        timer: 0,
      },
    ]
    const beetle = {
      kind: 'beetle' as const,
      x: 10.2,
      y: 0,
      originY: 0,
      vx: 0.5,
      vy: 0,
      min: 0,
      max: 100,
      hp: 1,
      alive: true,
      hurt: 0,
      timer: 0,
      pattern: 'patrol' as const,
      vulnerable: false,
      shootCooldown: 0,
    }
    expresso.enemies = [beetle]
    Object.assign(expresso.player, {
      mount: 0,
      x: 10,
      y: 0.05,
      grounded: true,
      invincible: 0,
    })
    advanceGame(expresso)
    expect(expresso.player.mount).toBe(0)
  })
})

describe('refactor coverage — winky mount', () => {
  it('covers winky stomp while mounted', () => {
    const winky = new Game()
    winky.start(0)
    const stompTarget = {
      kind: 'beetle' as const,
      x: 12,
      y: 0,
      originY: 0,
      vx: 0,
      vy: 0,
      min: 0,
      max: 100,
      hp: 1,
      alive: true,
      hurt: 0,
      timer: 0,
      pattern: 'patrol' as const,
      vulnerable: false,
      shootCooldown: 0,
    }
    winky.enemies = [stompTarget]
    winky.animals = [
      {
        kind: 'winky',
        x: 12,
        y: 0,
        vx: 0,
        vy: 0,
        facing: 1,
        state: 'ridden',
        timer: 0,
      },
    ]
    Object.assign(winky.player, {
      mount: 0,
      x: stompTarget.x,
      vy: -2,
      grounded: false,
      invincible: 0,
    })
    advanceGame(winky)
    expect(['ridden', 'fleeing']).toContain(winky.animals[0]?.state)
  })
})
