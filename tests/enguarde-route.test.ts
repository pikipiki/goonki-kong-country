import { it, expect } from 'vitest'
import { Game } from '../src/game/engine'
import { coralWorldFromSource } from '../src/game/marineScale'
import {
  buildEnguardeRoute,
  searchEnguardeRoute,
} from './helpers/enguardeRouteSearch'
import { steerEnguardeAlongRoute } from './helpers/enguardeRouteSteer'

it('can steer the mounted fish through the reef corridor up to the exit', () => {
  const game = new Game()
  game.start(3, true)
  game.enemies = []
  game.animals[0].state = 'ridden'
  Object.assign(game.player, {
    mount: 0,
    x: coralWorldFromSource(13),
    y: coralWorldFromSource(1),
    vx: 0,
    vy: 0,
    invincible: 0,
  })
  const { nodes, goal, zone } = searchEnguardeRoute(game)
  expect(goal).toBeGreaterThan(0)
  const route = buildEnguardeRoute(nodes, goal)
  steerEnguardeAlongRoute(game, route)
  expect(
    game.phase,
    JSON.stringify({ player: game.player, goal: nodes[goal], zone }),
  ).toBe('clear')
  expect(game.mount?.kind).toBe('enguarde')
  expect(game.lives).toBe(5)
})
