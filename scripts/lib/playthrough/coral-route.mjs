export function findRoute(s, target, body, geometry, avoid = true) {
  const {
    coralBodyBlocked,
    resolveCoralMotion,
    CORAL_WORLD_WIDTH,
    CORAL_WATER_FLOOR_Y,
    CORAL_WATER_SURFACE_Y,
  } = geometry
  const grid = 0.5,
    sx = Math.round(s.player.x * 2) / 2,
    sy = Math.round(s.player.y * 2) / 2
  const start = { x: sx, y: sy, parent: -1, cost: 0 },
    nodes = [start],
    seen = new Map([[`${sx},${sy}`, 0]]),
    queue = [0]
  let goal = -1
  // A* with a soft cost for enemies' current swim volume; hazards stay active.
  while (queue.length) {
    let best = 0
    for (let k = 1; k < queue.length; k++)
      if (nodes[queue[k]].score < nodes[queue[best]].score) best = k
    const index = queue.splice(best, 1)[0],
      n = nodes[index]
    if (
      Math.abs(n.x - target.x) < target.w / 2 - 0.2 &&
      n.y >= target.y + 0.1 &&
      n.y <= target.y + target.h - 0.1
    ) {
      goal = index
      break
    }
    for (const [dx, dy] of [
      [grid, 0],
      [-grid, 0],
      [0, grid],
      [0, -grid],
    ]) {
      const x = n.x + dx,
        y = n.y + dy,
        key = `${x},${y}`
      if (
        x < 0.5 ||
        x > CORAL_WORLD_WIDTH - 0.5 ||
        y < CORAL_WATER_FLOOR_Y + 0.1 ||
        y > CORAL_WATER_SURFACE_Y - 0.5 ||
        coralBodyBlocked(x, y, body)
      )
        continue
      const motion = resolveCoralMotion(n.x, n.y, x, y, body)
      if (Math.abs(motion.x - x) > 0.001 || Math.abs(motion.y - y) > 0.001)
        continue
      let risk = 0
      if (avoid)
        for (const e of s.enemies.filter((enemy) => enemy.alive)) {
          const d = Math.hypot((x - e.x) * 0.9, y + 0.4 - e.y - 0.6)
          if (d < 3) risk += (3 - d) * 6
        }
      const cost = n.cost + grid + risk,
        old = seen.get(key)
      if (old !== undefined && nodes[old].cost <= cost) continue
      const node = {
        x,
        y,
        parent: index,
        cost,
        score: cost + Math.abs(x - target.x) + Math.abs(y - target.y),
      }
      const i = nodes.push(node) - 1
      seen.set(key, i)
      queue.push(i)
    }
  }
  if (goal < 0) return null
  const route = []
  for (let i = goal; i >= 0; i = nodes[i].parent)
    route.push({ x: nodes[i].x, y: nodes[i].y })
  route.reverse()
  return route
}

// Follow the dense collision-checked route, aiming ahead along clear water.
// Requiring a .22-unit stop at every compressed corner caused oscillation,
// especially on Enguarde and on slower browser frames.
function clearSegment(player, target, body, geometry) {
  const distance = Math.hypot(target.x - player.x, target.y - player.y),
    steps = Math.max(1, Math.ceil(distance / 0.2))
  for (let step = 1; step <= steps; step++) {
    const mix = step / steps,
      x = player.x + (target.x - player.x) * mix,
      y = player.y + (target.y - player.y) * mix
    if (geometry.coralBodyBlocked(x, y, body)) return false
  }
  return true
}
export function followRoute(route, player, body, geometry) {
  let furthest = -1
  for (let index = 0; index < Math.min(route.length, 40); index++) {
    if (
      Math.hypot(route[index].x - player.x, route[index].y - player.y) <= 4 &&
      clearSegment(player, route[index], body, geometry)
    )
      furthest = index
  }
  if (furthest > 0) route.splice(0, furthest)
  if (
    route.length === 1 &&
    Math.hypot(route[0].x - player.x, route[0].y - player.y) < 0.4
  )
    route.shift()
  return route[0]
}
