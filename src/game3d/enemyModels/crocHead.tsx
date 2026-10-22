import { EnemyPart } from './enemyPart'
import { CrocSnout } from './crocSnout'

export function CrocHead({
  green,
  belly,
  king,
}: {
  green: string
  belly: string
  king: boolean
}) {
  let scaleColor
  if (king) {
    scaleColor = '#b4953c'
  } else {
    scaleColor = '#929854'
  }

  return (
    <>
      {[0, 1, 2, 3].map((scale) => (
        <EnemyPart
          key={scale}
          color={scaleColor}
          pos={[0.32, 0.37 + scale * 0.16, 0.06]}
          size={[0.013, 0.016, 0.23]}
        />
      ))}
      <CrocSnout green={green} belly={belly} />
      {[-1, 1].map((side) => (
        <group
          key={side}
          position={[-0.11, 0.92, side * 0.32]}
          rotation={[0, 0, -0.3]}
        >
          <EnemyPart
            color={green}
            pos={[0.08, -0.14, 0]}
            size={[0.1, 0.24, 0.11]}
          />
          <EnemyPart
            color={green}
            pos={[0.16, -0.34, 0]}
            size={[0.14, 0.14, 0.15]}
          />
          {[0, 1, 2].map((claw) => (
            <EnemyPart
              key={claw}
              color="#e3dbaa"
              pos={[0.28, -0.38, (claw - 1) * 0.08]}
              size={[0.06, 0.026, 0.02]}
              shape="tooth"
              rotation={[0, 0, -Math.PI / 2]}
            />
          ))}
        </group>
      ))}
      {[0, 1, 2, 3, 4].map((spike) => (
        <EnemyPart
          key={spike}
          color="#ba703b"
          pos={[-0.48 - spike * 0.13, 1.05 - spike * 0.16, 0]}
          size={[0.12, 0.2 - spike * 0.02, 0.08]}
          shape="tooth"
          rotation={[0, 0, 0.2]}
        />
      ))}
    </>
  )
}
