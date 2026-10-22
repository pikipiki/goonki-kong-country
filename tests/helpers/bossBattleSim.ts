import { expect } from 'vitest'
import {
  BOSS_MAX_HITS,
  createBossBattle,
  registerBossHit,
  updateBossBattle,
  type BossActor,
  type BossBattle,
  type BossProjectile,
} from '../../src/game/bossBattle'
import { Game, STEP, emptyInput } from '../../src/game/engine'
import { ENEMY_DESIGNS } from '../../src/game/enemies'
export const bossActor = (): BossActor => ({
  x: 17,
  y: 0,
  vx: 0,
  vy: 0,
  min: 4,
  max: 18,
  hp: BOSS_MAX_HITS,
  vulnerable: false,
})
export const bossCrown = (posX = 5): BossProjectile => ({
  kind: 'crown',
  x: posX,
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
export function simulateBossUntil(
  state: BossBattle,
  boss: BossActor,
  shots: BossProjectile[],
  predicate: () => boolean,
  maxSeconds = 35,
) {
  for (let frame = 0; frame < maxSeconds / STEP; frame++) {
    if (predicate()) {
      return
    }
    updateBossBattle(state, boss, shots, STEP)
  }
  expect(
    predicate(),
    JSON.stringify({
      phase: state.phase,
      phaseTime: state.phaseTime,
      jumps: state.jumps,
      passes: state.passes,
      spawned: state.spawned,
    }),
  ).toBe(true)
}
export function expectPlushReachesBossHead(active: number, heldFrames: number) {
  const game = new Game()
  game.start(6)
  const boss = game.enemies[0]
  game.player.active = active
  game.player.x = boss.x - 4
  game.player.invincible = 0
  const battle = game.bossBattle
  expect(battle).toBeDefined()
  if (!battle) {
    return
  }
  Object.assign(battle, {
    phase: 'catch',
    phaseTime: 0,
    crowned: false,
  })
  game.bossProjectiles.push(bossCrown())
  const input = emptyInput()
  input.held.add('jump')
  input.held.add('right')
  input.held.add('run')
  input.pressed.add('jump')
  let maxHeight = 0
  for (let frame = 0; frame < 120 && boss.hp === BOSS_MAX_HITS; frame++) {
    if (frame >= heldFrames) {
      input.held.delete('jump')
    }
    if (game.player.x >= boss.x - 0.3) {
      input.held.delete('right')
    }
    game.update(input)
    maxHeight = Math.max(maxHeight, game.player.y)
  }
  expect(maxHeight).toBeGreaterThan(ENEMY_DESIGNS.boss.height)
  expect(boss.hp).toBe(BOSS_MAX_HITS - 1)
  expect(game.player.hp).toBe(2)
  expect(game.lives).toBe(5)
}
export function bossStateAfterHit(hits: number) {
  const boss = bossActor()
  const state = createBossBattle(boss)
  const shots: BossProjectile[] = []
  state.hits = hits - 1
  boss.hp = BOSS_MAX_HITS - hits
  registerBossHit(state, boss, shots)
  return { boss, state, shots }
}
