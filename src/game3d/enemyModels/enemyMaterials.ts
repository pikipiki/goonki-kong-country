import { MeshStandardMaterial } from 'three'
import { pick } from '../../utils/pick'

const materials = new Map<string, MeshStandardMaterial>()

export function enemyMaterial(color: string) {
  const cached = materials.get(color)

  if (cached) {
    return cached
  }

  const translucent = color === '#ccded3' || color === '#e4ead1'

  const created = new MeshStandardMaterial({
    color,
    roughness: 0.68,
    transparent: translucent,
    opacity: pick(translucent, 0.53, 1),
    depthWrite: !translucent,
  })

  materials.set(color, created)
  return created
}
