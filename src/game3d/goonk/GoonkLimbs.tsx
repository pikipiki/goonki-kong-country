import {
  SphereGeometry,
  CapsuleGeometry,
  type Group,
  type MeshStandardMaterial,
} from 'three'
const sphere = new SphereGeometry(1, 20, 14)
const arm = new CapsuleGeometry(0.045, 0.19, 6, 12)
type LimbRefs = {
  current: (Group | null)[]
}

export function GoonkArms({
  fabric,
  limbs,
}: {
  fabric: MeshStandardMaterial
  limbs: LimbRefs
}) {
  return (
    <>
      {[-1, 1].map((side, limbIdx) => (
        <group
          key={side}
          position={[side * 0.28, 0.43, 0]}
          ref={(node) => {
            limbs.current[limbIdx] = node
          }}
        >
          <group rotation={[0, 0, side * 0.25]}>
            <mesh
              geometry={arm}
              dispose={null}
              material={fabric}
              position={[0, -0.11, 0]}
              castShadow
            />
            <mesh
              geometry={sphere}
              dispose={null}
              scale={[0.075, 0.064, 0.05]}
              position={[0, -0.255, 0.015]}
              material={fabric}
              castShadow
            />
            {[-1, 0, 1].map((finger) => (
              <mesh
                key={finger}
                geometry={sphere}
                dispose={null}
                scale={[0.02, 0.044, 0.022]}
                position={[finger * 0.038, -0.29, 0.02]}
                material={fabric}
              />
            ))}
          </group>
        </group>
      ))}
    </>
  )
}

export function GoonkFeet({
  fabric,
  limbs,
}: {
  fabric: MeshStandardMaterial
  limbs: LimbRefs
}) {
  return (
    <>
      {[-1, 1].map((side, limbIdx) => (
        <group
          key={side}
          position={[side * 0.145, 0.075, 0.04]}
          ref={(node) => {
            limbs.current[limbIdx + 2] = node
          }}
        >
          <mesh
            geometry={sphere}
            dispose={null}
            scale={[0.09, 0.055, 0.13]}
            position={[0, -0.02, 0.06]}
            material={fabric}
            castShadow
          />
          {[-1, 0, 1].map((toe) => (
            <mesh
              key={toe}
              geometry={sphere}
              dispose={null}
              scale={[0.032, 0.032, 0.045]}
              position={[toe * 0.043, -0.025, 0.16]}
              material={fabric}
            />
          ))}
        </group>
      ))}
    </>
  )
}
