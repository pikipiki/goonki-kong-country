import { CORAL_WATER_FLOOR_Y } from '../src/game/marineScale'
import { describe, expect, it } from 'vitest'
import { Game, emptyInput, enemyRenderVisible } from '../src/game/engine'
import { ENEMY_DESIGNS } from '../src/game/enemies'
import {
  SWIM_BODY,
  terrainSolidSpans,
  resolveLandMotion,
  resolveCoralMotion,
  coralBodyBlocked,
} from '../src/game/terrainSolids'
import { assertDefined } from './helpers/assertDefined'
import { pick } from '../src/utils/pick'

const inputs = (
  ...keys: Parameters<
    Set<'left' | 'right' | 'up' | 'down' | 'jump'>['add']
  >[0][]
) => {
  const input = emptyInput()
  keys.forEach((key) => input.held.add(key))
  return input
}

describe('reported stage regressions', () => {
  it('never flashes a killed enemy back into view', () => {
    const game = new Game()
    game.start()
    const enemy = game.enemies[0]
    enemy.alive = false
    enemy.hurt = 1
    for (let tick = 0; tick < 2; tick += 0.01) {
      expect(enemyRenderVisible(enemy, tick, game)).toBe(false)
    }
  })
  it('replaces actor identities on every restart, including the same stage', () => {
    const game = new Game()
    game.start(0, true)
    const revision = game.sceneRevision,
      enemy = game.enemies[0]
    enemy.alive = false
    game.load(0)
    expect(game.sceneRevision).toBeGreaterThan(revision)
    expect(game.enemies[0]).not.toBe(enemy)
    expect(game.enemies[0].alive).toBe(true)
  })
  for (const original of [false, true]) {
    for (const idRef of [0, 1, 2, 4, 5]) {
      it(`keeps grounded enemy patrols on terrain: stage ${String(idRef)}, ROM ${String(original)}`, () => {
        const game = new Game()
        game.start(idRef, original)
        game.player.invincible = 100
        game.level.barrels.forEach((_, index) => game.usedBarrels.add(index))
        const enemies = game.enemies.filter(
          (entry) =>
            entry.kind !== 'bee' &&
            entry.kind !== 'boss' &&
            entry.pattern !== 'necky',
        )
        for (const enemy of enemies) {
          // Activate each actual spawn and let it patrol for several seconds.
          game.player.x = enemy.x
          game.player.y = 30
          for (let frame = 0; frame < 180; frame++) {
            game.phase = 'playing'
            game.player.x = enemy.x
            game.player.y = enemy.y + 4
            game.player.vy = 0
            game.player.invincible = 100
            game.update(emptyInput())
          }
          if (!enemy.alive) {
            continue
          }
          const floor = game.supportAt(enemy.x, enemy.y)
          if (enemy.vy === 0) {
            expect(
              floor,
              JSON.stringify({
                enemy,
                phase: game.phase,
                current: game.enemies.includes(enemy),
                player: game.player,
              }),
            ).not.toBeNull()
            expect(enemy.y).toBeCloseTo(assertDefined(floor), 4)
          } else {
            expect(enemy.vy).toBeLessThan(0)
          }
          expect(Number.isFinite(enemy.y)).toBe(true)
        }
      })
    }
  }
})

describe('marine swim regressions', () => {
  for (const posY of [0.8, 1.8, 2.8]) {
    it(`swims horizontally both ways at depth ${String(posY)} without phantom walls`, () => {
      const game = new Game()
      game.start(3, true)
      game.enemies = []
      game.animals = []
      game.player.x = 20
      game.player.y = posY
      for (let index2 = 0; index2 < 90; index2++) {
        game.update(inputs('right'))
      }
      expect(game.player.x).toBeGreaterThan(24)
      const rightEnd = game.player.x
      for (let index3 = 0; index3 < 90; index3++) {
        game.update(inputs('left'))
      }
      expect(game.player.x).toBeLessThan(rightEnd - 3.5)
      expect(game.lives).toBe(5)
    })
  }
  it('can swim left of the entry and dive/rise with four-direction input', () => {
    const game = new Game()
    game.start(3, true)
    game.enemies = []
    game.animals = []
    game.player.y = 2
    for (let index4 = 0; index4 < 60; index4++) {
      game.update(inputs('left'))
    }
    expect(game.player.x).toBeLessThan(assertDefined(game.level.start).x - 1)
    const before = game.player.y
    for (let index5 = 0; index5 < 20; index5++) {
      game.update(inputs('up'))
    }
    expect(game.player.y).toBeGreaterThan(before + 0.4)
    for (let index6 = 0; index6 < 30; index6++) {
      game.update(inputs('down'))
    }
    expect(game.player.y).toBeLessThan(before)
    expect(game.player.grounded).toBe(false)
  })
})

