import { describe, expect, it } from 'vitest'
import { resolveAudioEffectId } from '../src/game/audio'
import { Game, emptyInput } from '../src/game/engine'
import type { Enemy } from '../src/game/engine/types'
import { groundEnemy } from '../src/game/engine/gameGroundEnemy'
import { updateMountAnimals } from '../src/game/engine/gameMountAnimals'
import { updateItemCaches } from '../src/game/engine/gameWorldInteract'
import { runMineAndClock } from '../src/game/engine/playingFrame/stepMineAndClock'
import { runPlayerMotion } from '../src/game/engine/playingFrame/stepPlayerMotion'
import { runEnemies } from '../src/game/engine/playingFrame/stepEnemies'
import { runWorldInteract } from '../src/game/engine/playingFrame/stepWorldInteract'
import { STEP } from '../src/game/engine/romPhysics'
import {
  updateBossBattle,
  createBossBattle,
  type BossActor,
} from '../src/game/bossBattle'
describe('playingFrame extract branches — ground and caches', () => {
  it('covers ground enemy, mount flee, and item caches', () => {
    const game = new Game()
    game.start(0, true)
    const beetle = game.enemies.find(
      (entry) => entry.kind === 'beetle' && entry.alive,
    )
    expect(beetle).toBeDefined()
    if (beetle) {
      beetle.y = (game.supportAt(beetle.x, beetle.y) ?? beetle.y) + 2
      beetle.vy = -3
      groundEnemy(game, beetle, STEP)
      expect(beetle.vy).toBeGreaterThan(-4)
    }
    const lagoon = new Game()
    lagoon.start(3, true)
    lagoon.enemies = []
    const buddy = lagoon.animals[0]
    buddy.state = 'fleeing'
    buddy.vx = 1
    buddy.timer = 0
    updateMountAnimals(lagoon, emptyInput(), lagoon.player.y, STEP)
    const cache = new Game()
    cache.start(0)
    cache.level.itemCaches = [
      { x: 6, y: 0, reward: { kind: 'balloon', amount: 1 } },
      { x: 7, y: 0, reward: { kind: 'banana', amount: 4 } },
    ]
    cache.revealedCaches.add(0)
    cache.revealedCaches.add(1)
    Object.assign(cache.player, { x: 6, y: -0.2, grounded: true })
    updateItemCaches(cache, cache.player, emptyInput())
    Object.assign(cache.player, { x: 7, y: -0.2 })
    updateItemCaches(cache, cache.player, emptyInput())
    const balloonOnly = new Game()
    balloonOnly.start(0)
    balloonOnly.level.itemCaches = [
      { x: 4, y: 0, reward: { kind: 'balloon', amount: 2 } },
    ]
    balloonOnly.revealedCaches.add(0)
    Object.assign(balloonOnly.player, { x: 4, y: -0.2, grounded: true })
    updateItemCaches(balloonOnly, balloonOnly.player, emptyInput())
    const moving = new Game()
    moving.start(4)
    const plat = moving.level.platforms.find(
      (platform) => platform.kind === 'moving',
    )
    if (plat) {
      plat.travel = undefined
      moving.surface(plat)
    }
  })
})

