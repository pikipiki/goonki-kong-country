import type { RefObject } from 'react'
import type { Group, MeshStandardMaterial } from 'three'
import { PLUSH_BODY, PINK_NOSE, VIOLET_NOSE } from '../plushGoonk/mesh'
import { FlatEye } from '../plushGoonk/FlatEye'
import { FurPile } from '../plushGoonk/FurPile'
import { Stitching } from '../plushGoonk/Stitching'
import { YellowTuft } from '../plushGoonk/YellowTuft'
import { pick } from '../../utils/pick'
import { GoonkArms, GoonkFeet } from './GoonkLimbs'

type LimbRefs = { current: (Group | null)[] }

export function GoonkMesh({
  pink,
  fabric,
  body,
  limbs,
}: {
  pink: boolean
  fabric: MeshStandardMaterial
  body: RefObject<Group | null>
  limbs: LimbRefs
}) {
  return (
    <group ref={body} position={[0, 0.4, 0]}>
      <group position={[0, -0.4, 0]}>
        <mesh
          geometry={PLUSH_BODY}
          material={fabric}
          castShadow
          receiveShadow
          dispose={null}
        />
        <mesh
          geometry={pick(pink, PINK_NOSE, VIOLET_NOSE)}
          material={fabric}
          castShadow
          dispose={null}
        />
        <FurPile pink={pink} />
        <Stitching pink={pink} />
        <FlatEye side={-1} seed={pick(pink, 1, 2)} />
        <FlatEye side={1} seed={pick(pink, 1, 2)} />
        {pink && <YellowTuft />}
        <GoonkArms fabric={fabric} limbs={limbs} />
        <GoonkFeet fabric={fabric} limbs={limbs} />
      </group>
    </group>
  )
}
