import { describe, it, expect } from 'vitest'
import { Game, STEP, emptyInput } from '../src/game/engine'
import { bossArenaBounds, BOSS_CARRY } from '../src/game/bossArena'
import {
  BOSS_MAX_HITS,
  createBossBattle,
  updateBossBattle,
  type BossActor,
  type BossProjectile,
} from '../src/game/bossBattle'
import { ENEMY_DESIGNS } from '../src/game/enemies'
import { resolveAudioEffectId } from '../src/game/audio'
describe('boss arena deck traversal', () => {
  for (const carrying of [false, true]) {
    it(`crosses the entire deck in both directions, carrying=${String(carrying)}`, () => {
      const game = new Game()
      game.start(6)
      game.enemies = []
      const bounds = bossArenaBounds(game.level.length)
      const input = emptyInput()
      game.player.x = bounds.playerMin
      if (carrying) {
        game.player.carry = 1
        game.usedBarrels.add(1)
      }
      input.held.add('right')
      input.held.add('run')
      let last = game.player.x
      for (
        let frame = 0;
        frame < 600 && game.player.x < bounds.playerMax;
        frame++
      ) {
        game.update(input)
        expect(game.player.x).toBeGreaterThan(last)
        last = game.player.x
      }
      expect(game.player.x).toBe(bounds.playerMax)
      expect(game.player.vx).toBe(0)
      input.held.delete('right')
      input.held.add('left')
      last = game.player.x
      for (
        let frameBack = 0;
        frameBack < 600 && game.player.x > bounds.playerMin;
        frameBack++
      ) {
        game.update(input)
        expect(game.player.x).toBeLessThan(last)
        last = game.player.x
      }
      expect(game.player.x).toBe(bounds.playerMin)
      expect(game.player.vx).toBe(0)
      expect(game.player.y).toBe(0)
      expect(game.player.hp).toBe(2)
    })
  }
})
describe('boss arena barrel throw', () => {
  it('throws from the carried centre, settles on the visible deck and breaks beyond its edge', () => {
    const game = new Game()
    game.start(6)
    game.enemies = []
    game.player.x = 10
    game.player.facing = 1
    const input = emptyInput()
    input.tapAction = true
    input.pressed.add('action')
    game.update(input)
    expect(game.player.carry).toBe(1)
    expect(game.usedBarrels.has(1)).toBe(true)
    let spawn:
      | {
          x: number
          y: number
        }
      | undefined
    const events: string[] = []
    game.onEvent = (entry) => {
      events.push(entry)
      if (entry === 'throw') {
        spawn = { ...game.thrown[0] }
      }
    }
    input.tapAction = false
    input.released.add('action')
    game.update(input)
    expect(spawn?.x).toBeCloseTo(10 + BOSS_CARRY.x)
    expect(spawn?.y).toBeCloseTo(BOSS_CARRY.y)
    const simInput = emptyInput()
    for (
      let frame = 0;
      frame < 180 && !events.includes('barrel-break');
      frame++
    ) {
      game.update(simInput)
    }
    expect(events).toContain('barrel-break')
    expect(game.thrown).toHaveLength(0)
  })
})
describe('boss arena barrel damage and layout', () => {
  it('damages the boss with a barrel thrown through the real pickup/throw controls', () => {
    const game = new Game()
    game.start(6)
    game.player.x = 10
    const input = emptyInput()
    input.tapAction = true
    input.pressed.add('action')
    game.update(input)
    expect(game.player.carry).toBe(1)
    input.pressed.add('action')
    game.update(input)
    for (
      let frame = 0;
      frame < 100 && game.enemies[0].hp === BOSS_MAX_HITS;
      frame++
    ) {
      game.update(input)
    }
    expect(game.enemies[0].hp).toBe(BOSS_MAX_HITS - 1)
    expect(game.player.hp).toBe(2)
  })
  it('contains authored barrels without invisible procedural letters or bananas', () => {
    const game = new Game()
    game.start(6)
    expect(game.level.pickups).toEqual([])
    expect(game.level.barrels.map((barrel) => barrel.kind)).toEqual([
      'rescue',
      'throw',
      'checkpoint',
    ])
  })
})
function expectBossHurtSoundAfterLanding(previousHits: number) {
  const game = new Game()
  game.start(6)
  const boss = game.enemies[0]
  const events: string[] = []
  game.onEvent = (entry) => events.push(entry)
  boss.hp = BOSS_MAX_HITS - previousHits
  const battle = game.bossBattle
  expect(battle).toBeDefined()
  if (!battle) {
    return
  }
  Object.assign(battle, {
    phase: 'catch',
    phaseTime: 0,
    crowned: false,
    hits: previousHits,
  })
  game.bossProjectiles.push({
    kind: 'crown',
    x: 5,
    y: 1.35,
    vx: -6,
    vy: 0,
    active: true,
    width: 0.38,
    height: 0.34,
    age: 0,
    warning: 0,
    returning: false,
    rotation: 0,
  })
  Object.assign(game.player, {
    x: boss.x,
    y: ENEMY_DESIGNS.boss.height + 0.03,
    vy: -7,
    invincible: 0,
  })
  game.update(emptyInput())
  expect(boss.hp).toBe(BOSS_MAX_HITS - previousHits - 1)
  expect(game.player.hp).toBe(2)
  for (let frame = 0; frame < 5; frame++) {
    game.update(emptyInput())
  }
  expect(events).not.toContain('boss-hurt')
  game.update(emptyInput())
  expect(events.filter((entry) => entry === 'boss-hurt')).toHaveLength(1)
  for (let frame = 0; frame < 20; frame++) {
    game.update(emptyInput())
  }
  expect(events.filter((entry) => entry === 'boss-hurt')).toHaveLength(1)
  expect(resolveAudioEffectId('boss-hurt')).toBe(0x53)
}
describe('boss ROM hurt sound', () => {
  for (const previousHits of [0, 9]) {
    it(`plays sound 0x53 once six frames after head landing ${String(previousHits + 1)}`, () => {
      expectBossHurtSoundAfterLanding(previousHits)
    })
  }
  it('does not groan when the protected crown merely bounces the plush', () => {
    const game = new Game()
    game.start(6)
    const boss = game.enemies[0]
    const events: string[] = []
    game.onEvent = (entry) => events.push(entry)
    const battle = game.bossBattle
    expect(battle).toBeDefined()
    if (!battle) {
      return
    }
    Object.assign(battle, {
      phase: 'throw',
      phaseTime: 0,
      crowned: true,
    })
    Object.assign(game.player, {
      x: boss.x,
      y: ENEMY_DESIGNS.boss.height + 0.03,
      vy: -7,
      invincible: 0,
    })
    for (let frame = 0; frame < 15; frame++) {
      game.update(emptyInput())
    }
    expect(boss.hp).toBe(BOSS_MAX_HITS)
    expect(events).not.toContain('boss-hurt')
  })
})
describe('cannonball poses, deck impact and rebound', () => {
  it('holds each falling pose, marks one impact, rebounds and leaves on the second landing', () => {
    const boss: BossActor = {
      x: 17,
      y: 0,
      vx: 0,
      vy: 0,
      min: 4,
      max: 18,
      hp: 6,
      vulnerable: false,
    }
    const state = createBossBattle(boss)
    Object.assign(state, { phase: 'rain', rainCount: 0 })
    const projectile: BossProjectile = {
      kind: 'cannonball',
      x: 6,
      y: 8.2,
      vx: 0,
      vy: 0,
      active: true,
      width: 0.34,
      height: 0.68,
      age: 0,
      warning: 0,
      returning: false,
      rotation: 0,
    }
    const events: string[] = []
    const tick = () => {
      updateBossBattle(state, boss, [projectile], STEP, (entry) =>
        events.push(entry),
      )
    }
    tick()
    expect(projectile.y).toBe(8.2)
    tick()
    expect(projectile.y).toBeLessThan(8.2)
    for (let frame = 0; frame < 120 && !projectile.bounces; frame++) {
      tick()
    }
    expect(projectile.bounces).toBe(1)
    expect(projectile.y).toBe(projectile.height / 2)
    expect(projectile.impact).toBeGreaterThan(0)
    tick()
    expect(projectile.y).toBe(projectile.height / 2)
    let peak = projectile.y
    for (let frame = 0; frame < 120 && projectile.active; frame++) {
      tick()
      peak = Math.max(peak, projectile.y)
    }
    expect(peak).toBeGreaterThan(1)
    expect(projectile.active).toBe(false)
    expect(events.filter((entry) => entry === 'boss-ball-impact')).toHaveLength(
      1,
    )
    expect(resolveAudioEffectId('boss-ball-impact')).toBe(0x1e)
  })
})
