import type { Level } from './levels';

/** Readability adaptation: enlarge the marine environment, leaving the plush,
 * mount, enemy models and movement speeds at their existing world-unit sizes.
 * The ROM evidence and generated source placements remain at 32 pixels/unit. */
export const CORAL_WORLD_SCALE = 1.5;
export const CORAL_SOURCE_PIXELS_PER_UNIT = 32;
export const CORAL_PIXELS_PER_WORLD_UNIT = CORAL_SOURCE_PIXELS_PER_UNIT / CORAL_WORLD_SCALE;
export const CORAL_WORLD_WIDTH = 64 * CORAL_WORLD_SCALE;
export const CORAL_WATER_SURFACE_Y = 53.9 * CORAL_WORLD_SCALE;
export const CORAL_WATER_FLOOR_Y = -0.9 * CORAL_WORLD_SCALE;
export const coralWorldFromSource = (value: number) => value * CORAL_WORLD_SCALE;
export const coralSourceFromWorld = (value: number) => value / CORAL_WORLD_SCALE;

export function scaleCoralLevel<T extends Level>(source: T): T {
  const point = <P extends {x:number;y:number}>(p:P):P => ({...p,x:coralWorldFromSource(p.x),y:coralWorldFromSource(p.y)});
  const rect = <R extends {x:number;y:number;w:number;h:number}>(r:R):R => ({...point(r),w:coralWorldFromSource(r.w),h:coralWorldFromSource(r.h)});
  return {
    ...source,
    length: coralWorldFromSource(source.length),
    start: source.start && point(source.start),
    platforms: source.platforms.map(p=>({...rect(p),travel:p.travel===undefined?undefined:coralWorldFromSource(p.travel)})),
    pickups: source.pickups.map(point),
    enemies: source.enemies.map(e=>({...point(e),min:coralWorldFromSource(e.min),max:coralWorldFromSource(e.max)})),
    barrels: source.barrels.map(point),
    animals: source.animals?.map(point),
    decors: source.decors?.map(point),
    itemCaches: source.itemCaches?.map(point),
    breakableWalls: source.breakableWalls?.map(rect),
    finishZone: source.finishZone && rect(source.finishZone),
    bonusRooms: source.bonusRooms?.map(room=>({...room,bounds:rect(room.bounds),pickups:room.pickups.map(point)})),
  };
}
