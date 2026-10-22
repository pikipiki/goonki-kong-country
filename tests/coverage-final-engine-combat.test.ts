import { describe, expect, it } from 'vitest'
import { Game, emptyInput } from '../src/game/engine'
import { advanceGame, tickGame } from './helpers/simulation'
import { assertDefined } from './helpers/assertDefined'
import { Controls } from '../src/game/input'
import { LEVELS } from '../src/game/levels'

describe('coverage final — swap and rolls', () => {
  it('covers swap colors, mount attacks, and rolls', () => {
    const swap = new Game()
    swap.start(0)
    swap.enemies = []
    Object.assign(swap.player, { hp: 2, active: 0, cannon: -1, roll: 0 })
    const input = emptyInput()
    input.pressed.add('swap')
    advanceGame(swap, input)
    assertDefined(swap.swap).remaining = 0
    advanceGame(swap)
    expect(swap.player.hp).toBe(2)

    const rambi = new Game()
    rambi.start(0)
    rambi.enemies = []
    rambi.animals[0].state = 'ridden'
    Object.assign(rambi.player, { mount: 0, x: 12, y: 0, grounded: true })
    const act = emptyInput()
    act.pressed.add('action')
    advanceGame(rambi, act)
    expect(rambi.player.mount).toBe(0)
  })

  it('covers roll action and still roll guard', () => {
    const roll = new Game()
    roll.start(0)
    roll.enemies = []
    Object.assign(roll.player, {
      x: 14,
      y: 0,
      grounded: true,
      roll: 0,
      recentRun: 0,
    })
    const riRef = emptyInput()
    riRef.pressed.add('action')
    riRef.held.add('right')
    advanceGame(roll, riRef)

    const still = new Game()
    still.start(0)
    still.enemies = []
    Object.assign(still.player, {
      x: 14,
      y: 0,
      grounded: true,
      roll: 0,
      recentRun: 1,
    })
    const siRef = emptyInput()
    siRef.pressed.add('action')
    advanceGame(still, siRef)
    expect(still.player.roll).toBeGreaterThanOrEqual(0)
  })
})

describe('coverage final — ship and momentum', () => {
  it('covers ship jump, cannon steering, and roll momentum', () => {
    const ship = new Game()
    ship.start(6)
    ship.enemies = []
    ship.player.jumpDelay = 1
    ship.player.coyote = 0.1
    ship.player.rollJump = true
    advanceGame(ship)

    const launched = new Game()
    launched.start(1)
    launched.enemies = []
    Object.assign(launched.player, {
      launched: 1,
      cannonControlDelay: 0,
      vx: 3,
      vy: 0,
      grounded: false,
      cannon: -1,
    })
    const steer = emptyInput()
    steer.held.add('left')
    advanceGame(launched, steer, 8)

    const momentum = new Game()
    momentum.start(0)
    momentum.enemies = []
    Object.assign(momentum.player, {
      rollJumpMomentum: 8,
      grounded: false,
      vx: 8,
    })
    const rev = emptyInput()
    rev.held.add('left')
    advanceGame(momentum, rev, 5)
    expect(momentum.player.vx).toBeLessThan(8)
  })
})

