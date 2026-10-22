import { describe, expect, it } from 'vitest'
import {
  BOSS_MAX_HITS,
  bossAcceptsHit,
  createBossBattle,
  registerBossHit,
  updateBossBattle,
} from '../src/game/bossBattle'
import { Game, STEP, emptyInput } from '../src/game/engine'
import { ENEMY_DESIGNS } from '../src/game/enemies'
import {
  bossActor,
  bossCrown,
  bossStateAfterHit,
  expectPlushReachesBossHead,
  simulateBossUntil,
} from './helpers/bossBattleSim'

describe('final battle crown and run phases', () => {
  it('throws and returns the crown, exposing the head only during its flight', () => {
    const boss = bossActor()
    const state = createBossBattle(boss)
    const shots: import('../src/game/bossBattle').BossProjectile[] = []
    expect(state.crowned).toBe(true)
    expect(boss.vulnerable).toBe(false)
    simulateBossUntil(state, boss, shots, () => state.phase === 'catch')
    expect(
      shots.filter((shot) => shot.active && shot.kind === 'crown'),
    ).toHaveLength(1)
    expect(state.crowned).toBe(false)
    expect(boss.vulnerable).toBe(true)
    simulateBossUntil(state, boss, shots, () => state.phase === 'throw')
    expect(shots.some((shot) => shot.active && shot.kind === 'crown')).toBe(
      false,
    )
    expect(state.crowned).toBe(true)
    expect(boss.vulnerable).toBe(false)
  })
  for (const hits of [1, 2, 3]) {
    it(`runs ${String(hits)} passes after hit ${String(hits)}`, () => {
      const { boss, state, shots } = bossStateAfterHit(hits)
      simulateBossUntil(state, boss, shots, () => state.phase === 'run')
      expect(state.passes).toBe(hits)
      const turns: number[] = []
      let previous = state.passes
      simulateBossUntil(state, boss, shots, () => {
        if (state.passes !== previous) {
          turns.push(state.passes)
          previous = state.passes
        }
        return state.phase === 'throw'
      })
      expect(turns).toEqual(
        Array.from({ length: hits }, (_, index) => hits - index - 1),
      )
      expect(boss.x).toBeGreaterThanOrEqual(boss.min)
      expect(boss.x).toBeLessThanOrEqual(boss.max)
    })
  }
})

describe('final battle rain phase', () => {
  for (const [hits, count] of [
    [4, 9],
    [5, 17],
    [6, 25],
  ]) {
    it(`drops ${String(count)} warned cannonballs after hit ${String(hits)}`, () => {
      const { boss, state, shots } = bossStateAfterHit(hits)
      simulateBossUntil(state, boss, shots, () => state.phase === 'jump')
      expect(state.jumps).toBe(3)
      simulateBossUntil(state, boss, shots, () => state.phase === 'rain')
      let total = 0
      const warned: number[] = []
      for (
        let frame = 0;
        frame < 35 / STEP && state.phase !== 'throw';
        frame++
      ) {
        const old = shots.length
        updateBossBattle(state, boss, shots, STEP)
        for (const shot of shots.slice(old)) {
          total++
          warned.push(shot.warning)
          expect(shot.y).toBeGreaterThan(8)
        }
      }
      expect(total).toBe(count)
      expect(state.spawned).toBe(count)
      expect(state.phase).toBe('throw')
      expect(warned.every((warn) => warn > 0.5)).toBe(true)
      expect(
        shots.filter((shot) => shot.kind === 'cannonball' && shot.active),
      ).toHaveLength(0)
    })
  }
})

