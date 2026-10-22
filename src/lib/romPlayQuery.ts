import { CORAL_WATER_FLOOR_Y, CORAL_WATER_SURFACE_Y } from '../game/marineScale'
import type { Game } from '../game/engine'
import { clamp } from '../game/engine/math'
import { FINAL_BOSS_STAGE_ID } from '../game/stageCatalog'
import { romRouteAliases, coralPreview } from '../config/stages.json'

const aliases: Readonly<Record<string, number>> = romRouteAliases
// Debug coordinates must stay finite and within a bounded simulation domain.
const QUERY_WORLD_Y_LIMIT = 64
export function isDemo2DQuery(params: URLSearchParams): boolean {
  return (
    params.get('demo') === '2d' ||
    params.get('mode') === '2d' ||
    params.get('play') === '2d'
  )
}
export function romRouteLevel(params: URLSearchParams): number | null {
  const name = params.get('play') ?? params.get('level')
  return name !== null && Object.hasOwn(aliases, name) ? aliases[name] : null
}
function coordinateParam(
  params: URLSearchParams,
  key: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const raw = params.get(key)
  if (raw === null || raw.trim() === '') return fallback
  const value = Number(raw)
  return Number.isFinite(value) ? clamp(value, minimum, maximum) : fallback
}
function applyCoordinates(
  game: Game,
  params: URLSearchParams,
  defaultX: number,
  defaultY: number,
) {
  game.player.x = coordinateParam(params, 'x', defaultX, 0, game.level.length)
  const water = game.level.biome === 'lagoon'
  game.player.y = coordinateParam(
    params,
    'y',
    defaultY,
    water ? CORAL_WATER_FLOOR_Y : -QUERY_WORLD_Y_LIMIT,
    water ? CORAL_WATER_SURFACE_Y : QUERY_WORLD_Y_LIMIT,
  )
}
export function applyDemoPlayQuery(game: Game, params: URLSearchParams) {
  const stage = params.get('stage')
  game.start(
    stage === 'boss' || stage === String(FINAL_BOSS_STAGE_ID)
      ? FINAL_BOSS_STAGE_ID
      : 0,
    true,
  )
  applyCoordinates(game, params, game.player.x, game.player.y)
}
export function applyRomPlayQuery(
  game: Game,
  params: URLSearchParams,
): boolean {
  const levelId = romRouteLevel(params)
  if (levelId === null) return false
  game.start(levelId, true)
  if (levelId !== 3 || params.get('depth') === 'start') return true
  const depth = params.get('depth')
  let defaultY = coralPreview.midY
  if (depth === 'deep') defaultY = coralPreview.deepY
  if (depth === 'shallow') defaultY = coralPreview.shallowY
  applyCoordinates(game, params, coralPreview.x, defaultY)
  game.player.vx = 0
  game.player.vy = 0
  game.player.grounded = false
  game.checkpoint = { x: game.player.x, y: game.player.y }
  return true
}
