import { offlineGame, packGame as pack } from './driver.mjs'

const actions = [
  ['right', 'run'],
  ['right', 'run', 'jump'],
  ['right', 'run', 'action'],
  ['right', 'jump'],
  ['right'],
  ['jump'],
  [],
  ['left', 'jump'],
  ['left'],
]

export function createCanyonPilot(Game, emptyInput, rules) {
  const offline = (state) => offlineGame(Game, state)
  let upperMode = ''
  function plan(state, heldKeys) {
    let beam = [{ state, held: heldKeys, path: [], score: 0 }],
      initialHp = state.player.hp
    for (let depth = 0; depth < 24; depth++) {
      const candidates = []
      for (const node of beam)
        for (const action of actions) {
          const g = offline(node.state)
          const input = emptyInput()
          input.held = new Set(action)
          input.pressed = new Set(action.filter((k) => !node.held.includes(k)))
          input.released = new Set(node.held.filter((k) => !action.includes(k)))
          let lost = false
          for (let f = 0; f < 6; f++) {
            g.update(input)
            if (
              g.lives < state.lives ||
              g.phase === 'gameover' ||
              g.levelId !== 1
            ) {
              lost = true
              break
            }
            if (g.phase === 'clear') break
          }
          if (lost) continue
          const p = g.player
          let score =
            p.x * 3 +
            (p.x > 89 && p.x < 109 ? Math.min(0, p.y - 5.5) * 14 : 0) +
            (p.hp - initialHp) * 25 +
            (p.grounded ? 0.3 : 0) +
            (p.cannon >= 0 ? 1 : 0)
          if (p.y < -5 && p.vy < 0)
            score -= (Math.abs(p.y) + Math.abs(p.vy)) * 2
          const below = g.supportAt(p.x, p.y, 0.1),
            ahead = g.supportAt(p.x + 1.5, p.y, 0.1)
          if (p.grounded && (ahead === null || ahead < p.y - 1.25)) score -= 9
          if (!p.grounded && p.vy < 0 && (below === null || p.y - below > 4))
            score -= 8
          if (g.phase === 'clear') score += 100000
          candidates.push({
            state: pack(g),
            held: action,
            path: [...node.path, action],
            score,
          })
        }
      const seen = new Set()
      beam = candidates
        .sort((a, b) => b.score - a.score)
        .filter((n) => {
          const p = n.state.player,
            key = [
              Math.round(p.x * 3),
              Math.round(p.y * 3),
              Math.round(p.vx),
              Math.round(p.vy),
              p.cannon,
              p.hp,
              n.held.join(','),
            ].join(':')
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
      const buckets = new Map()
      beam = beam
        .filter((node) => {
          const key = node.path[0].join(',')
          const count = buckets.get(key) ?? 0
          if (count >= 4) return false
          buckets.set(key, count + 1)
          return true
        })
        .slice(0, 36)
      if (!beam.length) return []
    }
    return beam[0].path[0]
  }
  return (state, held) => {
    const p = state.player
    let action
    if (p.cannon >= 14 || p.x > 109) upperMode = ''
    if (p.cannon === 12) upperMode = 'rise'
    if (
      p.x > 91 &&
      p.x < 110 &&
      p.y < 5.2 &&
      p.cannon < 0 &&
      upperMode !== 'rise' &&
      upperMode !== 'land'
    )
      upperMode = 'recover'
    const override = rules.find((rule) =>
      Object.entries(rule.when || {}).every(([key, value]) =>
        Array.isArray(value)
          ? p[key] >= (value[0] ?? -Infinity) &&
            p[key] <= (value[1] ?? Infinity)
          : p[key] === value,
      ),
    )
    if (override) action = override.keys
    else if (upperMode === 'recover') {
      const target = offline(state).cannonPosition(12).x,
        dx = target - p.x - 0.2 * p.vx
      action =
        Math.abs(dx) < 0.18
          ? []
          : [dx > 0 ? 'right' : 'left', ...(p.x > 88 ? ['run', 'jump'] : [])]
    } else if (p.cannon === 12) action = p.x >= 85.5 ? ['jump'] : []
    else if (p.cannon === 24) {
      const shot = offline(state),
        probe = emptyInput()
      probe.held.add('jump')
      probe.pressed.add('jump')
      let caught = false
      for (let f = 0; f < 60; f++) {
        shot.update(probe)
        if (shot.player.cannon === 25) {
          caught = true
          break
        }
        if (shot.lives < state.lives) break
      }
      action = caught ? ['jump'] : []
    } else if (upperMode === 'rise') {
      if (p.y >= 7.6 || p.vy < 0) upperMode = 'land'
      action = upperMode === 'rise' ? ['jump'] : ['right', 'run', 'jump']
    } else if (upperMode === 'land') {
      action = p.vy > 0 ? ['right', 'run', 'jump'] : ['right', 'run']
      if (p.grounded) upperMode = p.y >= 7.4 ? 'route' : 'recover'
    } else if (p.cannon < 0 && p.x >= 69 && p.x < 79 && p.y < 2)
      action = ['right']
    else if (
      p.cannon < 0 &&
      p.x >= 88.5 &&
      p.x < 90.1 &&
      p.grounded &&
      p.y >= 7.4
    )
      action = ['right', 'run']
    else if (
      p.cannon < 0 &&
      p.x >= 90.1 &&
      p.x < 91.2 &&
      p.grounded &&
      p.y >= 7.4 &&
      p.roll === 0
    )
      action = ['right', 'run', 'action']
    else if (p.cannon < 0 && p.x >= 90.1 && p.x < 99 && p.roll > 0)
      action = p.roll > 0.22 ? ['right', 'run'] : ['right', 'run', 'jump']
    else if (p.cannon < 0 && p.x >= 90.1 && p.x < 101 && p.rollJumpMomentum > 0)
      action = ['right', 'run', 'jump']
    else if (
      p.cannon < 0 &&
      p.x >= 98.8 &&
      p.x < 101.1 &&
      p.grounded &&
      p.y >= 5.4
    )
      action = ['right', 'run']
    else if (
      p.cannon < 0 &&
      p.x >= 101.1 &&
      p.x < 102 &&
      p.grounded &&
      p.y >= 5.4
    )
      action = ['right', 'run', 'jump']
    else if (
      p.cannon < 0 &&
      p.x >= 101 &&
      p.x < 106 &&
      !p.grounded &&
      p.y >= 5.4
    )
      action = ['right', 'run', 'jump']
    else if (p.cannon < 0 && p.x >= 104 && p.x < 109 && p.y >= 7.4)
      action = ['right', 'run']
    else action = plan(state, held)
    // A held jump is not a fresh fire command in a manual cannon.
    if (
      p.grounded &&
      p.roll === 0 &&
      action.includes('action') &&
      held.includes('action')
    ) {
      action = action.filter((key) => key !== 'action')
    }
    if (p.cannon >= 0)
      action = action.filter(
        (key) => !held.includes(key) || !['jump', 'action'].includes(key),
      )
    return action
  }
}
