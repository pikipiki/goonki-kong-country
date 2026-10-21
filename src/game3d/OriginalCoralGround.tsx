import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  Group,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";
import type { Game } from "../game/engine";
import {
  ORIGINAL_CORAL_TERRAIN,
  coralSolidSpansWorld,
} from "../game/originalCoralTerrain";

const CHUNK_COLUMNS = 16,
  STRIP_PIXELS = 1,
  FRONT = 1.6,
  BACK = -1.6;

function noise(seed: number) {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function createCoralGroundGeometry(
  firstColumn: number,
  columnCount = CHUNK_COLUMNS,
) {
  const positions: number[] = [],
    uvs: number[] = [],
    colors: number[] = [];
  function quad(points: number[][], tint: string, seed: number) {
    const shade = new Color(tint).multiplyScalar(0.85 + noise(seed) * 0.3);
    for (const i of [0, 1, 2, 0, 2, 3]) {
      const [x, y, z] = points[i];
      positions.push(x, y, z);
      uvs.push(x * 0.7, y * 0.7);
      colors.push(shade.r, shade.g, shade.b);
    }
  }
  const max = Math.min(
    ORIGINAL_CORAL_TERRAIN.widthPixels,
    (firstColumn + columnCount) * 32,
  );
  for (let px = firstColumn * 32; px < max; px += STRIP_PIXELS) {
    const x0 = px / 32,
      x1 = (px + STRIP_PIXELS) / 32;
    coralSolidSpansWorld(x0+0.00001).forEach((span,i)=>{
      const y0=span.bottom, yl=span.top, yr=span.top, seed=Math.floor(px/12)+i*19;
      quad([[x0,y0,FRONT],[x1,y0,FRONT],[x1,yr,FRONT],[x0,yl,FRONT]], "#687d70", seed);
      quad([[x1,y0,BACK],[x0,y0,BACK],[x0,yl,BACK],[x1,yr,BACK]], "#455a55", seed);
      quad([[x0,yl,FRONT],[x1,yr,FRONT],[x1,yr,BACK],[x0,yl,BACK]], "#7f936b", seed);
      quad([[x0,y0,BACK],[x1,y0,BACK],[x1,y0,FRONT],[x0,y0,FRONT]], "#3e534d", seed);
    });
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function reefTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!,
    data = ctx.createImageData(128, 128);
  for (let y = 0; y < 128; y++)
    for (let x = 0; x < 128; x++) {
      const i = (y * 128 + x) * 4,
        n = 0.42 + noise(x + y * 128) * 0.35;
      data.data[i] = Math.round(n * 90);
      data.data[i + 1] = Math.round(n * 130);
      data.data[i + 2] = Math.round(n * 115);
      data.data[i + 3] = 255;
    }
  ctx.putImageData(data, 0, 0);
  const map = new CanvasTexture(canvas);
  map.wrapS = map.wrapT = RepeatWrapping;
  map.colorSpace = SRGBColorSpace;
  return map;
}

function GroundChunk({
  game,
  index,
  map,
}: {
  game: Game;
  index: number;
  map: CanvasTexture;
}) {
  const root = useRef<Group>(null),
    geometry = useMemo(
      () => createCoralGroundGeometry(index * CHUNK_COLUMNS),
      [index],
    );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    if (root.current)
      root.current.visible =
        Math.abs(index * CHUNK_COLUMNS + CHUNK_COLUMNS / 2 - game.player.x) < 28;
  });
  return (
    <group ref={root}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          map={map}
          bumpMap={map}
          bumpScale={0.02}
          vertexColors
          roughness={0.95}
        />
      </mesh>
    </group>
  );
}

export const OriginalCoralGround = memo(function OriginalCoralGround({
  game,
}: {
  game: Game;
}) {
  const map = useMemo(reefTexture, []);
  useEffect(() => () => map.dispose(), [map]);
  const chunks = Math.ceil(ORIGINAL_CORAL_TERRAIN.widthPixels / 32 / CHUNK_COLUMNS);
  return (
    <>
      {Array.from({ length: chunks }, (_, i) => (
        <GroundChunk key={i} game={game} index={i} map={map} />
      ))}
    </>
  );
});
