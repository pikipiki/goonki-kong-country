import { clamp } from '../game/engine/math'

export function jungleNightBlend(worldX: number) {
  if (worldX < 45) {
    return 0
  }

  if (worldX < 68) {
    return (worldX - 45) / 23
  }

  if (worldX < 145) {
    return 1
  }

  if (worldX < 156) {
    return 1 - (worldX - 145) / 11
  }

  return 0
}

export function jungleAtmosphereBlends(worldX: number) {
  const nightBlend = jungleNightBlend(worldX)

  let dawnBlend
  if (worldX < 146) {
    dawnBlend = 0
  } else {
    dawnBlend = clamp((worldX - 146) / 12, 0, 1)
  }

  return { nightBlend, dawnBlend }
}
