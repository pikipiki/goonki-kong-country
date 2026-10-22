import { CatmullRomCurve3, Vector3 } from 'three'

import { controlPoints } from '../../config/plush-profile.json'

export const BODY_PROFILE = new CatmullRomCurve3(
  controlPoints.map(
    ([radius, height, depth]) => new Vector3(radius, height, depth),
  ),
)

export function bodyPoint(alongProfile: number, angle: number, offset = 0) {
  const point = BODY_PROFILE.getPoint(alongProfile)
  const seam = Math.exp(-Math.pow(Math.cos(angle * 2), 2) * 190) * 0.007
  const radius =
    Math.max(0, point.x - seam * Math.sin(alongProfile * Math.PI)) + offset
  return new Vector3(
    Math.sin(angle) * radius,
    point.y,
    Math.cos(angle) * radius * 0.82,
  )
}
