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
import { ORIGINAL_CAVE_TERRAIN, terrainCellSNES } from "../game/originalCaveTerrain";
import { ORIGINAL_REVERB_ORIGIN } from "../game/originalReverb";

const CHUNK_COLUMNS = 16;
const STRIP_PIXELS = 1;
const FRONT = 1.6;
const BACK = -1.6;
const COLUMN_COUNT = Math.ceil(ORIGINAL_CAVE_TERRAIN.widthPixels / 32);

/** Chunks use absolute ROM columns; actors and cameras use the level origin. */
export function caveGroundChunkVisible(firstColumn: number, playerX: number, columnCount = CHUNK_COLUMNS) {
  const start = (firstColumn * 32 - ORIGINAL_REVERB_ORIGIN.x) / ORIGINAL_CAVE_TERRAIN.pixelsPerWorldUnit;
  const end = start + columnCount * 32 / ORIGINAL_CAVE_TERRAIN.pixelsPerWorldUnit;
  return end > playerX - 28 && start < playerX + 28;
}

function noise(seed: number) {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function createCaveGroundGeometry(firstColumn: number, columnCount = CHUNK_COLUMNS) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const ox = ORIGINAL_REVERB_ORIGIN.x;
  const oy = ORIGINAL_REVERB_ORIGIN.y;
  const scale = ORIGINAL_CAVE_TERRAIN.pixelsPerWorldUnit;
  function quad(points: number[][], tint: string, seed: number, top = false) {
    const shade = new Color(tint).multiplyScalar(0.94 + noise(seed) * 0.12);
    for (const i of [0, 1, 2, 0, 2, 3]) {
      const [x, y, z] = points[i];
      positions.push(x, y, z);
      // Flat tops need texture depth along Z, otherwise their V coordinate
      // collapses to a single row of pixels and looks like smeared stripes.
      uvs.push(x * 0.7, (top ? z : y) * 0.7);
      colors.push(shade.r, shade.g, shade.b);
    }
  }
  const max = Math.min(ORIGINAL_CAVE_TERRAIN.widthPixels, (firstColumn + columnCount) * 32);
  for (let px = firstColumn * 32; px < max; px += STRIP_PIXELS) {
    const intervals: { bottom: number; left: number; right: number }[] = [];
    for (let row = 15; row >= 0; row--) {
      const left = terrainCellSNES(px, row);
      const right = terrainCellSNES(px + STRIP_PIXELS - 1, row);
      if ((left?.localHeight ?? 0) <= 0 && (right?.localHeight ?? 0) <= 0) continue;
      const bottom = (15 - row) * 32;
      const l = left?.floorY ?? bottom;
      const r = right?.floorY ?? bottom;
      const previous = intervals[intervals.length - 1];
      if (previous && bottom <= Math.min(previous.left, previous.right) + 1) {
        previous.left = Math.max(previous.left, l);
        previous.right = Math.max(previous.right, r);
      } else intervals.push({ bottom, left: l, right: r });
    }
    const wx = (px + STRIP_PIXELS / 2 - ox) / scale;
    for (const span of intervals) {
      const y0 = (span.bottom - oy) / scale;
      const yl = (span.left - oy) / scale;
      const yr = (span.right - oy) / scale;
      const x0 = wx-STRIP_PIXELS/scale/2, x1 = wx+STRIP_PIXELS/scale/2;
      const seed = Math.floor(px / 96);
      quad([[x0,yl,FRONT],[x1,yr,FRONT],[x1,yr,BACK],[x0,yl,BACK]], "#729344", seed, true);
      quad([[x0,y0,BACK],[x1,y0,BACK],[x1,y0,FRONT],[x0,y0,FRONT]], "#302b27", seed, true);

      quad(
        [
          [wx - STRIP_PIXELS / scale / 2, y0, FRONT],
          [wx + STRIP_PIXELS / scale / 2, y0, FRONT],
          [wx + STRIP_PIXELS / scale / 2, yr, FRONT],
          [wx - STRIP_PIXELS / scale / 2, yl, FRONT],
        ],
        "#896447",
        seed + span.bottom,
      );
      quad(
        [
          [wx + STRIP_PIXELS / scale / 2, y0, BACK],
          [wx - STRIP_PIXELS / scale / 2, y0, BACK],
          [wx - STRIP_PIXELS / scale / 2, yl, BACK],
          [wx + STRIP_PIXELS / scale / 2, yr, BACK],
        ],
        "#3a322c",
        seed + span.bottom + 17,
      );
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function soilTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const data = ctx.createImageData(128, 128);
  for (let y = 0; y < 128; y++)
    for (let x = 0; x < 128; x++) {
      const i = (y * 128 + x) * 4;
      const n =
        0.62 +
        noise(x + y * 128) * 0.2 +
        Math.sin(y * 0.17 + Math.sin(x * 0.07) * 1.3) * 0.065;
      data.data[i] = data.data[i + 1] = data.data[i + 2] = Math.round(n * 255);
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
  const root = useRef<Group>(null);
  const geometry = useMemo(
    () => createCaveGroundGeometry(index * CHUNK_COLUMNS),
    [index],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    if (root.current)
      root.current.visible =
        caveGroundChunkVisible(index * CHUNK_COLUMNS, game.player.x);
  });
  return (
    <group ref={root} name="canyon-ground-chunk">
      <mesh geometry={geometry}>
        <meshStandardMaterial
          map={map}
          bumpMap={map}
          bumpScale={0.035}
          vertexColors
          roughness={1}
        />
      </mesh>
    </group>
  );
}

export const OriginalCaveGround = memo(function OriginalCaveGround({ game }: { game: Game }) {
  const map = useMemo(soilTexture, []);
  useEffect(() => () => map.dispose(), [map]);
  return (
    <>
      {Array.from({ length: Math.ceil(COLUMN_COUNT / CHUNK_COLUMNS) }, (_, i) => (
        <GroundChunk key={i} game={game} index={i} map={map} />
      ))}
    </>
  );
});
