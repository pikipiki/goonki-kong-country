import { WORLD_PIXELS } from '../game/engine/romPhysics'

/** World units → SNES pixels for jungle / ROM 2D scenes. */
export const SCENE2D_PIXELS_PER_WORLD = WORLD_PIXELS

/** Jungle level bitmap: world Y=0 sits on this scanline (512px-tall ROM buffer). */
export const SCENE2D_JUNGLE_BASE_PY = 337