describe('marine reef swim regressions', () => {
  it('blocks swimming only at a rendered reef and permits sliding/escape', () => {
    let checked = 0
    for (let posX = 2; posX < 62; posX += 0.25) {
      const spans = terrainSolidSpans('coral', posX)
      for (const span of spans) {
        const posY2 = span.bottom - SWIM_BODY.height - 0.05
        if (coralBodyBlocked(posX, posY2)) {
          continue
        }
        const hit = resolveCoralMotion(posX, posY2, posX, posY2 + 0.4)
        expect(hit.y).toBeLessThan(posY2 + 0.4)
        expect(coralBodyBlocked(hit.x, hit.y)).toBe(false)
        checked++
      }
    }
    expect(checked).toBeGreaterThan(10)
  })
  it('lands on visible jungle shelves and collides with their underside', () => {
    const posX2 = 6
    const spans = terrainSolidSpans('jungle', posX2)
    expect(spans.length).toBeGreaterThan(1)
    const lower = spans[0],
      upper = spans[1]
    const landing = resolveLandMotion(
      'jungle',
      posX2,
      lower.top + 0.2,
      posX2,
      lower.top - 0.2,
      false,
      -5,
    )
    expect(landing.y).toBeCloseTo(lower.top)
    expect(landing.grounded).toBe(true)
    const head = upper.bottom
    const roof = resolveLandMotion(
      'jungle',
      posX2,
      head - 1.4,
      posX2,
      head - 1.2,
      false,
      5,
    )
    expect(roof.y + 1.35).toBeCloseTo(head)
    expect(roof.blockedY).toBe(true)
  })
})

describe('boss fight regressions', () => {
  it('bounces safely on the protected boss head and damages it when exposed', () => {
    const game = new Game()
    game.start(6)
    const boss = game.enemies[0],
      height = ENEMY_DESIGNS.boss.height
    for (const exposed of [false, true]) {
      Object.assign(assertDefined(game.bossBattle), {
        phase: pick(exposed, 'catch', 'throw'),
        phaseTime: 0,
        crowned: !exposed,
      })
      boss.y = 0
      boss.hurt = 0
      game.player.x = boss.x
      game.player.y = height + 0.03
      game.player.vy = -7
      game.player.hp = 2
      game.player.invincible = 0
      const health = boss.hp
      game.update(emptyInput())
      expect(game.player.hp).toBe(2)
      expect(game.player.vy).toBeGreaterThan(0)
      expect(game.player.y).toBeGreaterThanOrEqual(boss.y + height)
      expect(boss.hp).toBe(pick(exposed, health - 1, health))
    }
  })
  it('can defeat an exposed boss with an ordinary held jump from the deck', () => {
    const game = new Game()
    game.start(6)
    const boss = game.enemies[0],
      health2 = boss.hp
    // Trigger the actual crown throw, then approach with ordinary jump inputs.
    Object.assign(assertDefined(game.bossBattle), {
      phase: 'throw',
      phaseTime: 0.65,
    })
    game.update(emptyInput())
    expect(boss.vulnerable).toBe(true)
    expect(
      game.bossProjectiles.some(
        (pickup) => pickup.kind === 'crown' && pickup.active,
      ),
    ).toBe(true)
    game.player.x = boss.x - 4
    const input = inputs('jump', 'right')
    input.held.add('run')
    input.pressed.add('jump')
    for (let frame = 0; frame < 85 && boss.hp === health2; frame++) {
      if (game.player.x >= boss.x - 0.3) {
        input.held.delete('right')
      }
      game.update(input)
    }
    expect(boss.hp).toBe(health2 - 1)
    expect(game.player.hp).toBe(2)
  })
  it('enters Coral in clear water and dives away without being trapped', () => {
    const game = new Game()
    game.start(3, true)
    game.enemies = []
    game.animals = []
    expect(coralBodyBlocked(game.player.x, game.player.y)).toBe(false)
    for (let index7 = 0; index7 < 90; index7++) {
      game.update(inputs('down'))
    }
    expect(game.player.y).toBeCloseTo(CORAL_WATER_FLOOR_Y)
    expect(game.lives).toBe(5)
  })
  it('still damages side contact with the boss', () => {
    const game = new Game()
    game.start(6)
    const boss = game.enemies[0]
    boss.timer = 2.8
    game.player.x = boss.x
    game.player.y = 0
    game.update(emptyInput())
    expect(game.player.hp).toBe(1)
  })
})
