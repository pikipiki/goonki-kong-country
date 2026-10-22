import { EnemyPart } from './enemyPart'

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
