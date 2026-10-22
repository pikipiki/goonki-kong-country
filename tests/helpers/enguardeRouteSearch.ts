import { ENGUARDE_SWIM_BODY } from '../../src/game/animals'
import {
  CORAL_WORLD_WIDTH,
  CORAL_WATER_SURFACE_Y,
  coralWorldFromSource,
} from '../../src/game/marineScale'
import {
  coralBodyBlocked,
  resolveCoralMotion,
} from '../../src/game/terrainSolids'
import type { Game } from '../../src/game/engine'
import { assertDefined } from './assertDefined'

export type RouteNode = { x: number; y: number; parent: number }

export function searchEnguardeRoute(game: Game): {
  nodes: RouteNode[]
  goal: number
  zone: NonNullable<Game['level']['finishZone']>
} {
  const startX = coralWorldFromSource(13)
  const startY = coralWorldFromSource(1)
  const nodes: RouteNode[] = [{ x: startX, y: startY, parent: -1 }]
  const seen = new Set([`${String(startX * 2)},${String(startY * 2)}`])
  let head = 0
  let goal = -1
  const zone = assertDefined(game.level.finishZone)
  while (head < nodes.length) {
    const current = nodes[head]
    if (reachedFinishZone(current, zone)) {
      goal = head
      break
    }
    expandEnguardeNeighbors(nodes, seen, head, current)
    head++
  }
  return { nodes, goal, zone }
}

function reachedFinishZone(
  current: RouteNode,
  zone: { x: number; y: number; w: number; h: number },
): boolean {
  return (
    Math.abs(current.x - zone.x) < zone.w / 2 - 0.25 &&
    current.y >= zone.y + 0.2 &&
    current.y <= zone.y + zone.h
  )
}

function expandEnguardeNeighbors(
  nodes: RouteNode[],
  seen: Set<string>,
  head: number,
  current: RouteNode,
): void {
  for (const [dxRef, dyRef] of [
    [0.5, 0],
    [-0.5, 0],
    [0, 0.5],
    [0, -0.5],
  ]) {
    const posX = current.x + dxRef
    const posY = current.y + dyRef
    const key = `${String(Math.round(posX * 2))},${String(Math.round(posY * 2))}`
    if (!isEnguardeCellOpen(posX, posY, seen, key)) {
      continue
    }
    const motion = resolveCoralMotion(
      current.x,
      current.y,
      posX,
      posY,
      ENGUARDE_SWIM_BODY,
    )
    if (
      Math.abs(motion.x - posX) > 0.001 ||
      Math.abs(motion.y - posY) > 0.001
    ) {
      continue
    }
    seen.add(key)
    nodes.push({ x: posX, y: posY, parent: head })
  }
}

function isEnguardeCellOpen(
  posX: number,
  posY: number,
  seen: Set<string>,
  key: string,
): boolean {
  if (posX < 0.5 || posX > CORAL_WORLD_WIDTH - 0.5) {
    return false
  }
  if (posY < -0.5 || posY > CORAL_WATER_SURFACE_Y - 0.5) {
    return false
  }
  if (seen.has(key)) {
    return false
  }
  return !coralBodyBlocked(posX, posY, ENGUARDE_SWIM_BODY)
}

export function buildEnguardeRoute(
  nodes: RouteNode[],
  goal: number,
): RouteNode[] {
  const route: RouteNode[] = []
  for (let index = goal; index >= 0; index = nodes[index].parent) {
    route.push(nodes[index])
  }
  route.reverse()
  return route
}
