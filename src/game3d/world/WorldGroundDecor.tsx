import type { Biome } from '../../game/levels'
import { PALETTES } from './worldPalettes'
import { worldProceduralTexture } from './worldProceduralTexture'
import type { GroundInstanceBuckets } from './worldGroundInstances'
import { worldLeaf, worldRock, worldVine } from './worldSharedGeometries'
import { pick } from '../../utils/pick'
import { WorldBatch } from './WorldBatch'

export function WorldGroundDecor({
  biome,
  stone,
  data,
}: {
  biome: Biome
  stone: boolean
  data: GroundInstanceBuckets
}) {
  return (
    <>
      <WorldBatch
        geometry={worldRock}
        items={data.rocks}
        color={pick(stone, '#9a977e', '#a27a44')}
        map="soil"
      />
      <WorldBatch
        geometry={worldRock}
        items={data.edge}
        color={pick(biome === 'snow', '#e7f0df', '#789336')}
      />
      <WorldBatch
        geometry={worldVine}
        items={data.roots}
        color="#736044"
        map="bark"
      />
      {biome !== 'snow' && (
        <WorldBatch
          geometry={worldLeaf}
          items={data.plants}
          color="#9ab24e"
          map="leaf"
          vertexColors
        />
      )}
    </>
  )
}

export function WorldGroundGrassCap({ biome }: { biome: Biome }) {
  const palette = PALETTES[biome]

  return (
    <meshStandardMaterial
      color={palette.grass}
      map={worldProceduralTexture('soil')}
      roughness={1}
    />
  )
}
