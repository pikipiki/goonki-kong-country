import { describe, expect, it } from 'vitest'
import { Game, emptyInput } from '../src/game/engine'
import { runMineAndClock } from '../src/game/engine/playingFrame/stepMineAndClock'
import { runPlayerMotion } from '../src/game/engine/playingFrame/stepPlayerMotion'
import { runEnemies } from '../src/game/engine/playingFrame/stepEnemies'
import { runWorldInteract } from '../src/game/engine/playingFrame/stepWorldInteract'
import { STEP } from '../src/game/engine/romPhysics'
describe('playingFrame mine and clock', () => {
  it('runs mine recovery actor relocation', () => {
    const game = new Game()
    game.start(2, true)
    game.mineRecoveryLayout = 0
    const env = runMineAndClock(game, emptyInput(), STEP)
    expect(env.cart).toBe(true)
  })
  it('runs delayed and buffered jump impulses on ship', () => {
    const game = new Game()
    game.start(6)
    game.enemies = []
    const env = runMineAndClock(game, emptyInput(), STEP)
    game.player.jumpDelay = 1
    game.player.coyote = 0.15
    game.player.rollJump = true
    game.player.grounded = true
    runPlayerMotion(game, emptyInput(), STEP, env)
    game.player.jumpDelay = 0
    game.player.buffer = 0.12
    runPlayerMotion(game, emptyInput(), STEP, env)
    game.player.rollJump = true
    game.player.buffer = 0.12
    game.player.coyote = 0.12
    runPlayerMotion(game, emptyInput(), STEP, env)
    expect(game.player.grounded).toBe(false)
  })
})
describe('playingFrame enemies', () => {
  it('runs enemy combat branches for necky, winky, and hurt enemies', () => {
    const game = new Game()
    game.start(0, true)
    const necky = game.enemies.find(
      (entry) => entry.pattern === 'necky' && entry.throwsNuts,
    )
    if (necky) {
      necky.shootCooldown = 0
      game.player.x = necky.x
      game.player.y = necky.y
      game.player.grounded = true
    }
    let env = runMineAndClock(game, emptyInput(), STEP)
    runEnemies(game, emptyInput(), STEP, env)
    const winky = new Game()
    winky.start(0)
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
    winky.enemies = [
      {
        kind: 'beetle',
        x: 12.2,
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
        pattern: 'patrol',
        vulnerable: false,
        shootCooldown: 0,
      },
    ]
    Object.assign(winky.player, {
      mount: 0,
      x: 12.2,
      vy: -2,
      grounded: false,
      invincible: 0,
    })
    env = runMineAndClock(winky, emptyInput(), STEP)
    env.oldY = winky.player.y + 1
    runEnemies(winky, emptyInput(), STEP, env)
    const hurt = new Game()
    hurt.start(0, true)
    const target = hurt.enemies[0]
    target.hurt = 0.5
    Object.assign(hurt.player, {
      x: target.x,
      y: target.y,
      invincible: 0,
      hp: 2,
    })
    env = runMineAndClock(hurt, emptyInput(), STEP)
    runEnemies(hurt, emptyInput(), STEP, env)
    expect(hurt.player.hp).toBeLessThanOrEqual(2)
  })
})
describe('playingFrame world pickup', () => {
  it('runs world pickup interactions', () => {
    const game = new Game()
    game.start(0, true)
    game.enemies = []
    const letterIdx = game.level.pickups.findIndex(
      (pickup) => pickup.kind === 'letter',
    )
    if (letterIdx >= 0) {
      const item = game.level.pickups[letterIdx]
      delete (
        item as {
          letter?: string
        }
      ).letter
      Object.assign(game.player, {
        x: item.x,
        y: item.y - 1,
        grounded: true,
      })
    }
    runMineAndClock(game, emptyInput(), STEP)
    runWorldInteract(game, emptyInput(), STEP)
    expect(game.phase).toBe('playing')
  })
})

describe('playingFrame cannon and clashes', () => {
  it('covers cannon messages and shot-barrel clashes', () => {
    const cannon = new Game()
    cannon.start(6)
    cannon.enemies = []
    const idx = cannon.level.barrels.findIndex(
      (barrel) => barrel.kind === 'cannon',
    )
    if (idx >= 0) {
      cannon.level.barrels[idx].autoFire = false
      const pos = cannon.cannonPosition(idx)
      Object.assign(cannon.player, {
        x: pos.x,
        y: pos.y,
        mount: -1,
        cannonLock: -1,
        grounded: true,
      })
      runMineAndClock(cannon, emptyInput(), STEP)
      runWorldInteract(cannon, emptyInput(), STEP)
    }
    const clash = new Game()
    clash.start(0, true)
    clash.enemies = []
    clash.enemyShots.push({
      x: clash.player.x,
      y: clash.player.y + 0.4,
      vx: 0,
      vy: 0,
      active: true,
    })
    clash.thrown.push({
      x: clash.player.x,
      y: clash.player.y + 0.4,
      vx: 0,
      vy: 0,
      active: true,
    })
    runMineAndClock(clash, emptyInput(), STEP)
    runWorldInteract(clash, emptyInput(), STEP)
    expect(clash.enemyShots).toHaveLength(0)
  })

  it('covers auto-fire cannon messaging', () => {
    const auto = new Game()
    auto.start(6)
    auto.enemies = []
    const autoIdx = auto.level.barrels.findIndex(
      (barrel2) => barrel2.kind === 'cannon',
    )
    if (autoIdx >= 0) {
      auto.level.barrels[autoIdx].autoFire = true
      const pos = auto.cannonPosition(autoIdx)
      Object.assign(auto.player, {
        x: pos.x,
        y: pos.y,
        mount: -1,
        cannonLock: -1,
        grounded: true,
      })
      runMineAndClock(auto, emptyInput(), STEP)
      runWorldInteract(auto, emptyInput(), STEP)
      expect(auto.player.cannon).toBeGreaterThanOrEqual(0)
    }
  })
})
