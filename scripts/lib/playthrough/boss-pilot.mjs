import { offlineGame, packGame as pack } from './driver.mjs'

const actions = [
  [],
  ['left', 'run'],
  ['right', 'run'],
  ['jump'],
  ['left', 'run', 'jump'],
  ['right', 'run', 'jump'],
  ['action'],
]
export function createBossPilot(Game, emptyInput) {
  const offline = (state) => offlineGame(Game, state)
  function plan(s, held) {
    let beam = [{ state: s, held, path: [], score: 0 }]
    for (let depth = 0; depth < 16; depth++) {
      let ns = []
      for (const node of beam)
        for (const action of actions) {
          const g = offline(node.state),
            i = emptyInput()
          i.held = new Set(action)
          i.pressed = new Set(action.filter((k) => !node.held.includes(k)))
          i.released = new Set(node.held.filter((k) => !action.includes(k)))
          for (let f = 0; f < 8; f++) g.update(i)
          if (g.lives < s.lives || g.phase === 'gameover') continue
          const p = g.player,
            b = g.enemies[0],
            st = g.bossBattle
          let score = (g.lives * 2 + p.hp) * 100000 + st.hits * 10000
          if (g.phase === 'victory') score += 10000000
          const dx = b.x - p.x,
            dist = Math.abs(dx)
          if (st.phase === 'catch') score -= dist * 12 + Math.abs(p.y - 2) * 2
          else if (['intro', 'throw', 'hurt'].includes(st.phase))
            score -= Math.abs(dist - 3.8) * 3
          else if (st.phase === 'run' || st.phase === 'jump')
            score += Math.min(5, dist) * 5
          // Retain central maneuvering space, avoid sitting at a boundary.
          score -= Math.max(0, 2 - p.x) * 5 + Math.max(0, p.x - 20) * 5
          ns.push({
            state: pack(g),
            held: action,
            path: [...node.path, action],
            score,
          })
        }
      const seen = new Set()
      beam = ns
        .sort((a, b) => b.score - a.score)
        .filter((n) => {
          const p = n.state.player,
            key = [
              Math.round(p.x * 3),
              Math.round(p.y * 3),
              Math.round(p.vx),
              Math.round(p.vy),
              p.hp,
              n.state.bossBattle.hits,
              n.held.join(','),
            ].join(':')
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        .slice(0, 18)
      if (!beam.length) return []
    }
    return beam[0].path[0]
  }
  return plan
}