describe('playingFrame extract branches — motion and boss', () => {
  it('covers rambi jump, thrown kills, and boss dead pose', () => {
    const rambiJump = new Game()
    rambiJump.start(0)
    rambiJump.enemies = []
    rambiJump.animals[0].state = 'ridden'
    Object.assign(rambiJump.player, {
      mount: 0,
      jumpDelay: 1,
      coyote: 0.2,
      rollJump: true,
      grounded: true,
    })
    let env = runMineAndClock(rambiJump, emptyInput(), STEP)
    runPlayerMotion(rambiJump, emptyInput(), STEP, env)
    rambiJump.player.jumpDelay = 0
    rambiJump.player.buffer = 0.12
    rambiJump.player.rollJump = true
    rambiJump.player.coyote = 0.12
    runPlayerMotion(rambiJump, emptyInput(), STEP, env)
    const kill = new Game()
    kill.start(0, true)
    const victim = kill.enemies.find(
      (enemy) => enemy.alive && enemy.kind === 'beetle',
    )
    if (victim) {
      victim.hp = 1
      victim.hurt = 0
      kill.thrown.push({
        x: victim.x,
        y: victim.y + 0.5,
        vx: 0,
        vy: 0,
        active: true,
      })
      env = runMineAndClock(kill, emptyInput(), STEP)
      env.oldY = kill.player.y
      runEnemies(kill, emptyInput(), STEP, env)
      expect(victim.alive).toBe(false)
    }
    const boss: BossActor = {
      x: 8,
      y: 2,
      vx: 0,
      vy: 0,
      min: 4,
      max: 18,
      hp: 3,
      vulnerable: false,
    }
    const battle = createBossBattle(boss)
    battle.phase = 'throw'
    updateBossBattle(battle, boss, [], STEP)
    battle.phase = 'dead'
    boss.y = 4
    updateBossBattle(battle, boss, [], STEP)
    expect(boss.y).toBe(0)
  })
})
describe('playingFrame isolated corners — audio and mounts', () => {
  it('covers audio ids, boss getUp, and fleeing mounts', () => {
    expect(resolveAudioEffectId('letter')).toBe(0x4f)
    expect(resolveAudioEffectId('hurt', { character: 1 })).toBe(0x43)
    expect(resolveAudioEffectId('jump', { inWater: true, character: 1 })).toBe(
      0x75,
    )
    const getUp: BossActor = {
      x: 8,
      y: 1,
      vx: 0,
      vy: 0,
      min: 4,
      max: 18,
      hp: 3,
      vulnerable: false,
    }
    const rising = createBossBattle(getUp)
    rising.phase = 'getUp'
    rising.phaseTime = 0.2
    updateBossBattle(rising, getUp, [], STEP)
    rising.phase = 'dead'
    updateBossBattle(rising, getUp, [], STEP)
    const game = new Game()
    game.start(0, true)
    const beetle = game.enemies.find(
      (enemy) => enemy.kind === 'beetle',
    ) as Enemy
    beetle.y = 4
    beetle.vy = -2
    beetle.vx = 0.4
    groundEnemy(game, beetle, STEP)
    const lagoon = new Game()
    lagoon.start(3, true)
    lagoon.enemies = []
    const flee = lagoon.animals[0]
    flee.state = 'fleeing'
    flee.timer = 0.1
    flee.vx = 0.5
    flee.x = lagoon.player.x
    flee.y = lagoon.player.y
    updateMountAnimals(lagoon, emptyInput(), flee.y, STEP)
  })
})

describe('playingFrame isolated corners — mine and interact', () => {
  it('covers static platforms, necky, mine recovery, and shot clash', () => {
    const staticGame = new Game()
    staticGame.start(6)
    const fixed = staticGame.level.platforms.find(
      (platform) => platform.kind !== 'moving',
    )
    if (fixed) {
      expect(staticGame.surface(fixed)).toBe(fixed.y)
    }
    const necky = new Game()
    necky.start(0, true)
    const bird = necky.enemies.find(
      (enemy) => enemy.pattern === 'necky' && enemy.throwsNuts,
    )
    if (bird) {
      bird.shootCooldown = 0
      necky.player.x = bird.x
      necky.player.y = bird.y
      necky.player.grounded = true
      const env = runMineAndClock(necky, emptyInput(), STEP)
      runEnemies(necky, emptyInput(), STEP, env)
    }
    const mine = new Game()
    mine.start(2, true)
    mine.mineRecoveryLayout = 0
    runMineAndClock(mine, emptyInput(), STEP)
    const ship = new Game()
    ship.start(0)
    ship.enemies = []
    if (ship.animals[0]) {
      ship.animals[0].state = 'ridden'
      Object.assign(ship.player, {
        mount: 0,
        grounded: true,
        jumpDelay: 0,
        buffer: 0.12,
        rollJump: true,
        coyote: 0.12,
      })
      const shipEnv = runMineAndClock(ship, emptyInput(), STEP)
      runPlayerMotion(ship, emptyInput(), STEP, shipEnv)
    }
    const clash = new Game()
    clash.start(0, true)
    clash.enemies = []
    clash.thrown = [{ x: 5, y: 1, vx: 0, vy: 0, active: true }]
    clash.enemyShots = [{ x: 5, y: 1, vx: 0, vy: 0, active: true }]
    runMineAndClock(clash, emptyInput(), STEP)
    runWorldInteract(clash, emptyInput(), STEP)
    expect(clash.enemyShots).toHaveLength(0)
  })
})
