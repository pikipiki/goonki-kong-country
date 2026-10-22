import { describe, expect, it } from 'vitest'
import {
  ROM_REVERB,
  ORIGINAL_REVERB_PROVENANCE,
} from '../src/game/originalReverb'
import { Game, emptyInput } from '../src/game/engine'
import tables from '../reference/level-tables.json'
import { assertDefined } from './helpers/assertDefined'
describe('Barrel Cannon Canyon grouped spawns', () => {
  it('imports the 36 direct cannons and 14 cannons from six child lists', () => {
    const imported = ORIGINAL_REVERB_PROVENANCE.imported.filter(
      (row) => row.spriteId === 56,
    )
    expect(imported).toHaveLength(50)
    expect(imported.filter((row2) => 'parentGroupOffset' in row2)).toHaveLength(
      14,
    )
    expect(
      ROM_REVERB.barrels.filter((barrel) => barrel.kind === 'cannon'),
    ).toHaveLength(50)
    expect(ROM_REVERB.barrels[0].cannonGravityDelay).toBeTypeOf('number')
    expect(ROM_REVERB.barrels[0].angle).toBeTypeOf('number')
  })
  it('preserves all 18 decoded child actors and their parent provenance', () => {
    const groups = tables.levels.ReverbCave.spawnList.records.filter(
      (row3) => 'groupedSpawnList' in row3,
    )
    expect(groups).toHaveLength(6)
    let childCount = 0
    for (const group of groups) {
      for (const child of assertDefined(group.groupedSpawnList).records) {
        childCount++
        expect(child.script.partial).toBe(false)
        const actor = ORIGINAL_REVERB_PROVENANCE.imported.find(
          (actor) => actor.offset === child.offset,
        )
        expect(actor, child.offset).toBeDefined()
        expect(
          actor && 'parentGroupOffset' in actor && actor.parentGroupOffset,
        ).toBe(group.offset)
      }
    }
    expect(childCount).toBe(18)
    expect(
      ORIGINAL_REVERB_PROVENANCE.omitted.some(
        (row4) => row4.spawnCommand === 5,
      ),
    ).toBe(false)
  })
  it('reaches the previously missing receiver at x260 from direct cannon31', () => {
    const game = new Game()
    game.start(1, true)
    game.enemies = []
    game.animals = []
    const receiver = game.level.barrels.findIndex(
      (barrel2) =>
        barrel2.kind === 'cannon' &&
        barrel2.x === 260 &&
        barrel2.y === -1.84375,
    )
    expect(receiver).toBeGreaterThanOrEqual(0)
    const barrel3 = game.level.barrels[31]
    Object.assign(game.player, {
      x: barrel3.x,
      y: barrel3.y,
      cannon: 31,
      grounded: false,
    })
    const input = emptyInput()
    input.pressed.add('action')
    game.update(input)
    for (let frame = 0; frame < 90 && game.player.cannon < 0; frame++) {
      game.update(emptyInput())
    }
    expect(game.player.cannon).toBe(receiver)
    expect(game.lives).toBe(5)
  })
})
