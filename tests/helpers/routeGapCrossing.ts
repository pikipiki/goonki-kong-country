import { Game, emptyInput } from '../../src/game/engine'
import type { Level } from '../../src/game/levels'

type LevelPlatform = Level['platforms'][number]

export function tryCrossPlatformGap(
  level: Level,
  from: LevelPlatform,
  toRef: LevelPlatform,
  left: number,
  active: number,
  offset: number,
  startTime: number,
): boolean {
  const game = new Game()
  game.start(level.id)
  game.enemies = []
  game.time = startTime
  game.level.barrels.forEach((_, barrelIndex) =>
    game.usedBarrels.add(barrelIndex),
  )
  let runMultiplier
  if (active) {
    runMultiplier = 1.125
  } else {
    runMultiplier = 1
  }
  let horizontalSpeed
  if (level.biome === 'mine') {
    horizontalSpeed = 8.5
  } else {
    horizontalSpeed = 5.625 * runMultiplier
  }
  Object.assign(game.player, {
    x: from.x + from.w / 2 - offset,
    y: game.surface(from),
    vx: horizontalSpeed,
    active,
    grounded: true,
  })
  const input = emptyInput()
  input.held.add('right')
  input.held.add('run')
  input.held.add('jump')
  input.pressed.add('jump')
  for (let frame = 0; frame < 100; frame++) {
    game.update(input)
    if (game.lives < 5) {
      return false
    }
    if (
      game.player.grounded &&
      game.player.x >= left - 0.29 &&
      game.player.x < toRef.x + toRef.w / 2 + 0.3 &&
      Math.abs(game.player.y - game.surface(toRef)) < 0.2
    ) {
      return true
    }
  }
  return false
}
