import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  SphereGeometry,
  TorusGeometry,
  MeshStandardMaterial,
} from 'three'
export const bossBox = new BoxGeometry(1, 1, 1)
export const bossSphere = new SphereGeometry(1, 16, 12)
export const bossCone = new ConeGeometry(1, 1, 10)
export const bossCylinder = new CylinderGeometry(1, 1, 1, 16)
export const bossRing = new TorusGeometry(1, 0.055, 8, 24)

const colors = new Map<string, MeshStandardMaterial>()
export function bossMaterial(color: string) {
  const cached = colors.get(color)
  if (cached) {
    return cached
  }
  const created = new MeshStandardMaterial({ color, roughness: 0.75 })
  colors.set(color, created)
  return created
}
