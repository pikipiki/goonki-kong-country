import { ShipArena } from "./BossBattle3D";
import { CORAL_WATER_FLOOR_Y } from "../game/marineScale";
import { OriginalGround } from "./OriginalGround";
import { OriginalCaveGround } from "./OriginalCaveGround";
import { OriginalMineCartGround } from "./OriginalMineCartGround";
import { OriginalCoralGround } from "./OriginalCoralGround";
import { memo, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  Float32BufferAttribute,
  CanvasTexture,
  RepeatWrapping,
  SRGBColorSpace,
  SphereGeometry,
  BoxGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  ConeGeometry,
  TubeGeometry,
  CatmullRomCurve3,
  Vector3,
  Object3D,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
} from "three";
import type { Biome, Level, Platform } from "../game/levels";
import type { Game } from "../game/engine";

export const PALETTES: Record<
  Biome,
  {
    sky: string;
    mist: string;
    leaf: string;
    light: string;
    ground: string;
    grass: string;
  }
> = {
  jungle: {
    sky: "#07140e",
    mist: "#183828",
    leaf: "#528b2b",
    light: "#ffe2a1",
    ground: "#6b442b",
    grass: "#5b7d24",
  },
  canopy: {
    sky: "#42312a",
    mist: "#5a5440",
    leaf: "#426a25",
    light: "#ffd596",
    ground: "#64402a",
    grass: "#698531",
  },
  mine: {
    sky: "#0d161b",
    mist: "#223038",
    leaf: "#3d5440",
    light: "#ffbb69",
    ground: "#49423a",
    grass: "#615c44",
  },
  lagoon: {
    sky: "#08243c",
    mist: "#17566a",
    leaf: "#398872",
    light: "#9edcdb",
    ground: "#8e8660",
    grass: "#668b57",
  },
  snow: {
    sky: "#819daa",
    mist: "#91a9ae",
    leaf: "#315a49",
    light: "#e8eee2",
    ground: "#5b6770",
    grass: "#dfebe5",
  },
  temple: {
    sky: "#1a2623",
    mist: "#314a3b",
    leaf: "#345627",
    light: "#e6cf8d",
    ground: "#696447",
    grass: "#6c772d",
  },
  ship: {
    sky: "#7885a8",
    mist: "#a6b0c8",
    leaf: "#385641",
    light: "#f4c98b",
    ground: "#674a2a",
    grass: "#a27d3f",
  },
};
export function random(n: number) {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}
const sphere = new SphereGeometry(1, 12, 8),
  box = new BoxGeometry(1, 1, 1),
  cylinder = new CylinderGeometry(0.75, 1, 1, 10, 2),
  rock = new IcosahedronGeometry(1, 1),
  cone = new ConeGeometry(1, 1, 7);
