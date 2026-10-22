import { expect } from 'vitest'
import { Game, emptyInput } from '../../src/game/engine'
import { assertDefined } from './assertDefined'

export function runMineBirdLandingTrial(
  birdX: number,
  active: number,
  phase: number,
  held: number,
): void {
  const game = new Game()
  game.start(2, true)
  let bounced = false
  let hurt = false
  const bird = assertDefined(
    game.enemies.find(
      (entry) => entry.pattern === 'necky' && entry.x === birdX,
    ),
  )
  for (const entry2 of game.enemies) {
    let neckyPhase
    if (entry2.pattern === 'necky') {
      neckyPhase = 1.55
    } else {
      neckyPhase = 2
    }
    entry2.timer = phase / neckyPhase
    let hover
    if (entry2.pattern === 'necky') {
      hover = 0.42
    } else {
      hover = entry2.hoverAmplitude ?? 0.6
    }
    entry2.y = entry2.originY + Math.sin(phase) * hover
  }
  Object.assign(game.player, {
    active,
    x: bird.x - 0.6,
    y: bird.y + 0.78,
    vy: -8,
    vx: 8.5,
    grounded: false,
    invincible: 0,
  })
  game.onEvent = (entry3) => {
    if (entry3 === 'bounce') {
      bounced = true
    }
    if (entry3 === 'hurt') {
      hurt = true
    }
  }
  let goal
  if (birdX < 200) {
    goal = 124
  } else {
    goal = 430
  }
  for (let frame = 0; frame < 260 && game.player.x < goal; frame++) {
    const input = emptyInput()
    if (frame < held) {
      input.held.add('jump')
    }
    game.update(input)
  }
  const evidence = JSON.stringify({
    birdX,
    active,
    phase,
    held,
    player: game.player,
  })
  expect(bounced, evidence).toBe(true)
  expect(hurt, evidence).toBe(false)
  expect(game.lives, evidence).toBe(5)
  expect(game.player.hp, evidence).toBe(2)
  expect(game.player.x, evidence).toBeGreaterThanOrEqual(goal)
  expect(game.player.grounded, evidence).toBe(true)
  expect(game.player.cartRebound, evidence).toBe(false)
}
