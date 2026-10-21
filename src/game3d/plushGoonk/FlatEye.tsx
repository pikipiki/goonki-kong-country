import { themeColors, WHITE } from "@game3d/theme";
import { useFrame } from "@react-three/fiber";

const plush = themeColors.plush;
import { useRef } from "react";
import type { Group } from "three";

export function FlatEye({
  side,
  seed,
  scared = false,
}: {
  side: number;
  seed: number;
  scared?: boolean;
}) {
  const eye = useRef<Group>(null);
  useFrame(({ clock }) => {
    const blinkPhase = (clock.elapsedTime + seed * 0.67) % (3.8 + seed * 0.13);
    if (eye.current)
      eye.current.scale.y =
        blinkPhase < 0.13
          ? Math.max(0.09, Math.abs(Math.cos((blinkPhase / 0.13) * Math.PI)))
          : 1;
  });
  return (
    <group
      position={[side * 0.105, 0.575, 0.232]}
      scale={scared ? 1.18 : 1}
      rotation={[0.12, side * 0.28, -side * 0.12]}
    >
      <group ref={eye}>
        <mesh scale={[0.05, 0.065, 0.012]}>
          <sphereGeometry args={[1, 32, 20]} />
          <meshPhysicalMaterial
            color={plush.eyeWhite}
            roughness={0.3}
            clearcoat={0.25}
          />
        </mesh>
        <mesh
          position={[-side * 0.011, -0.015, 0.012]}
          scale={scared ? [0.02, 0.027, 0.007] : [0.029, 0.038, 0.007]}
        >
          <sphereGeometry args={[1, 24, 16]} />
          <meshPhysicalMaterial
            color={plush.eyeInk}
            roughness={0.17}
            clearcoat={0.7}
          />
        </mesh>
        <mesh
          position={[-side * 0.011 - 0.009, 0.001, 0.019]}
          scale={[0.007, 0.01, 0.002]}
        >
          <sphereGeometry args={[1, 12, 8]} />
          <meshBasicMaterial color={WHITE} />
        </mesh>
      </group>
    </group>
  );
}
