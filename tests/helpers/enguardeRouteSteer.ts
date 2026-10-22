import { expect } from 'vitest'
import type { Game } from '../../src/game/engine'
import { emptyInput } from '../../src/game/engine'
import type { RouteNode } from './enguardeRouteSearch'

export function steerEnguardeAlongRoute(game: Game, route: RouteNode[]): void {
  for (const node of route) {
    let frames = 0
    while (
      game.phase === 'playing' &&
      Math.hypot(game.player.x - node.x, game.player.y - node.y) > 0.12 &&
      frames++ < 180
    ) {
      applyEnguardeSteeringInput(game, node)
    }
    expect(
      frames,
      JSON.stringify({ target: node, player: game.player }),
    ).toBeLessThan(180)
    if (game.phase === 'clear') {
      break
    }
  }
}

function applyEnguardeSteeringInput(game: Game, node: RouteNode): void {
  const input = emptyInput()
  const dxRef2 = node.x - game.player.x
  const dyRef2 = node.y - game.player.y
  if (Math.abs(dxRef2) > 0.045) {
    if (dxRef2 > 0) {
      input.held.add('right')
    } else {
      input.held.add('left')
    }
  }
  if (Math.abs(dyRef2) > 0.045) {
    if (dyRef2 > 0) {
      input.held.add('up')
    } else {
      input.held.add('down')
    }
  }
  game.update(input)
}
