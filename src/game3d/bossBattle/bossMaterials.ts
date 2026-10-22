import { MeshStandardMaterial } from 'three'
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
