import { MeshStandardMaterial } from 'three'
const palette = new Map<string, MeshStandardMaterial>()
export function animalMat(color: string) {
  const cached = palette.get(color)
  if (cached) {
    return cached
  }
  const created = new MeshStandardMaterial({
    color,
    roughness: 0.69,
    metalness: 0,
  })
  palette.set(color, created)
  return created
}
