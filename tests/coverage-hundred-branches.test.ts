import { expect, it } from 'vitest'
import { Game } from '../src/game/engine'
import { cannonAimAngle } from '../src/game/engine/gameSessionCannon'
import type { Animal } from '../src/game/animals'

const ridden = (kind: Animal['kind']): Animal => ({
  kind,
  x: 5,
  y: 0.2,
  state: 'ridden',
  vx: 0,
  vy: 0,
  facing: 1,
  timer: 0,
})

it('covers a cannon barrel that has no aim angle', () => {
  const game = new Game()
  game.start(0, true)
  const index = game.level.barrels.findIndex(
    (barrel) => barrel.kind === 'cannon',
  )
  const barrel = game.level.barrels[index]
  const angle = barrel.angle
  try {
    barrel.angle = undefined
    expect(cannonAimAngle(game, index)).toBeTypeOf('number')
  } finally {
    barrel.angle = angle
  }
})

it('covers rambi wall rams and a token without a token bag', () => {
  const game = new Game()
  game.start(0, false)
  const walls = game.level.breakableWalls
  const decors = game.level.decors
  try {
    game.level.breakableWalls = [{ x: 5, y: 0, w: 2, h: 2 }]
    game.player.x = 5
    game.player.y = 0.2
    game.player.roll = 0
    game.animals = [ridden('expresso')]
    game.player.mount = 0
    game.player.mountAttack = 0
    game.player.vx = 0
    game.resolveBreakableWalls(game.player, game.player.x)
    expect(game.brokenWalls.size).toBe(0)
    game.animals = [ridden('rambi')]
    game.player.mountAttack = 0.2
    game.player.vx = 0
    game.resolveBreakableWalls(game.player, game.player.x)
    expect(game.brokenWalls.has(0)).toBe(true)
    game.brokenWalls.clear()
    game.player.mountAttack = 0
    game.player.vx = 0.4
    game.resolveBreakableWalls(game.player, game.player.x)
    expect(game.brokenWalls.has(0)).toBe(true)
    game.level.decors = [{ kind: 'token', x: 4, y: 1, animal: 'expresso' }]
    Reflect.deleteProperty(game, 'animalTokens')
    game.player.x = 4
    game.player.y = 1
    game.collectAnimalTokens(game.player)
    expect(game.animalTokens.expresso).toBe(1)
  } finally {
    game.level.breakableWalls = walls
    game.level.decors = decors
  }
})
