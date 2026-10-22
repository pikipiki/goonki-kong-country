import { BoxGeometry, MeshStandardMaterial } from 'three'
const box = new BoxGeometry(1, 1, 1)
const wood = new MeshStandardMaterial({ color: '#9b6535', roughness: 0.93 })
const dark = new MeshStandardMaterial({ color: '#5c351f', roughness: 0.9 })
const metal = new MeshStandardMaterial({
  color: '#71654a',
  metalness: 0.35,
  roughness: 0.7,
})
export function AnimalBuddyCrate() {
  return (
    <>
      <mesh
        geometry={box}
        material={dark}
        position={[0, 0.65, -0.13]}
        scale={[1.45, 1.3, 1.05]}
        dispose={null}
      />
      {[-0.54, -0.18, 0.18, 0.54].map((slatX) => (
        <mesh
          key={slatX}
          geometry={box}
          material={wood}
          position={[slatX, 0.65, 0.42]}
          scale={[0.32, 1.3, 0.11]}
          dispose={null}
        />
      ))}
      {[0.1, 1.19].map((bandY) => (
        <mesh
          key={bandY}
          geometry={box}
          material={metal}
          position={[0, bandY, 0.5]}
          scale={[1.53, 0.13, 0.12]}
          dispose={null}
        />
      ))}
      <mesh
        geometry={box}
        material={wood}
        position={[0, 0.66, 0.53]}
        scale={[1.32, 0.13, 0.1]}
        rotation={[0, 0, -0.65]}
        dispose={null}
      />
    </>
  )
}
