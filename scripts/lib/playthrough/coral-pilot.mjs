import { offlineGame, packGame as pack } from './driver.mjs'
import { findRoute, followRoute } from './coral-route.mjs'

export function createCoralPilot(Game, emptyInput, geometry) {
  const { ENGUARDE_SWIM_BODY, ANIMAL_DESIGNS, ENEMY_DESIGNS, SWIM_BODY } =
    geometry
  let route = [],
    target = null,
    targetKind = 'exit',
    stuck = 0,
    lastXY = null
  function steering(state, target, held) {
    const choices = [
      [],
      ['left'],
      ['right'],
      ['up'],
      ['down'],
      ['left', 'up'],
      ['right', 'up'],
      ['left', 'down'],
      ['right', 'down'],
    ]
    if (state.player.mount >= 0)
      choices.push(['left', 'jump'], ['right', 'jump'])
    let beam = [{ state, held: [...held], path: [], score: 0 }]
    for (let depth = 0; depth < 5; depth++) {
      const candidates = []
      for (const node of beam)
        for (const choice of choices) {
          const game = offlineGame(Game, node.state)
          const input = emptyInput()
          for (const key of choice) {
            input.held.add(key)
            if (!node.held.includes(key)) input.pressed.add(key)
          }
          for (const key of node.held)
            if (!choice.includes(key)) input.released.add(key)
          let danger = 0
          for (let frame = 0; frame < 6; frame++) {
            game.update(input)
            const player = game.player
            const bodyHeight =
                player.mount >= 0 ? ENGUARDE_SWIM_BODY.height : 0.95,
              bodyWidth =
                player.mount >= 0 ? ANIMAL_DESIGNS.enguarde.width : 0.3
            let risk = 0
            for (const enemy of game.enemies.filter((enemy) => enemy.alive)) {
              if (
                player.mount >= 0 &&
                player.mountAttack > 0 &&
                player.facing * (enemy.x - player.x) > -0.2
              )
                continue
              const design = ENEMY_DESIGNS[enemy.kind],
                gapX = Math.abs(player.x - enemy.x) - design.width - bodyWidth
              const gapY = Math.max(
                enemy.y - player.y - bodyHeight,
                player.y - enemy.y - design.height,
              )
              risk += Math.max(0, 1 - Math.max(gapX, gapY)) * 12
            }
            danger = Math.max(danger, risk)
          }
          const player = game.player
          let score =
            Math.hypot(player.x - target.x, player.y - target.y) * 8 + danger
          score +=
            (state.player.hp - player.hp) * 10000 +
            (state.lives - game.lives) * 100000
          if (state.player.mount >= 0 && player.mount < 0) score += 1000
          if (game.phase === 'clear') score -= 1000000
          candidates.push({
            state: pack(game),
            held: choice,
            path: [...node.path, choice],
            score,
          })
        }
      const seen = new Set()
      beam = candidates
        .sort((left, right) => left.score - right.score)
        .filter((node) => {
          const player = node.state.player,
            key = [
              Math.round(player.x * 10),
              Math.round(player.y * 10),
              Math.round(player.vx),
              Math.round(player.vy),
              player.hp,
              player.mount,
              node.held.join(','),
            ].join(':')
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        .slice(0, 10)
    }
    return beam[0]?.path[0] || []
  }
  return (state, held, step) => {
    const player = state.player
    const body = player.mount >= 0 ? ENGUARDE_SWIM_BODY : SWIM_BODY
    if (!target || (targetKind === 'animal' && player.mount >= 0)) {
      target = state.stageFinish
      targetKind = 'exit'
      route = []
      if (player.mount < 0) {
        let best = null
        for (const animal of state.animals.filter(
          (animal) => animal.state === 'crate' || animal.state === 'idle',
        )) {
          const zone = { x: animal.x, y: animal.y - 0.3, w: 1.7, h: 1.3 }
          const candidate = findRoute(state, zone, body, geometry)
          if (candidate && (!best || candidate.length < best.route.length))
            best = { zone, route: candidate }
        }
        if (best) {
          target = best.zone
          route = best.route
          targetKind = 'animal'
        }
      }
    }
    if (!route.length) route = findRoute(state, target, body, geometry) || []
    const next = followRoute(route, player, body, geometry)
    const crate = state.animals.some(
      (animal) =>
        animal.state === 'crate' &&
        Math.abs(animal.x - player.x) < 1.6 &&
        Math.abs(animal.y - player.y) < 1.7,
    )
    const action = next ? steering(state, next, held) : []
    if (!next && targetKind === 'animal' && player.mount < 0) target = null
    if (crate && step % 4 === 0) action.push('action')
    if (lastXY && Math.hypot(player.x - lastXY.x, player.y - lastXY.y) < 0.015)
      stuck++
    else stuck = 0
    if (stuck > 30) {
      route = []
      stuck = 0
    }
    lastXY = { x: player.x, y: player.y }
    return action
  }
}
