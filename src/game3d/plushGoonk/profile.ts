import { CatmullRomCurve3, Vector3 } from 'three'

export const BODY_PROFILE = new CatmullRomCurve3([
  new Vector3(0, 0.065, 0),
  new Vector3(0.2, 0.07, 0),
  new Vector3(0.29, 0.15, 0),
  new Vector3(0.325, 0.34, 0),
  new Vector3(0.3, 0.53, 0),
  new Vector3(0.24, 0.67, 0),
  new Vector3(0.14, 0.755, 0),
  new Vector3(0, 0.78, 0),
])
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
