import { EnemyPart, EnemyEye } from './enemyPart'
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

export function CrocSnout({ green, belly }: { green: string; belly: string }) {
  return (
    <>
      <EnemyPart
        color={green}
        pos={[0.17, 1.31, 0]}
        size={[0.36, 0.32, 0.29]}
      />
      <EnemyPart
        color={green}
        pos={[0.52, 1.15, 0.03]}
        size={[0.49, 0.19, 0.3]}
      />
      <EnemyPart
        color="#314826"
        pos={[0.53, 1.055, 0.04]}
        size={[0.44, 0.045, 0.27]}
      />
      <EnemyPart
        color={belly}
        pos={[0.51, 1.005, 0.04]}
        size={[0.4, 0.055, 0.25]}
      />
      <EnemyPart
        color="#26381b"
        pos={[0.82, 1.25, 0.17]}
        size={[0.032, 0.025, 0.03]}
      />
      {[0, 1, 2].map((tooth) => (
        <EnemyPart
          key={tooth}
          color="#f5e7b3"
          pos={[0.34 + tooth * 0.19, 1.044, 0.285]}
          size={[0.027, 0.07, 0.032]}
          shape="tooth"
          rotation={[0, 0, Math.PI]}
        />
      ))}
      <EnemyEye pos={[0.28, 1.43, 0.245]} />
      <EnemyEye pos={[0.28, 1.43, -0.245]} size={0.1} />
      <EnemyPart
        color={green}
        pos={[0.23, 1.53, 0.25]}
        size={[0.18, 0.055, 0.11]}
        rotation={[0, 0, -0.18]}
      />
    </>
  )
}

export function CrocHelmet() {
  return (
    <>
      <EnemyPart
        color="#645386"
        pos={[-0.14, 0.32, 0]}
        size={[0.5, 0.21, 0.39]}
      />
      <group position={[0.05, 1.65, 0]}>
        <EnemyPart color="#484d29" size={[0.48, 0.23, 0.39]} />
        <EnemyPart
          color="#73764b"
          pos={[0.11, -0.1, 0]}
          size={[0.53, 0.047, 0.42]}
        />
        <EnemyPart
          color="#a8a268"
          pos={[0.32, 0.01, 0.27]}
          size={[0.075, 0.06, 0.012]}
          shape="box"
        />
      </group>
    </>
  )
}

export function CrocKingCrown() {
  return (
    <>
      <group position={[0.08, 1.67, 0]}>
        <EnemyPart color="#e7b538" size={[0.37, 0.14, 0.32]} shape="cylinder" />
        {[0, 1, 2, 3, 4].map((spike) => (
          <EnemyPart
            key={spike}
            color="#ffd66b"
            pos={[
              Math.cos((spike * Math.PI * 2) / 5) * 0.3,
              0.23,
              Math.sin((spike * Math.PI * 2) / 5) * 0.27,
            ]}
            size={[0.1, 0.37, 0.09]}
            shape="tooth"
          />
        ))}
        <EnemyPart
          color="#c53c32"
          pos={[0.04, 0.02, 0.325]}
          size={[0.065, 0.08, 0.025]}
        />
      </group>
      <EnemyPart
        color="#8d2924"
        pos={[-0.49, 0.7, -0.08]}
        size={[0.15, 0.69, 0.48]}
        rotation={[0, 0, -0.23]}
      />
      <EnemyPart
        color="#c7b271"
        pos={[-0.31, 1.18, 0.28]}
        size={[0.24, 0.09, 0.1]}
      />
    </>
  )
}
