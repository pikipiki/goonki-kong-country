import { describe, expect, it } from 'vitest'
import { Game, STEP } from '../src/game/engine'
import { advanceGame } from './helpers/simulation'
import { assertDefined } from './helpers/assertDefined'
import {
  updateBossBattle,
  createBossBattle,
  type BossActor,
} from '../src/game/bossBattle'

describe('engine coverage hooks — combat and pickups', () => {
  it('covers combat, pickups, barrels, thrown paths, and boss dead pose', () => {
    const letters = new Game()
    letters.start(0, true)
    letters.enemies = []
    const letterIds = letters.level.pickups
      .map((pickup2, index) => (pickup2.kind === 'letter' ? index : -1))
      .filter((index2) => index2 >= 0)
    letterIds.slice(0, -1).forEach((index3) => letters.letters.add(index3))
    const last = letters.level.pickups[assertDefined(letterIds.at(-1))]
    Object.assign(letters.player, { x: last.x, y: last.y - 1, grounded: true })
    const lives = letters.lives
    advanceGame(letters)
    expect(letters.lives).toBeGreaterThan(lives)

    const auto = new Game()
    auto.start(6)
    const cIdx = auto.level.barrels.findIndex(
      (barrel2) => barrel2.kind === 'cannon',
    )
    if (cIdx >= 0) {
      auto.level.barrels[cIdx].autoFire = true
      const barrel3 = auto.level.barrels[cIdx]
      Object.assign(auto.player, { x: barrel3.x, y: barrel3.y })
      advanceGame(auto)
    }

    const thrown = new Game()
    thrown.start(0, true)
    thrown.enemies = []
    const wall = assertDefined(thrown.level.breakableWalls)[1]
    thrown.thrown.push({
      x: wall.x,
      y: wall.y + 0.5,
      vx: 0,
      vy: 0,
      active: true,
    })
    advanceGame(thrown)

    const rambi = new Game()
    rambi.start(0)
    rambi.enemies = []
    rambi.animals[0].state = 'ridden'
    Object.assign(rambi.player, {
      mount: 0,
      x: rambi.enemies[0]?.x ?? 12,
      mountAttack: 0.3,
      facing: 1,
      invincible: 0,
    })
    advanceGame(rambi)

    const boss: BossActor = {
      x: 10,
      y: 3,
      vx: 0,
      vy: 0,
      min: 4,
      max: 18,
      hp: 1,
      vulnerable: false,
    }
    const state = createBossBattle(boss)
    state.phase = 'dead'
    updateBossBattle(state, boss, [], STEP)
    expect(boss.y).toBe(0)
  })
})
