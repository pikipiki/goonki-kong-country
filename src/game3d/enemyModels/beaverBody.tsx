import { EnemyEye } from './enemyEye'
import { EnemyPart } from './enemyPart'

export function BeaverBody() {
  return (
    <>
      <EnemyPart
        color="#70442c"
        pos={[-0.59, 0.16, -0.03]}
        size={[0.56, 0.085, 0.28]}
        rotation={[0, -0.15, -0.13]}
      />
      {Array.from({ length: 5 }, (_, rib) => (
        <EnemyPart
          key={rib}
          color="#493425"
          pos={[-0.8 + rib * 0.11, 0.245, -0.025]}
          size={[0.012, 0.008, 0.22]}
          rotation={[0, 0.22, 0]}
        />
      ))}
      <EnemyPart
        color="#9b6439"
        pos={[-0.12, 0.47, 0]}
        size={[0.56, 0.48, 0.37]}
      />
      <EnemyPart
        color="#c5a16a"
        pos={[0.18, 0.36, 0.06]}
        size={[0.37, 0.29, 0.32]}
      />
      <EnemyPart
        color="#a87844"
        pos={[0.3, 0.65, 0]}
        size={[0.4, 0.31, 0.31]}
      />
      <EnemyPart
        color="#ba955c"
        pos={[0.59, 0.48, 0.04]}
        size={[0.3, 0.18, 0.26]}
      />
      <EnemyPart
        color="#35291f"
        pos={[0.83, 0.54, 0.07]}
        size={[0.1, 0.08, 0.12]}
      />
      <EnemyPart
        color="#4d2b23"
        pos={[0.59, 0.38, 0.12]}
        size={[0.2, 0.08, 0.15]}
      />
      {[-1, 1].map((side) => (
        <EnemyPart
          key={side}
          color="#fff0bc"
          pos={[0.7, 0.32, side * 0.065 + 0.07]}
          size={[0.085, 0.14, 0.07]}
          shape="box"
          rotation={[0, 0, 0.15]}
        />
      ))}
      <EnemyPart
        color="#714628"
        pos={[0.15, 0.92, 0.2]}
        size={[0.15, 0.16, 0.08]}
      />
      <EnemyPart
        color="#c5a276"
        pos={[0.17, 0.92, 0.25]}
        size={[0.08, 0.1, 0.02]}
      />
      <EnemyEye pos={[0.39, 0.76, 0.265]} size={0.105} />
      <EnemyEye pos={[0.39, 0.76, -0.265]} size={0.105} />
    </>
  )
}

export function BeaverGaitLegs() {
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side}>
          <EnemyPart
            color="#70482c"
            pos={[-0.25, 0.1, side * 0.29]}
            size={[0.3, 0.1, 0.18]}
          />
          <EnemyPart
            color="#8c5b34"
            pos={[0.32, 0.13, side * 0.25]}
            size={[0.23, 0.11, 0.15]}
          />
        </group>
      ))}
    </>
  )
}
