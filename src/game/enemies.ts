import type { EnemySpec } from "./levels";
import { L } from "../i18n/keys";
/** Body hit areas exclude flexible tails, wings and antennae. */
export const ENEMY_DESIGNS: Record<
  EnemySpec["kind"],
  {
    name: string;
    reference: string;
    height: number;
    width: number;
    scale: number;
  }
> = {
  beetle: {
    name: L.enemies.beetle,
    reference: "Gnawty",
    height: 0.8,
    width: 0.64,
    scale: 0.82,
  },
  croc: {
    name: L.enemies.croc,
    reference: "Kritter",
    height: 1.2,
    width: 0.63,
    scale: 0.76,
  },
  armored: {
    name: L.enemies.armored,
    reference: "Klump",
    height: 1.44,
    width: 0.65,
    scale: 0.78,
  },
  bee: {
    name: L.enemies.bee,
    reference: "Zinger",
    height: 0.72,
    width: 0.7,
    scale: 1,
  },
  boss: {
    name: L.enemies.boss,
    reference: "King K. Rool",
    height: 1.95,
    width: 1.05,
    scale: 1.05,
  },
};