const vine = new TubeGeometry(
  new CatmullRomCurve3([
    new Vector3(0, 0, 0),
    new Vector3(0.15, -0.5, 0.04),
    new Vector3(-0.16, -1.1, 0.04),
    new Vector3(0.07, -1.8, 0),
  ]),
  14,
  0.025,
  5,
  false,
);
const rockPositions = rock.attributes.position;
for (let i = 0; i < rockPositions.count; i++) {
  const s =
    0.86 +
    random(
      Math.round(rockPositions.getX(i) * 1000) +
        Math.round(rockPositions.getY(i) * 1000) * 11 +
        Math.round(rockPositions.getZ(i) * 1000) * 113,
    ) *
      0.24;
  rockPositions.setXYZ(
    i,
    rockPositions.getX(i) * s,
    rockPositions.getY(i) * s,
    rockPositions.getZ(i) * s,
  );
}
rock.computeVertexNormals();
function leafGeometry() {
  const vertices: number[] = [],
    uv: number[] = [],
    indices: number[] = [],
    colors: number[] = [];
  const rows = 12,
    columns = 4;
  for (let row = 0; row <= rows; row++)
    for (let col = 0; col <= columns; col++) {
      const t = row / rows,
        side = (col / columns) * 2 - 1,
        width =
          Math.pow(Math.sin(t * Math.PI), 0.65) *
          0.59 *
          (row % 3 === 0 ? 0.92 : 1);
      vertices.push(
        t * 3.4,
        Math.sin(t * Math.PI) * 0.34 - t * t * 0.7 + Math.abs(side) * 0.16,
        side * width,
      );
      uv.push(t, col / columns);
      const shade = 1 - Math.abs(side) * 0.16 + (col === columns / 2 ? 0.12 : 0);
      colors.push(shade, shade, shade);
      if (row < rows && col < columns) {
        const a = row * (columns + 1) + col,
          b = a + columns + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
const leaf = leafGeometry();
// Fine fern silhouettes share one mesh and one draw call per visible chunk.
function fernGeometry() {
  const positions: number[] = [], colors: number[] = [], indices: number[] = [];
  for (let i = 0; i < 17; i++) {
    const t = (i + 1) / 18, x = t * 2.8,
      y = Math.sin(t * Math.PI) * 0.6 - t * t * 0.5,
      length = Math.pow(Math.sin(t * Math.PI), 0.7) * 0.72;
    for (const side of [-1, 1]) {
      const first = positions.length / 3;
      const points = [
        [x - 0.09, y, 0], [x + length * 0.22, y + 0.065, side * length * 0.52],
        [x + length * 0.56, y - 0.07, side * length], [x + 0.12, y - 0.03, side * 0.08],
      ];
      points.forEach((point, index) => {
        positions.push(...point);
        const shade = 0.76 + t * 0.17 + (index === 1 ? 0.12 : 0);
        colors.push(shade, shade, shade);
      });
      indices.push(first, first + 1, first + 2, first, first + 2, first + 3);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
const fern = fernGeometry();
function coralGeometry() {
  const vertices: number[] = [], indices: number[] = [];
  function branch(start: Vector3, end: Vector3, radius: number, depth: number) {
    const axis = end.clone().sub(start).normalize(),
      u = new Vector3(0, 0, 1).cross(axis).normalize(),
      v = axis.clone().cross(u).normalize(), first = vertices.length / 3;
    for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 7; i++) {
      const angle = i * Math.PI * 2 / 7,
        point = (ring ? end : start).clone()
          .addScaledVector(u, Math.cos(angle) * radius * (ring ? 0.65 : 1))
          .addScaledVector(v, Math.sin(angle) * radius * (ring ? 0.65 : 1));
      vertices.push(point.x, point.y, point.z);
      if (ring === 0) {
        const next = (i + 1) % 7;
        indices.push(first + i, first + next, first + 7 + i,
          first + next, first + 7 + next, first + 7 + i);
      }
    }
    if (depth > 0) for (let i = 0; i < 3; i++) {
      const angle = i * 2.1 + depth * 0.7,
        tip = end.clone().add(new Vector3(Math.cos(angle) * 0.42 * depth,
          0.4 + depth * 0.2, Math.sin(angle) * 0.26 * depth));
      branch(end, tip, radius * 0.58, depth - 1);
    }
  }
  branch(new Vector3(), new Vector3(0, 0.8, 0), 0.12, 2);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}
const coral = coralGeometry();
type TextureKind = "bark" | "soil" | "wood" | "leaf";
const textures = new Map<TextureKind, CanvasTexture>();
function texture(kind: TextureKind) {
  if (textures.has(kind)) return textures.get(kind)!;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const c = canvas.getContext("2d")!,
    image = c.createImageData(256, 256);
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      const i = (y * 256 + x) * 4,
        noise = random(x + y * 256) * 0.23;
      let value = 0.6 + noise;
      if (kind === "bark")
        value =
          0.48 +
          noise +
          Math.sin(x * 0.65 + Math.sin(y * 0.031) * 2) * 0.13 +
          Math.sin(x * 0.14) * 0.1;
      if (kind === "wood")
        value =
          0.55 +
          noise * 0.5 +
          Math.sin(y * 0.4 + Math.sin(x * 0.02) * 2) * 0.14;
      if (kind === "soil")
        value =
          0.44 +
          noise +
          random(Math.floor(x / 12) + Math.floor(y / 12) * 23) * 0.1 +
          random(Math.floor(x / 3) + Math.floor(y / 3) * 67) * 0.06;
      if (kind === "leaf") value = 0.7 + noise * 0.25;
      image.data[i] = Math.floor(value * 255);
      image.data[i + 1] = Math.floor(value * 255);
      image.data[i + 2] = Math.floor(value * 255);
      image.data[i + 3] = 255;
    }
  c.putImageData(image, 0, 0);
  if (kind === "leaf") {
    c.strokeStyle = "#b4c18b70";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, 128);
    c.lineTo(256, 128);
    c.stroke();
    c.lineWidth = 1;
    for (let x = 12; x < 256; x += 15) {
      c.beginPath();
      c.moveTo(x, 128);
      c.quadraticCurveTo(x + 15, 95, x + 22, 0);
      c.moveTo(x, 128);
      c.quadraticCurveTo(x + 15, 161, x + 22, 256);
      c.stroke();
    }
  }
  if (kind === "bark") {
    c.fillStyle = "#7c88664a";
    for (let i = 0; i < 60; i++) {
      c.beginPath();
      c.ellipse(
        random(i) * 256,
        random(i + 9) * 256,
        3 + random(i + 3) * 8,
        random(i + 2) * 5,
        0,
        0,
        Math.PI * 2,
      );
      c.fill();
    }
  }
  if (kind === "wood") {
    c.strokeStyle = "#241909";
    c.lineWidth = 3;
    for (let y = 0; y < 256; y += 64) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(256, y);
      c.stroke();
    }
  }
  const map = new CanvasTexture(canvas);
  map.wrapS = map.wrapT = RepeatWrapping;
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 2;
  map.repeat.set(
    kind === "leaf" ? 1 : kind === "bark" ? 2 : 3,
    kind === "leaf" ? 1 : 2,
  );
  textures.set(kind, map);
  return map;
}
type Instance = {
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
};
function Batch({
  geometry,
  items,
  color,
  map,
  vertexColors = false,
}: {
  geometry: BufferGeometry;
  items: Instance[];
  color: string;
  map?: TextureKind;
  vertexColors?: boolean;
}) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const dummy = new Object3D();
    items.forEach((item, i) => {
      dummy.position.fromArray(item.position);
      const r = item.rotation ?? [0, 0, 0];
      dummy.rotation.set(r[0], r[1], r[2]);
      dummy.scale.fromArray(item.scale);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
      ref.current!.setColorAt(i, new Color(item.color ?? "#ffffff"));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [items]);
  if (!items.length) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, undefined, items.length]}
      dispose={null}
    >
      <meshStandardMaterial
        color={color}
        map={map ? texture(map) : undefined}
        bumpMap={map && map !== "leaf" ? texture(map) : undefined}
        bumpScale={map === "bark" ? 0.08 : 0.045}
        roughness={0.92}
        side={vertexColors ? DoubleSide : undefined}
        vertexColors={vertexColors}
      />
    </instancedMesh>
  );
}
function ForestChunk({
  x,
  biome,
  game,
}: {
  x: number;
  biome: Biome;
  game: Game;
}) {
  const root = useRef<Group>(null),
    p = PALETTES[biome];
  useFrame(() => {
    if (root.current) root.current.visible = Math.abs(x - game.player.x) < 34;
  });
  const data = useMemo(() => {
    const trunks: Instance[] = [],
      foliage: Instance[] = [],
      ferns: Instance[] = [],
      corals: Instance[] = [],
      roots: Instance[] = [],
      stones: Instance[] = [],
      vines: Instance[] = [],
      extras: Instance[] = [];
    const cave = biome === "mine" || biome === "temple",
      sea = biome === "lagoon",
      snow = biome === "snow",
      ship = biome === "ship";
    if (ship) {
      for (let i = 0; i < 2; i++) {
        trunks.push({ position: [x + i * 8, 4, -7], scale: [0.18, 14, 0.18] });
        extras.push({
          position: [x + i * 8 + 1.5, 5.5, -7.2],
          scale: [4, 4.5, 0.12],
          color: "#a9a58a",
        });
      }
      return { trunks, foliage, ferns, corals, roots, stones, vines, extras };
    }
    for (let layer = 0; layer < 3; layer++)
      for (let i = 0; i < 3; i++) {
        const seed = x * 21 + i + layer * 89,
          r = random(seed),
          tx = x + i * 5.5 + r * 2,
          z = -4 - layer * 9 - r * 4,
          scale = 0.85 + r * 0.65,
          h = 5 + layer * 1.3 + r * 2;
        if (cave) {
          stones.push({
            position: [tx, layer === 0 ? -1 : 6, z],
            scale: [2 + r * 2, layer === 0 ? 2 + r * 3 : 7, 2],
          });
          if (biome === "temple")
            trunks.push({ position: [tx, 2.8, z], scale: [0.65, 8, 0.65] });
          else
            extras.push({
              position: [tx, 7, z],
              scale: [0.7 + r, 4 + r * 4, 1.1],
              rotation: [0, 0, Math.PI],
              color: "#5b5648",
            });
          continue;
        }
        if (sea) {
          stones.push({
            position: [tx, -2.7, z],
            scale: [2.7, 1.3 + r, 2],
            color: "#557b6b",
          });
          for (let n = 0; n < 4; n++) {
            if (n === 0) corals.push({
              position: [tx, -2.5, z], scale: [0.8 + r, 1.1 + r * 1.1, 0.8],
              rotation: [0, r * 4, 0], color: i % 2 ? "#db8caa" : "#d4af76",
            });
            foliage.push({
              position: [tx + 1.8, -2.7, z],
              scale: [1.1, 0.4, 0.5],
              rotation: [0, n * 0.3, 1.1 + n * 0.15],
              color: "#408f6f",
            });
          }
          continue;
        }
        trunks.push({
          position: [tx + 0.25, h * 0.48 - 1, z],
          scale: [(layer === 0 ? 0.42 : 0.28) * scale, h, (layer === 0 ? 0.42 : 0.28) * scale],
          rotation: [0, 0, -0.07 + r * 0.1],
          color: layer === 2 ? "#50715a" : "#b29a64",
        });
        if (snow) {
          for (let n = 0; n < 4; n++)
            extras.push({
              position: [tx, n * 1.2 + 1, z],
              scale: [2.1 - n * 0.4, 2.3, 2.1 - n * 0.4],
              color: n % 2 ? "#b8d0bf" : "#3d6450",
            });
          continue;
        }
        for (let n = 0; n < 5; n++) roots.push({
          position: [tx + (n - 2) * 0.22, -0.8, z],
          scale: [0.16 + r * 0.14, 2.1 + r, 0.28],
          rotation: [Math.sin(n * 1.7) * 0.3, n * 1.3, (n - 2) * 0.3],
          color: layer === 2 ? "#4e6d4c" : "#947948",
        });
        for (let n = 0; n < 7; n++)
          foliage.push({
            position: [tx + 0.4, h - 1, z],
            scale: [scale * (layer === 0 ? 0.72 : 1) * (0.85 + random(seed + n) * 0.3), scale * (layer === 0 ? 0.8 : 1), scale * (layer === 0 ? 0.72 : 1)],
            rotation: [
              0.1 + r * 0.3,
              (n * Math.PI * 2) / 7,
              -0.07 + random(seed + n) * 0.17,
            ],
            color:
              layer === 2 ? "#355a43" : n % 3 === 0 ? "#8baf44" : "#518c2a",
          });
        if (i % 2 === 0)
          vines.push({
            position: [tx + 1, h - 1, z + 0.6],
            scale: [1, Math.max(0.5,(h-1.1)/1.8), 1],
            color: "#476b2b",
          });
        for (let n = 0; n < 5; n++)
          foliage.push({
            position: [tx, -1.2, z + 1],
            scale: [0.35 + r * 0.22, 0.5, 0.6],
            rotation: [0.2, n * 1.3, -0.1],
            color: "#35652b",
          });
      }
    if (!ship && !snow) {
      for (let i = 0; i < 7; i++) {
        const seed = x * 13 + i * 37, tx = x + i * 2.5,
          r = random(seed), z = -3.5 - r * 2;
        if (sea) {
          // Fans and coral use warm silhouettes against the cool blue depth.
          for (let n = 0; n < 5; n++) {
            ferns.push({ position: [tx, -2.6, z], scale: [0.55 + r * 0.38, 1, 0.5],
              rotation: [0.2, n * 1.17, 0.85 + r * 0.6],
              color: i % 3 === 0 ? "#b85d86" : i % 3 === 1 ? "#b99754" : "#428b62" });
            if (n === 0) corals.push({ position: [tx, -2.6, z],
              scale: [0.45 + r * 0.35, 0.7 + r * 0.65, 0.5],
              rotation: [0, r * 5, 0], color: "#da91ae" });
          }
          continue;
        }
        if (cave) {
          stones.push({ position: [tx, 1.3 + r * 2, -8], scale: [1.8 + r, 4.4 + r * 2, 1.7],
            rotation: [0, r, r * 0.25], color: biome === "temple" ? "#7a7c58" : "#61665c" });
          continue;
        }
        for (let n = 0; n < 6; n++) ferns.push({
          position: [tx, -0.9, z], scale: [0.58 + r * 0.25, 0.8, 0.75],
          rotation: [0.15 + r * 0.2, n * 1.05, 0.35 + r * 0.2],
          color: n % 3 === 0 ? "#739e35" : "#3f762b",
        });
        for (let n = 0; n < 4; n++) ferns.push({
          position: [tx + 0.4, -1.3, -10 - r * 5], scale: [0.8 + r * 0.45, 1, 1.1],
          rotation: [0.15, n * 1.57, 0.4 + r * 0.35], color: "#376942",
        });
      }
    }
    if (!cave && !sea)
      for (let i = 0; i < 5; i++)
        stones.push({
          position: [x + i * 3.4, -3, -23],
          scale: [5, 6 + random(i + x) * 5, 3],
          color: "#284c32",
        });
    return { trunks, foliage, ferns, corals, roots, stones, vines, extras };
  }, [x, biome]);
  return (
    <group ref={root} name="background-decor" position={[0,0,-4]}>
      <Batch
        geometry={cylinder}
        items={data.trunks}
        color={biome === "lagoon" ? "#c5b1a2" : "#aaa28a"}
        map="bark"
      />
      <Batch
        geometry={leaf}
        items={data.foliage}
        color="#c2dc91"
        map="leaf"
        vertexColors
      />
      <Batch geometry={fern} items={data.ferns} color="#c1dba1" vertexColors />
      <Batch geometry={coral} items={data.corals} color="#f4dacb" />
      <Batch geometry={cylinder} items={data.roots} color="#bda788" map="bark" />
      <Batch geometry={rock} items={data.stones} color={biome === "lagoon" ? "#a8c6bc" : p.ground} map="soil" />
      <Batch geometry={vine} items={data.vines} color="#75953e" />
      <Batch
        geometry={biome === "ship" ? box : cone}
        items={data.extras}
        color="#a9a18b"
        map={biome === "ship" ? "wood" : undefined}
      />
    </group>
  );
}
function Ground({ platform, game }: { platform: Platform; game: Game }) {
  const ref = useRef<Group>(null),
    biome = game.level.biome,
    p = PALETTES[biome],
    wood = platform.kind === "wood" || biome === "mine",
    stone = platform.kind === "stone";
  useFrame(() => {
    if (ref.current) {
      ref.current.position.y = game.surface(platform);
      ref.current.visible =
        Math.abs(platform.x - game.player.x) < 34 &&
        !(game.phase === "title" && platform.y > 0);
    }
  });
  const depth = wood && platform.h < 2 ? 0.2 : platform.h;
  const data = useMemo(() => {
    const edge: Instance[] = [],
      rocks: Instance[] = [],
      roots: Instance[] = [],
      plants: Instance[] = [],
      planks: Instance[] = [];
    for (let i = 0; i < Math.ceil(platform.w * 1.7); i++) {
      const x = -platform.w / 2 + i * 0.59,
        r = random(i + platform.x);
      edge.push({
        position: [x, -0.15 - r * 0.04, 1.6],
        scale: [0.42 + r * 0.2, 0.14 + r * 0.1, 0.3],
        rotation: [0, r * 2, r * 0.1],
        color: i % 3 === 0 ? "#718b2a" : "#4d6e23",
      });
      rocks.push({
        position: [x, -0.55 - r * 0.7, 1.47],
        scale: [0.48 + r * 0.3, 0.45 + r * 0.7, 0.38],
        rotation: [r * 0.3, r * 3, r * 0.8],
        color: i % 3 === 0 ? "#8c8265" : i % 2 ? "#78644c" : "#a18357",
      });
    }
    for (let i = 0; i < Math.floor(platform.w / 3); i++)
      roots.push({
        position: [-platform.w / 2 + i * 3 + 0.6, -0.15, 1.68],
        scale: [1, 1 + random(i) * 1.2, 1],
      });
    for (let i = 0; i < Math.ceil(platform.w / 2); i++)
      for (let n = 0; n < 4; n++)
        plants.push({
          position: [-platform.w / 2 + i * 2, -0.02, -2.5],
          scale: [0.2, 0.26, 0.32],
          rotation: [0, n * 1.5, -0.2],
          color: "#5c8a27",
        });
    for (let i = 0; i < Math.ceil(platform.w / 0.7); i++)
      planks.push({
        position: [-platform.w / 2 + i * 0.7, -0.04, 0],
        scale: [0.64, 0.16, 3.4],
        color: i % 2 ? "#8b6537" : "#aa8145",
      });
    return { edge, rocks, roots, plants, planks };
  }, [platform]);
  return (
    <group ref={ref} position={[platform.x, platform.y, 0]}>
      <mesh
        geometry={box}
        position={[0, -depth / 2, 0]}
        scale={[platform.w, depth, 3.2]}
      >
        <meshStandardMaterial
          color={wood ? "#644726" : p.ground}
          map={texture(wood ? "wood" : "soil")}
          bumpMap={texture(wood ? "wood" : "soil")}
          bumpScale={0.065}
          roughness={1}
        />
      </mesh>
      {wood ? (
        <Batch geometry={box} items={data.planks} color="#d6b16e" map="wood" />
      ) : (
        <>
          <mesh
            geometry={box}
            position={[0, -0.08, 0]}
            scale={[platform.w + 0.06, 0.17, 3.35]}
          >
            <meshStandardMaterial
              color={p.grass}
              map={texture("soil")}
              roughness={1}
            />
          </mesh>
          <Batch
            geometry={rock}
            items={data.rocks}
            color={stone ? "#9a977e" : "#a27a44"}
            map="soil"
          />
          <Batch
            geometry={rock}
            items={data.edge}
            color={biome === "snow" ? "#e7f0df" : "#789336"}
          />
          <Batch
            geometry={vine}
            items={data.roots}
            color="#736044"
            map="bark"
          />
          {biome !== "snow" && (
            <Batch
              geometry={leaf}
              items={data.plants}
              color="#9ab24e"
              map="leaf"
              vertexColors
            />
          )}
        </>
      )}
      {biome === "mine" &&
        [-0.8, 0.8].map((z) => (
          <mesh
            key={z}
            geometry={box}
            position={[0, 0.12, z]}
            scale={[platform.w, 0.1, 0.12]}
          >
            <meshStandardMaterial
              color="#8a8c84"
              metalness={0.7}
              roughness={0.45}
            />
          </mesh>
        ))}
      {platform.kind === "moving" &&
        [-1, 1].map((side) => (
          <mesh
            key={side}
            geometry={cylinder}
            position={[side * platform.w * 0.4, 3, -1]}
            scale={[0.025, 6, 0.025]}
          >
            <meshStandardMaterial color="#9d814c" map={texture("bark")} />
          </mesh>
        ))}
    </group>
  );
}
function CoralScatter({ length }: { length: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: Math.ceil(length / 6) + 2 }, (_, i) => ({
        x: i * 6 + random(i) * 4,
        z: -7 - random(i + 11) * 6,
        scale: 0.35 + random(i + 23) * 0.9,
        rot: random(i + 37) * Math.PI * 2,
        tone: 0.42 + random(i + 51) * 0.35,
      })),
    [length],
  );
  return (
    <group>
      {items.map((item, i) => (
        <group key={i} position={[item.x, -2.8 - item.scale * 0.6, item.z]}>
          <mesh
            geometry={cone}
            rotation={[0.15, item.rot, 0]}
            scale={[item.scale, item.scale * 1.55, item.scale]}
          >
            <meshStandardMaterial
              color={`hsl(${158 + item.tone * 48}, ${48 + item.tone * 20}%, ${38 + item.tone * 18}%)`}
              roughness={0.72}
              metalness={0.05}
            />
          </mesh>
          <mesh
            geometry={sphere}
            position={[item.scale * 0.35, item.scale * 0.2, item.scale * 0.2]}
            scale={[item.scale * 0.35, item.scale * 0.35, item.scale * 0.35]}
          >
            <meshStandardMaterial
              color={`hsl(${185 + item.tone * 30}, 70%, ${72 + item.tone * 12}%)`}
              emissive="#4a9aaa"
              emissiveIntensity={0.15}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
function Motes({ game }: { game: Game }) {
  const ref = useRef<InstancedMesh>(null),
    n = game.level.biome === "snow" ? 55 : 22,
    dummy = useMemo(() => new Object3D(), []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    for (let i = 0; i < n; i++) {
      dummy.position.set(
        game.player.x - 18 + random(i) * 36,
        game.level.biome === "snow"
          ? 9 - ((random(i + 1) * 14 + clock.elapsedTime * 0.8) % 14)
          : random(i + 1) * 11 + Math.sin(clock.elapsedTime + i) * 0.2 - 2,
        random(i + 2) * 12 - 7,
      );
      dummy.scale.setScalar(game.level.biome === "snow" ? 0.025 : 0.012);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  });
  return (
    <instancedMesh ref={ref} args={[sphere, undefined, n]}>
      <meshBasicMaterial
        color={game.level.biome === "snow" ? "#fff6dd" : "#d8da85"}
        transparent
        opacity={0.55}
      />
    </instancedMesh>
  );
}
export const World = memo(function World({
  game,
  level,
}: {
  game: Game;
  level: Level;
}) {
  const p = PALETTES[level.biome],
    chunks = useMemo(
      () =>
        Array.from(
          { length: Math.ceil(level.length / 16) + 4 },
          (_, i) => i * 16 - 16,
        ),
      [level],
    );
  return (
    <>
      <color attach="background" args={[p.sky]} />
      <fog
        attach="fog"
        args={[
          p.mist,
          level.originalTerrain === "coral" ? 18 : 29,
          level.originalTerrain === "coral" ? 58 : 77,
        ]}
      />
      <hemisphereLight args={[level.biome === "lagoon" ? "#9dcedb" : "#d5dfbd", "#1a2013", 1.3]} />
      <ambientLight intensity={level.biome === "lagoon" ? 0.3 : 0.12} />
      <directionalLight position={[-7, 12, 9]} color={p.light} intensity={2.8} />
      <directionalLight
        position={[-9, 5, -6]}
        color={level.biome === "lagoon" ? "#5faccc" : "#7aa77a"}
        intensity={0.8}
      />
      {level.originalTerrain === "jungle" ? (
        <OriginalGround game={game} />
      ) : level.originalTerrain === "cave" ? (
        <OriginalCaveGround game={game} />
      ) : level.originalTerrain === "mineCart" ? (
        <OriginalMineCartGround game={game} />
      ) : level.originalTerrain === "coral" ? (
        <OriginalCoralGround game={game} />
      ) : (
        (level.biome === "ship" ? [] : level.platforms).map((platform, i) => (
          <Ground key={i} platform={platform} game={game} />
        ))
      )}
      {level.biome==='ship' && <ShipArena game={game}/>}
      {(level.biome==='ship'?[]:chunks).map((x) => (
        <ForestChunk key={x} x={x} biome={level.biome} game={game} />
      ))}
      {level.biome === "lagoon" && (
        <mesh geometry={box} name="background-water" position={[level.length/2,-4.8,-18]} scale={[level.length+70,0.12,20]}>
          <meshStandardMaterial color="#286d62" metalness={0.3} roughness={0.28}/>
        </mesh>
      )}
      {level.originalTerrain === "coral" && (
        <>
          <CoralScatter length={level.length} />
          <mesh geometry={box} position={[level.length/2, CORAL_WATER_FLOOR_Y-0.4, 0]} scale={[level.length+4, 0.8, 3.2]}>
            <meshStandardMaterial color="#637b64" roughness={0.95} map={texture("soil")} />
          </mesh>
        </>
      )}
      {level.biome === "jungle" && !level.originalTerrain && (
        <group position={[21, 2, -23]}>
          <mesh geometry={rock} scale={[4, 8, 3]} position={[-3, -1, -2]}>
            <meshStandardMaterial color="#3a5944" map={texture("soil")} />
          </mesh>
          <mesh geometry={box} scale={[1.7, 12, 0.08]}>
            <meshStandardMaterial
              color="#b4d4bd"
              transparent
              opacity={0.68}
              emissive="#6d9c89"
              emissiveIntensity={0.25}
            />
          </mesh>
          <mesh geometry={sphere} position={[0, -5, 0]} scale={[4, 0.15, 1]}>
            <meshBasicMaterial color="#8ab6a4" transparent opacity={0.3} />
          </mesh>
        </group>
      )}
      <Motes game={game} />
    </>
  );
});
