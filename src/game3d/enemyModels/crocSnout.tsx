import { EnemyEye } from './enemyEye'
import { EnemyPart } from './enemyPart'

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
