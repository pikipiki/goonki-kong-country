/** Lowest terrain ceiling strictly above a SNES head Y. */
export function pickCeilingFloorY(
  floorY: number,
  headY: number,
  current: number | null,
): number | null {
  if (floorY <= headY) {
    return current
  }
  if (current === null || floorY < current) {
    return floorY
  }
  return current
}
/** Whether a floor sample should replace the nearest-below candidate. */
export function preferHigherFloorBelow(
  floorY: number,
  feetY: number,
  bestFloorY: number | null,
): boolean {
  return floorY <= feetY && (bestFloorY === null || floorY > bestFloorY)
}