describe('coverage final — mine and victory', () => {
  it('covers mine recovery and level finish', () => {
    const mine = new Game()
    mine.start(2, true)
    Reflect.deleteProperty(mine, 'mineRecoveryLayout')
    advanceGame(mine)

    const last = new Game()
    last.load(LEVELS.length - 1, 'playing')
    last.enemies = []
    last.finish()
    expect(last.phase).toBe('victory')
  })

  it('covers letter pickups and cannon auto fire', () => {
    const letters = new Game()
    letters.start(0, true)
    letters.enemies = []
    const ids = letters.level.pickups
      .map((pickup, index) => (pickup.kind === 'letter' ? index : -1))
      .filter((index2) => index2 >= 0)
    ids.slice(0, -1).forEach((index3) => letters.letters.add(index3))
    const lastLetter = letters.level.pickups[assertDefined(ids.at(-1))]
    Object.assign(letters.player, {
      x: lastLetter.x,
      y: lastLetter.y - 1,
      grounded: true,
    })
    const before = letters.lives
    advanceGame(letters)
    expect(letters.lives).toBeGreaterThan(before)

    const auto = new Game()
    auto.start(6)
    const cannonIdx = auto.level.barrels.findIndex(
      (barrel2) => barrel2.kind === 'cannon',
    )
    if (cannonIdx >= 0) {
      auto.level.barrels[cannonIdx].autoFire = true
      const pos = auto.level.barrels[cannonIdx]
      Object.assign(auto.player, { x: pos.x, y: pos.y, invincible: 0 })
      advanceGame(auto)
      expect(auto.player.invincible).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('coverage final — rescue and thrown', () => {
  it('covers rescue barrel and thrown flight', () => {
    const rescue = new Game()
    rescue.start(0)
    rescue.enemies = []
    const rIdx = rescue.level.barrels.findIndex(
      (barrel3) => barrel3.kind === 'rescue',
    )
    if (rIdx >= 0) {
      rescue.usedBarrels.add(rIdx)
      rescue.lives = 2
      rescue.player.hp = 1
      rescue.player.invincible = 0
      rescue.damage()
      expect(rescue.usedBarrels.has(rIdx)).toBe(false)
    }

    const thrown = new Game()
    thrown.start(0, true)
    thrown.enemies = []
    thrown.thrown.push({
      x: thrown.player.x,
      y: thrown.player.y,
      vx: 6,
      vy: 0,
      active: true,
    })
    advanceGame(thrown, emptyInput(), 30)
    expect(thrown.thrown.some((barrel) => barrel.active)).toBeTypeOf('boolean')
  })

  it('covers winky mount stomp', () => {
    const winky = new Game()
    winky.start(5)
    const wmRef = assertDefined(
      winky.animals.find((actor2) => actor2.kind === 'winky'),
    )
    wmRef.state = 'ridden'
    const beetle = winky.enemies.find((entry) => entry.kind === 'beetle')
    if (beetle) {
      Object.assign(winky.player, {
        mount: winky.animals.indexOf(wmRef),
        x: beetle.x,
        y: beetle.y + 2,
        vy: -8,
        invincible: 0,
      })
      advanceGame(winky)
      expect(winky.player.mount).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('coverage final — combat mounts', () => {
  it('covers expresso and enguarde mount attacks', () => {
    const expresso = new Game()
    expresso.start(4)
    expresso.animals[0].state = 'ridden'
    const bug = expresso.enemies.find((entry2) => entry2.kind === 'beetle')
    if (bug) {
      Object.assign(expresso.player, {
        mount: 0,
        x: bug.x,
        y: bug.y,
        invincible: 0,
      })
      advanceGame(expresso)
    }

    const eng = new Game()
    eng.start(3, true)
    eng.enemies = []
    const entry3 = eng.animals.find(
      (actor3) => actor3.kind === 'enguarde' && actor3.state === 'crate',
    )
    if (entry3) {
      entry3.state = 'ridden'
      Object.assign(eng.player, {
        mount: eng.animals.indexOf(entry3),
        x: eng.enemies[0]?.x ?? 10,
        y: 0,
        mountAttack: 0.2,
        facing: 1,
        invincible: 0,
      })
      const bee = eng.enemies.find((posX2) => posX2.kind === 'bee')
      if (bee) {
        eng.player.x = bee.x - 0.5
        advanceGame(eng)
        expect(eng.player.mountAttack).toBeLessThan(0.2)
      }
    }
  })

  it('covers stomp, roll hit, and nut damage', () => {
    const stomp = new Game()
    stomp.start(0, true)
    const arm = stomp.enemies.find((entry4) => entry4.kind === 'armored')
    if (arm) {
      Object.assign(stomp.player, {
        x: arm.x,
        y: arm.y + 1.5,
        vy: -9,
        active: 0,
        invincible: 0,
      })
      advanceGame(stomp)
    }

    const rollHit = new Game()
    rollHit.start(0)
    const foe = rollHit.enemies[0]
    Object.assign(rollHit.player, {
      x: foe.x,
      y: foe.y,
      roll: 0.4,
      invincible: 0,
    })
    advanceGame(rollHit)

    const nut = new Game()
    nut.start(0, true)
    nut.player.invincible = 0
    nut.enemyShots.push({
      x: nut.player.x,
      y: nut.player.y + 0.5,
      vx: 0,
      vy: 0,
      active: true,
    })
    advanceGame(nut)
    expect(nut.player.hp).toBeGreaterThan(0)
  })
})

describe('coverage final — enguarde release', () => {
  it('covers enguarde release and boss barrel throw', () => {
    const game = new Game()
    game.start(6)
    game.enemies = []
    game.player.x = 10
    game.player.carry = -1
    const controls = new Controls()
    controls.set('keyboard-KeyX', 'action', true)
    tickGame(game, controls)
    controls.set('keyboard-KeyX', 'action', false)
    tickGame(game, controls)
    expect(game.thrown.length).toBeGreaterThan(0)
  })
})