describe('final battle fake defeat and hops', () => {
  it('fakes defeat after seven hits, gets up, then performs two hops', () => {
    const { boss, state, shots } = bossStateAfterHit(7)
    simulateBossUntil(state, boss, shots, () => state.phase === 'fakeDeath')
    expect(boss.hp).toBe(3)
    expect(bossAcceptsHit(state)).toBe(false)
    for (let frame = 0; frame < 180; frame++) {
      updateBossBattle(state, boss, shots, STEP)
    }
    expect(state.phase).toBe('fakeDeath')
    simulateBossUntil(state, boss, shots, () => state.phase === 'getUp')
    expect(bossAcceptsHit(state)).toBe(false)
    simulateBossUntil(state, boss, shots, () => state.phase === 'jump')
    expect(state.jumps).toBe(2)
    simulateBossUntil(state, boss, shots, () => state.phase === 'throw')
    expect(boss.hp).toBe(3)
  })
  for (const [hits, hops] of [
    [8, 6],
    [9, 12],
  ]) {
    it(`performs ${String(hops)} hops after hit ${String(hits)}`, () => {
      const { boss, state, shots } = bossStateAfterHit(hits)
      simulateBossUntil(state, boss, shots, () => state.phase === 'jump')
      expect(state.jumps).toBe(hops)
      let lands = 0
      for (
        let frame = 0;
        frame < 12 / STEP && state.phase === 'jump';
        frame++
      ) {
        updateBossBattle(state, boss, shots, STEP, (event) => {
          if (event === 'boss-land') {
            lands++
          }
        })
      }
      expect(lands).toBe(hops)
      expect(state.phase).toBe('throw')
    })
  }
  it('requires ten hits and clears existing attacks on every registered hit', () => {
    const boss = bossActor()
    const state = createBossBattle(boss)
    const shots = [bossCrown()]
    for (let hit = 1; hit <= 10; hit++) {
      boss.hp--
      registerBossHit(state, boss, shots)
      expect(state.hits).toBe(hit)
      expect(state.phase).toBe(hit === 10 ? 'dead' : 'hurt')
      expect(shots.every((shot) => !shot.active)).toBe(true)
    }
    expect(bossAcceptsHit(state)).toBe(false)
  })
})

describe('final battle pause and projectile damage', () => {
  it('freezes the boss and all projectiles while paused', () => {
    const game = new Game()
    game.start(6)
    game.bossProjectiles.push(bossCrown())
    game.pause()
    const before = JSON.stringify({
      boss: game.bossBattle,
      enemy: game.enemies[0],
      shots: game.bossProjectiles,
      time: game.time,
    })
    for (let frame = 0; frame < 120; frame++) {
      game.update(emptyInput())
    }
    expect(
      JSON.stringify({
        boss: game.bossBattle,
        enemy: game.enemies[0],
        shots: game.bossProjectiles,
        time: game.time,
      }),
    ).toBe(before)
  })
  for (const kind of ['crown', 'cannonball'] as const) {
    it(`ordinary ${kind} contact still damages the player`, () => {
      const game = new Game()
      game.start(6)
      game.player.x = 5
      game.player.y = 0
      game.player.invincible = 0
      game.bossProjectiles.push({
        ...bossCrown(5),
        kind,
        vx: 0,
        warning: 0,
        y: 0.7,
      })
      game.update(emptyInput())
      expect(game.player.hp).toBe(1)
      expect(game.lives).toBe(5)
    })
  }
  it('a warned cannonball is visible preparation rather than an immediate hit', () => {
    const game = new Game()
    game.start(6)
    game.player.x = 5
    game.player.invincible = 0
    game.bossProjectiles.push({
      ...bossCrown(5),
      kind: 'cannonball',
      vx: 0,
      warning: 0.55,
      y: 0.7,
    })
    game.update(emptyInput())
    expect(game.player.hp).toBe(2)
  })
})

describe('final battle jump fairness', () => {
  for (const active of [0, 1]) {
    for (const heldFrames of [1, 21, 90]) {
      it(`plush ${String(active)} can reach the enlarged head after ${String(heldFrames)} held frames without damage`, () => {
        expectPlushReachesBossHead(active, heldFrames)
      })
    }
  }
})

describe('final battle victory', () => {
  it('safely bounces on the crowned head without causing damage to either actor', () => {
    const game = new Game()
    game.start(6)
    const boss = game.enemies[0]
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
    game.update(emptyInput())
    expect(boss.hp).toBe(BOSS_MAX_HITS)
    expect(game.player.hp).toBe(2)
    expect(game.player.vy).toBeGreaterThan(0)
  })
  it('does not finish on the fake collapse but finishes after the final defeat animation', () => {
    const game = new Game()
    game.start(6)
    const boss = game.enemies[0]
    const battle = game.bossBattle
    expect(battle).toBeDefined()
    if (!battle) {
      return
    }
    Object.assign(battle, {
      phase: 'fakeDeath',
      phaseTime: 0,
      hits: 7,
    })
    boss.hp = 3
    for (let frame = 0; frame < 200; frame++) {
      game.update(emptyInput())
    }
    expect(game.phase).toBe('playing')
    expect(boss.alive).toBe(true)
    boss.hp = 0
    registerBossHit(battle, boss, game.bossProjectiles)
    game.update(emptyInput())
    expect(game.phase).toBe('playing')
    expect(boss.alive).toBe(true)
    for (let frame = 0; frame < 100; frame++) {
      game.update(emptyInput())
    }
    expect(game.phase).toBe('victory')
    expect(boss.alive).toBe(false)
  })
})
