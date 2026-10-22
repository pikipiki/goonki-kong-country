import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { InstancedMesh, Object3D } from 'three'
import type { Game } from '../../game/engine'
import { worldRandom } from './worldPalettes'
import { worldSphere } from './worldSharedGeometries'
import { pick } from '../../utils/pick'

export function WorldMotes({ game }: { game: Game }) {
  const ref = useRef<InstancedMesh>(null)

  let moteCount
  if (game.level.biome === 'snow') {
    moteCount = 55
  } else {
    moteCount = 22
  }

  const dummy = useMemo(() => new Object3D(), [])

  useFrame(({ clock }) => {
    const mesh = ref.current

    if (!mesh) {
      return
    }

    for (let moteIdx = 0; moteIdx < moteCount; moteIdx++) {
      dummy.position.set(
        game.player.x - 18 + worldRandom(moteIdx) * 36,
        pick(
          game.level.biome === 'snow',
          9 - ((worldRandom(moteIdx + 1) * 14 + clock.elapsedTime * 0.8) % 14),
          worldRandom(moteIdx + 1) * 11 +
            Math.sin(clock.elapsedTime + moteIdx) * 0.2 -
            2,
        ),
        worldRandom(moteIdx + 2) * 12 - 7,
      )
      dummy.scale.setScalar(pick(game.level.biome === 'snow', 0.025, 0.012))
      dummy.updateMatrix()
      mesh.setMatrixAt(moteIdx, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  })
  return (
    <instancedMesh ref={ref} args={[worldSphere, undefined, moteCount]}>
      <meshBasicMaterial
        color={pick(game.level.biome === 'snow', '#fff6dd', '#d8da85')}
        transparent
        opacity={0.55}
      />
    </instancedMesh>
  )
}
