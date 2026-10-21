import { terrainCellSNES as jungleCell } from './originalTerrain';
import { terrainCellSNES as caveCell } from './originalCaveTerrain';
import { terrainCellSNES as cartCell } from './originalMineCartTerrain';
import { ORIGINAL_JUNGLE_ORIGIN } from './originalJungle';
import { ORIGINAL_REVERB_ORIGIN } from './originalReverb';
import { ORIGINAL_MINE_CART_ORIGIN } from './originalMineCart';
import { coralSolidSpansWorld } from './originalCoralTerrain';
import { CORAL_WATER_FLOOR_Y, CORAL_WATER_SURFACE_Y } from './marineScale';

export interface SolidSpan { bottom: number; top: number }
/** The same solid metatile intervals as the terrain meshes, without internal seams. */
export function terrainSolidSpans(kind: string, x: number): SolidSpan[] {
  if(kind === 'coral') return coralSolidSpansWorld(x);
  const cellAt = kind === 'cave' ? caveCell : kind === 'mineCart' ? cartCell : jungleCell;
  const origin = kind === 'cave' ? ORIGINAL_REVERB_ORIGIN : kind === 'mineCart' ? ORIGINAL_MINE_CART_ORIGIN : ORIGINAL_JUNGLE_ORIGIN;
  const px = x * 32 + origin.x;
  const pixels: SolidSpan[] = [];
  for(let row = 15; row >= 0; row--) {
    const cell = cellAt(px, row);
    if (!cell) continue;
    const bottom = (15 - row) * 32, top = cell.floorY;
    if (top <= bottom) continue;
    const last = pixels[pixels.length - 1];
    if (last && bottom <= last.top + 1) last.top = Math.max(last.top, top);
    else pixels.push({ bottom, top });
  }
  return pixels.map(span => ({ bottom: (span.bottom-origin.y)/32, top:(span.top-origin.y)/32 }));
}

export const SWIM_BODY = { radius: 0.28, height: 0.95 };
export function coralBodyBlocked(x: number, y: number, body = SWIM_BODY) {
  for(const sampleX of [x-body.radius, x, x+body.radius]) {
    if (terrainSolidSpans('coral', sampleX).some(s => y + body.height > s.bottom + 0.015 && y < s.top - 0.015)) return true;
  }
  return false;
}

/** Axis-separated sweeps prevent tunnelling and permit sliding along a reef.
 * Old marine probes repeated one 512px band at invisible depths; only visible
 * solid intervals may stop the swimmer. Existing overlaps can be escaped. */
export function resolveCoralMotion(oldX: number, oldY: number, x: number, y: number, body = SWIM_BODY) {
  let nx = oldX, ny = oldY;
  const sweep = (from: number, to: number, blocked: (value:number)=>boolean) => {
    const steps = Math.max(1, Math.ceil(Math.abs(to-from)/0.04));
    let value = from;
    const embedded = blocked(from);
    for(let i=1; i<=steps; i++) {
      const next = from + (to-from)*i/steps;
      if(!embedded && blocked(next)) break;
      value = next;
    }
    return value;
  };
  nx = sweep(oldX, x, value => coralBodyBlocked(value, oldY, body));
  ny = sweep(oldY, y, value => coralBodyBlocked(nx, value, body));
  return { x:nx, y:ny };
}

export function resolveLandMotion(kind: string, oldX: number, oldY: number, x: number, y: number, grounded: boolean, vy: number, body = { radius:0.3, height:1.35 }) {
  const { radius, height } = body, stepHeight = grounded ? 0.45 : 0.02;
  const steps = Math.max(1, Math.ceil(Math.abs(x-oldX)/0.04));
  let nx = oldX, ny = y, landed = false, blockedX = false, blockedY = false;
  for(let i=1; i<=steps; i++) {
    const next = oldX + (x-oldX)*i/steps;
    const edge = next + Math.sign(x-oldX)*radius;
    const walls = terrainSolidSpans(kind, edge);
    if(walls.some(s => s.top > oldY+stepHeight && s.bottom < oldY+height-0.03 && s.top > Math.min(oldY,y)+0.1)) {
      blockedX = true; break;
    }
    nx = next;
  }
  const spans = [nx-radius+0.04,nx,nx+radius-0.04].flatMap(px => terrainSolidSpans(kind, px));
  if(vy <= 0) {
    const tops = spans.filter(s => s.top <= oldY + (grounded ? 0.45 : 0.12) && s.top >= y-0.001).map(s => s.top);
    if(tops.length) { ny = Math.max(...tops); landed = true; blockedY = true; }
    // Follow small downward slopes without a frame suspended above the mesh.
    else if(grounded) {
      const below = spans.filter(s => s.top <= oldY && s.top >= oldY-0.3).map(s => s.top);
      if(below.length) { ny = Math.max(...below); landed = true; blockedY = true; }
    }
  } else {
    const roofs = spans.filter(s => s.bottom >= oldY+height-0.02 && s.bottom <= y+height).map(s => s.bottom);
    if(roofs.length) { ny = Math.min(...roofs)-height; blockedY = true; }
  }
  return { x:nx, y:ny, grounded:landed, blockedX, blockedY };
}

/** Keep imported marine actors clear of their rendered reef at spawn. Spawn
 * actors in actual open water rather than inside an intersecting reef. */
export function nearestCoralOpenY(x: number, preferred: number, height = SWIM_BODY.height) {
  const blocked = (y:number) => [x-SWIM_BODY.radius,x,x+SWIM_BODY.radius].some(px =>
    terrainSolidSpans('coral',px).some(s => y+height > s.bottom+0.015 && y < s.top-0.015));
  const candidates = [Math.max(CORAL_WATER_FLOOR_Y,Math.min(CORAL_WATER_SURFACE_Y,preferred)), CORAL_WATER_FLOOR_Y];
  for(const px of [x-SWIM_BODY.radius,x,x+SWIM_BODY.radius]) for(const s of terrainSolidSpans('coral',px)) {
    candidates.push(s.bottom-height-0.025, s.top+0.025);
  }
  return candidates.filter(y=>y>=CORAL_WATER_FLOOR_Y && y<=CORAL_WATER_SURFACE_Y && !blocked(y))
    .sort((a,b)=>Math.abs(a-preferred)-Math.abs(b-preferred))[0] ?? CORAL_WATER_FLOOR_Y;
}
