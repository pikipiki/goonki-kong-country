import { ENEMY_DESIGNS } from '../src/game/enemies'
import { describe, it, expect } from 'vitest'
import { Game, emptyInput, readSave } from '../src/game/engine'
import { LEVELS } from '../src/game/levels'
import { assertDefined } from './helpers/assertDefined'

function advance(
  game: Game,
  held: Parameters<Set<string>['add']>[0][],
  frames: number,
) {
  const input = emptyInput()
  held.forEach((key) => input.held.add(key as never))
  for (let count = 0; count < frames; count++) {
    game.update(input)
  }
}

describe('campaign progression', () => {
  it('clears a level, unlocks the next and preserves the best time', () => {
    const game = new Game()
    game.start()
    let saved = false
    game.onSave = () => {
      saved = true
    }
    game.time = 40
    game.finish()
    expect(game.phase).toBe('clear')
    expect(game.save.unlocked).toBe(1)
    expect(saved).toBe(true)
    game.load(0)
    game.time = 50
    game.finish()
    expect(game.save.best[0].time).toBe(40)
  })
  it('does not clear the boss level by reaching its edge', () => {
    const game = new Game()
    game.start(6)
    game.player.x = 45
    game.update(emptyInput())
    expect(game.phase).toBe('playing')
  })
})

describe('boss campaign and saves', () => {
  it('allows ten vulnerable boss hits to complete the campaign', () => {
    const game = new Game()
    game.start(6)
    const boss = game.enemies[0]
    for (let count3 = 0; count3 < 10; count3++) {
      Object.assign(assertDefined(game.bossBattle), {
        phase: 'catch',
        phaseTime: 0.05,
        crowned: false,
      })
      boss.timer = 2.8
      boss.hurt = 0
      boss.y = 0
      game.player.x = boss.x
      game.player.y = ENEMY_DESIGNS.boss.height - 0.09
      game.player.vy = -1
      game.update(emptyInput())
    }
    expect(boss.hp).toBe(0)
    game.player.x = 1
    for (let count4 = 0; count4 < 100; count4++) {
      game.update(emptyInput())
    }
    expect(game.phase).toBe('victory')
    expect(game.save.unlocked).toBe(6)
  })
})

describe('boss protection and pause', () => {
  it('protects the boss outside its recovery window', () => {
    const game = new Game()
    game.start(6)
    const boss = game.enemies[0]
    game.player.x = boss.x
    game.player.y = ENEMY_DESIGNS.boss.height - 0.09
    game.player.vy = -1
    game.update(emptyInput())
    expect(boss.hp).toBe(10)
  })
  it('pauses the simulation including timers and movement', () => {
    const game = new Game()
    game.start()
    game.pause()
    advance(game, ['right'], 60)
    expect(game.time).toBe(0)
    expect(game.player.x).toBe(3)
    game.pause()
    expect(game.phase).toBe('playing')
  })
  it('rejects malformed save records', () => {
    expect(readSave('{')).toEqual({ unlocked: 0, best: {} })
    expect(readSave('{"unlocked":99,"best":{}}').unlocked).toBe(6)
    expect(readSave('{"unlocked":2,"best":{"0":{"time":null}}}').best).toEqual(
      {},
    )
  })
  it('contains seven complete routes and letters outside the boss arena', () => {
    expect(LEVELS).toHaveLength(7)
    for (const level of LEVELS) {
      if (level.biome === 'ship') {
        expect(level.pickups).toEqual([])
      } else {
        expect(
          level.pickups
            .filter((pickup2) => pickup2.kind === 'letter')
            .map((pickup3) => pickup3.letter)
            .join(''),
        ).toBe('GOONK')
      }
      expect(
        level.platforms.some(
          (pickup4) => pickup4.x + pickup4.w / 2 >= level.length,
        ),
      ).toBe(true)
    }
  })
  it('ends the run after the final life', () => {
    const game = new Game()
    game.start()
    game.lives = 1
    game.damage(true)
    expect(game.phase).toBe('gameover')
  })
})
