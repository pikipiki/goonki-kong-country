import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  MeshStandardMaterial,
  CylinderGeometry,
  SphereGeometry,
} from "three";

/** A tapered five-ridged fruit swept along an asymmetric arc, with actual peel volume. */
export function createBananaGeometry() {
  const positions: number[] = [],
    colors: number[] = [],
    indices: number[] = [],
    uv: number[] = [];
  const rows = 28,
    sides = 10,
    bright = new Color("#ffe45b"),
    dark = new Color("#c58b10");
  for (let row = 0; row <= rows; row++) {
    const t = row / rows,
      x = (t - 0.5) * 1.04,
      y = -Math.sin(t * Math.PI) * 0.34 + t * 0.12;
    const tangentY = -Math.cos(t * Math.PI) * 0.34 * Math.PI + 0.12,
      length = Math.hypot(1.04, tangentY),
      nx = -tangentY / length,
      ny = 1.04 / length;
    const radius =
      0.018 + Math.pow(Math.sin(t * Math.PI), 0.65) * 0.108 * (1 - t * 0.14);
    for (let side = 0; side <= sides; side++) {
      const a = (side / sides) * Math.PI * 2,
        r = radius * (side % 2 === 0 ? 1 : 0.88),
        shade = 0.38 + Math.cos(a - 0.6) * 0.23 + (side % 2 === 0 ? 0.1 : 0);
      positions.push(
        x + nx * Math.cos(a) * r,
        y + ny * Math.cos(a) * r,
        Math.sin(a) * r,
      );
      const color = dark
        .clone()
        .lerp(bright, Math.max(0.1, Math.min(1, shade + 0.3)));
      colors.push(color.r, color.g, color.b);
      uv.push(t, side / sides);
      if (row < rows && side < sides) {
        const i = row * (sides + 1) + side,
          j = i + sides + 1;
        indices.push(i, j, i + 1, j, j + 1, i + 1);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}
export const BANANA_GEOMETRY = createBananaGeometry();
const peel = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.44,
    metalness: 0.04,
  }),
  stem = new MeshStandardMaterial({ color: "#727125", roughness: 0.86 }),
  tip = new MeshStandardMaterial({ color: "#513216", roughness: 0.85 });
const stemGeometry = new CylinderGeometry(0.026, 0.036, 0.14, 7),
  tipGeometry = new SphereGeometry(1, 8, 6);
export function BananaModel({ scale = 0.78 }: { scale?: number }) {
  return (
    <group scale={scale} rotation={[0.1, 0, -0.25]} dispose={null}>
      <mesh geometry={BANANA_GEOMETRY} material={peel} castShadow />
      <mesh
        geometry={stemGeometry}
        material={stem}
        position={[-0.55, 0.055, 0]}
        rotation={[0, 0, -0.5]}
      />
      <mesh
        geometry={tipGeometry}
        material={tip}
        position={[0.524, 0.12, 0]}
        scale={[0.028, 0.024, 0.023]}
      />
      <mesh
        geometry={tipGeometry}
        material={tip}
        position={[-0.583, 0.116, 0]}
        scale={[0.027, 0.018, 0.027]}
      />
    </group>
  );
}
