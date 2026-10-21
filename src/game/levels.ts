import type { AnimalSpawn } from "./animals";

export type Biome =
  "jungle" | "canopy" | "mine" | "lagoon" | "snow" | "temple" | "ship";
export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  kind?: "wood" | "stone" | "moving";
  travel?: number;
}
export interface Pickup {
  x: number;
  y: number;
  kind: "banana" | "letter" | "balloon";
  letter?: string;
  amount?: number;
}
export interface EnemySpec {
  x: number;
  y: number;
  min: number;
  max: number;
  kind: "beetle" | "croc" | "bee" | "armored" | "boss";
}
export interface BarrelSpec {
  x: number;
  y: number;
  kind: "rescue" | "checkpoint" | "throw" | "cannon";
  angle?: number;
  rotationSpeed?: number;
  autoFire?: boolean;
}
export interface Level {
  id: number;
  name: string;
  subtitle: string;
  biome: Biome;
  length: number;
  platforms: Platform[];
  pickups: Pickup[];
  enemies: EnemySpec[];
  barrels: BarrelSpec[];
  tip: string;
  animals?: AnimalSpawn[];
  originalTerrain?: "jungle";
  start?: {x:number; y:number};
  letterWord?: string;
}

const p = (x: number, w: number, y = 0, kind?: Platform["kind"]): Platform => ({
  x,
  y,
  w,
  h: y === 0 ? 4.4 : 0.65,
  kind,
});
const e = (
  x: number,
  min: number,
  max: number,
  kind: EnemySpec["kind"] = "beetle",
  y = 0,
): EnemySpec => ({ x, y, min, max, kind });
function pickups(
  platforms: Platform[],
  length: number,
  water = false,
): Pickup[] {
  const items: Pickup[] = [];
  platforms.forEach((ground, index) => {
    if (ground.w < 2) return;
    for (let n = 0; n < Math.min(6, Math.floor(ground.w / 1.4)); n++)
      items.push({
        x: ground.x - ground.w * 0.34 + n * 1.2,
        y: ground.y + 1.35 + Math.sin((n / 5) * Math.PI) * (water ? 2 : 0.5),
        kind: "banana",
      });
    if (index % 6 === 3)
      items.push({ x: ground.x, y: ground.y + 3.8, kind: "balloon" });
  });
  // Each letter rests above an actual reachable platform, including moving ones.
  "GOONK".split("").forEach((letter, index) => {
    const target = length * (0.13 + index * 0.17);
    const surface = platforms.reduce((best, next) =>
      Math.abs(next.x - target) < Math.abs(best.x - target) ? next : best,
    );
    items.push({ x: surface.x, y: surface.y + 2.3, kind: "letter", letter });
  });
  return items;
}
function make(
  id: number,
  name: string,
  subtitle: string,
  biome: Biome,
  length: number,
  platforms: Platform[],
  enemies: EnemySpec[],
  barrels: BarrelSpec[],
  tip: string,
): Level {
  return {
    id,
    name,
    subtitle,
    biome,
    length,
    platforms,
    pickups: pickups(platforms, length, biome === "lagoon"),
    enemies,
    barrels,
    tip,
  };
}
export const LEVELS: Level[] = [
  make(
    0,
    "La jungle s’éveille",
    "KONGO JUNGLE",
    "jungle",
    124,
    [
      p(7, 22),
      p(25, 10),
      p(40, 13),
      p(55, 11),
      p(71, 13),
      p(88, 13),
      p(108, 20),
      p(122, 8),
      p(14, 3, 2.1, "wood"),
      p(33, 3, 2.2, "wood"),
      p(62, 3, 2.3, "wood"),
      p(96, 3, 2.2, "wood"),
    ],
    [
      e(24, 21, 29),
      e(40, 35, 45, "croc"),
      e(55, 51, 59),
      e(74, 67, 76, "armored"),
      e(88, 83, 92),
      e(108, 101, 116, "croc"),
    ],
    [
      { x: 6, y: 0, kind: "rescue" },
      { x: 19, y: 0, kind: "throw" },
      { x: 53, y: 0, kind: "checkpoint" },
      { x: 68, y: 0, kind: "throw" },
      { x: 90, y: 0, kind: "rescue" },
    ],
    "Maintiens le saut pour aller plus haut. Rose est puissante ; Violette est plus rapide.",
  ),
  make(
    1,
    "Au-dessus des feuilles",
    "VINE VALLEY",
    "canopy",
    129,
    [
      p(3, 14),
      p(16, 7, 1.2, "wood"),
      p(26, 8, 2.1, "wood"),
      p(37, 6, 1, "wood"),
      p(47, 7, 2.4, "wood"),
      { ...p(57, 4, 1.2, "moving"), travel: 2 },
      p(67, 9, 0, "wood"),
      p(80, 10, 1.5, "wood"),
      p(90, 6, 3, "wood"),
      { ...p(100, 4, 1.6, "moving"), travel: 1.5 },
      p(111, 9, 1, "wood"),
      p(124, 14),
    ],
    [
      e(26, 23, 29),
      e(44, 42, 51, "bee", 4.3),
      e(68, 64, 70, "croc"),
      e(85, 80, 91, "bee", 4.8),
      e(112, 108, 114),
    ],
    [
      { x: 4, y: 0, kind: "rescue" },
      { x: 65, y: 0, kind: "checkpoint" },
      { x: 75, y: 1.3, kind: "cannon", angle: 0.75, rotationSpeed: 1.2 },
      { x: 111, y: 1, kind: "rescue" },
    ],
    "Saute dans les tonneaux-canons. Espace pour décoller, puis dirige ton atterrissage.",
  ),
  make(
    2,
    "Le grand déraillement",
    "MONKEY MINES",
    "mine",
    168,
    [
      p(6, 20),
      p(25, 12),
      p(43, 15),
      p(64, 17),
      p(86, 14),
      p(108, 19),
      p(134, 20),
      p(158, 24),
    ],
    [
      e(29, 29, 29, "armored"),
      e(69, 69, 69, "armored"),
      e(115, 115, 115, "armored"),
      e(141, 141, 141, "armored"),
    ],
    [
      { x: 6, y: 0, kind: "rescue" },
      { x: 82, y: 0, kind: "checkpoint" },
      { x: 109, y: 0, kind: "rescue" },
    ],
    "Le wagon avance tout seul. Anticipe les rails coupés et saute au-dessus des obstacles.",
  ),
  make(
    3,
    "Sous le lagon",
    "CORAL CAPERS",
    "lagoon",
    126,
    [
      p(4, 18, -1.8, "stone"),
      p(25, 16, -2.5, "stone"),
      p(48, 17, -1.8, "stone"),
      p(70, 17, -2.2, "stone"),
      p(94, 20, -1.5, "stone"),
      p(118, 20, -1.4, "stone"),
    ],
    [
      e(23, 18, 29, "bee", 2),
      e(39, 34, 45, "croc", 3.7),
      e(57, 52, 63, "bee", 0.8),
      e(80, 74, 86, "croc", 3.8),
      e(102, 97, 108, "bee", 2),
    ],
    [
      { x: 5, y: -1.8, kind: "rescue" },
      { x: 65, y: -2.2, kind: "checkpoint" },
      { x: 93, y: -1.5, kind: "rescue" },
    ],
    "Maintiens Espace pour nager. Explore les fonds, et garde tes distances avec les méduses.",
  ),
  make(
    4,
    "Les flocons perdus",
    "GORILLA GLACIER",
    "snow",
    132,
    [
      p(5, 18),
      p(22, 10),
      p(37, 12, 0.5),
      p(53, 13, 1.2),
      p(67, 10),
      p(82, 12, 1.1),
      p(98, 14, 2),
      p(112, 10, 0.8),
      p(127, 15),
    ],
    [
      e(22, 18, 26, "croc"),
      e(39, 33, 41, "armored", 0.5),
      e(54, 50, 57, "croc", 1.2),
      e(83, 78, 86),
      e(99, 94, 101, "bee", 4),
      e(116, 108, 116, "croc", 0.8),
    ],
    [
      { x: 6, y: 0, kind: "rescue" },
      { x: 33, y: 0.5, kind: "throw" },
      { x: 65, y: 0, kind: "checkpoint" },
      { x: 79, y: 1.1, kind: "throw" },
      { x: 111, y: 0.8, kind: "rescue" },
    ],
    "La glace conserve ton élan. Relâche la course avant le bord des plateformes.",
  ),
  make(
    5,
    "Le temple oublié",
    "CHIMP CAVERNS",
    "temple",
    135,
    [
      p(4, 16, 0, "stone"),
      p(20, 9, 1, "stone"),
      p(33, 9, 2, "stone"),
      { ...p(45, 5, 1.5, "moving"), travel: 2 },
      p(57, 10, 0, "stone"),
      p(71, 10, 1, "stone"),
      p(84, 9, 2, "stone"),
      { ...p(96, 5, 1.5, "moving"), travel: 1.7 },
      p(108, 9, 1, "stone"),
      p(126, 20, 0, "stone"),
    ],
    [
      e(21, 17, 23, "armored", 1),
      e(57, 53, 60, "croc"),
      e(72, 68, 74, "armored", 1),
      e(84, 81, 87, "bee", 4.3),
      e(126, 119, 131, "croc"),
    ],
    [
      { x: 5, y: 0, kind: "rescue" },
      { x: 16, y: 1, kind: "throw" },
      { x: 56, y: 0, kind: "checkpoint" },
      { x: 68, y: 1, kind: "throw" },
      { x: 103, y: 1.2, kind: "cannon", angle: 0.7 },
    ],
    "Une roulade de Rose peut vaincre les crocodiles casqués. Violette préfère les tonneaux.",
  ),
  make(
    6,
    "Le roi des voleurs",
    "GANGPLANK GALLEON",
    "ship",
    46,
    [p(20, 56, 0, "wood")],
    [e(32, 23, 39, "boss")],
    [
      { x: 4, y: 0, kind: "rescue" },
      { x: 10, y: 0, kind: "throw" },
      { x: 20, y: 0, kind: "checkpoint" },
    ],
    "Évite les bonds du roi. Quand il reprend son souffle, saute sur sa tête !",
  ),
];

// Animal crates belong to appropriate habitats; paths remain playable on foot.
LEVELS[0].animals = [{kind: "rambi", x: 11, y: 0}];
LEVELS[1].animals = [{kind: "winky", x: 7, y: 0}, {kind: "expresso", x: 69, y: 0}];
LEVELS[3].animals = [{kind: "enguarde", x: 10, y: 1.8}];
LEVELS[4].animals = [{kind: "expresso", x: 9, y: 0}];
LEVELS[5].animals = [{kind: "winky", x: 8, y: 0}];
