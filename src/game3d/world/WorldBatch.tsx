import { useLayoutEffect, useRef } from 'react'
import {
  BufferGeometry,
  Color,
  DoubleSide,
  InstancedMesh,
  Object3D,
} from 'three'
import type { WorldInstance } from './worldTypes'
import {
  worldProceduralTexture,
  type WorldTextureKind,
} from './worldProceduralTexture'
import { pick } from '../../utils/pick'

export function WorldBatch({
  geometry,
  items,
  color,
  map,
  vertexColors = false,
}: {
  geometry: BufferGeometry
  items: WorldInstance[]
  color: string
  map?: WorldTextureKind
  vertexColors?: boolean
}) {
  const ref = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = ref.current

    if (!mesh) {
      return
    }

    const dummy = new Object3D()

    items.forEach((item, itemIdx) => {
      dummy.position.fromArray(item.position)
      const rot = item.rotation ?? [0, 0, 0]

      dummy.rotation.set(rot[0], rot[1], rot[2])
      dummy.scale.fromArray(item.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(itemIdx, dummy.matrix)
      mesh.setColorAt(itemIdx, new Color(item.color ?? '#ffffff'))
    })
    mesh.instanceMatrix.needsUpdate = true

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true
    }

    mesh.computeBoundingSphere()
  }, [items])

  if (!items.length) {
    return null
  }

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, undefined, items.length]}
      dispose={null}
    >
      <meshStandardMaterial
        color={color}
        map={map ? worldProceduralTexture(map) : undefined}
        bumpMap={
          map && map !== 'leaf' ? worldProceduralTexture(map) : undefined
        }
        bumpScale={pick(map === 'bark', 0.08, 0.045)}
        roughness={0.92}
        side={pick(vertexColors, DoubleSide, undefined)}
        vertexColors={vertexColors}
      />
    </instancedMesh>
  )
}
