import { useRef } from 'react'
import type { Group } from 'three'
import { usePlushFabric } from './plushGoonk/usePlushFabric'
import type { Game } from '../game/engine'
import { GoonkMesh } from './goonk/GoonkMesh'
import { useGoonkFrame } from './goonk/useGoonkFrame'

export function Goonk({
  pink,
  game,
  companion = false,
  preview = false,
  mapWalk = 0,
  mapCelebrate = false,
}: {
  pink: boolean
  game?: Game
  companion?: boolean
  preview?: boolean
  mapWalk?: number
  mapCelebrate?: boolean
}) {
  const fabric = usePlushFabric(pink)
  const root = useRef<Group>(null)
  const body = useRef<Group>(null)
  const limbs = useRef<(Group | null)[]>([])
  useGoonkFrame(root, body, limbs, {
    pink,
    game,
    companion,
    preview,
    mapWalk,
    mapCelebrate,
  })
  return (
    <group ref={root} scale={pink ? 2.2 : 2.05}>
      <GoonkMesh pink={pink} fabric={fabric} body={body} limbs={limbs} />
    </group>
  )
}
