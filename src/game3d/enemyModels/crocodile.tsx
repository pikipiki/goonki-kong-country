import { type Group } from 'three'
import { type RefObject } from 'react'
import { ENEMY_DESIGNS } from '../../game/enemies'
import { crocTail, enemyMaterial } from './enemyGeometries'
import { EnemyPart } from './enemyPart'
import { CrocHelmet, CrocKingCrown, CrocHead } from './crocHead'
import { CrocGait } from './crocGait'
import {
  crocBelly,
  crocBellyDepth,
  crocBellyWidth,
  crocDesignKey,
  crocGreen,
  crocTorsoDepth,
  crocTorsoWidth,
} from './crocPalette'
export function Crocodile({
  helmet = false,
  king = false,
  gait,
}: {
  helmet?: boolean
  king?: boolean
  gait: RefObject<Group | null>
}) {
  const green = crocGreen(helmet, king)
  const belly = crocBelly(king)
  const design = ENEMY_DESIGNS[crocDesignKey(helmet, king)]
  return (
    <group scale={design.scale}>
      <mesh
        geometry={crocTail}
        material={enemyMaterial(green)}
        dispose={null}
      />
      <EnemyPart
        color={green}
        pos={[-0.17, 0.75, 0]}
        size={[crocTorsoWidth(king, helmet), 0.66, crocTorsoDepth(helmet)]}
      />
      <EnemyPart
        color={belly}
        pos={[0.12, 0.65, 0.05]}
        size={[crocBellyWidth(helmet), 0.48, crocBellyDepth(helmet)]}
      />
      <CrocHead green={green} belly={belly} king={king} />
      {helmet && <CrocHelmet />}
      <CrocGait gait={gait} green={green} helmet={helmet} />
      {king && <CrocKingCrown />}
    </group>
  )
}
