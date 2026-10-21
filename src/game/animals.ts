import evidence from "../../reference/buddy-analysis.json";
const speed = (raw: number) => raw / 256 * 60 / 32;
const f = evidence.findings;
/** Behaviour follows the Nintendo DKC manual; numerical tuning is an adaptation
 * until independently matched to Rev 2. See reference/buddy-analysis.md. */
export type AnimalKind = "rambi" | "enguarde" | "winky" | "expresso";
export interface AnimalSpawn { kind: AnimalKind; x: number; y: number }
export interface Animal extends AnimalSpawn {
  state: "crate" | "idle" | "ridden" | "fleeing";
  vx: number; vy: number; facing: number; timer: number;
}
export const ANIMAL_DESIGNS = {
  rambi: { name: "Rambi", seat: 1.25, width: 0.92, walk: speed(f.buddyWalkTargets.values.defaultIncludingRambiRaw), run: speed(f.buddyRunTargets.values.defaultIncludingRambiRaw), jump: speed(f.rambiExpressoJumpImpulse.values.verticalSpeedRaw) },
  enguarde: { name: "Enguarde", seat: 0.23, width: 1.1, walk: 5.2, run: 5.2, jump: 0 },
  winky: { name: "Winky", seat: 0.88, width: 0.67, walk: speed(f.buddyWalkTargets.values.winkyRaw), run: speed(f.buddyRunTargets.values.winkyRaw), jump: speed(f.winkyJumpImpulse.values.verticalSpeedRaw) },
  expresso: { name: "Expresso", seat: 1.65, width: 0.68, walk: speed(f.buddyWalkTargets.values.expressoRaw), run: speed(f.buddyRunTargets.values.expressoRaw), jump: speed(f.rambiExpressoJumpImpulse.values.verticalSpeedRaw) },
} as const;

export const BUDDY_PHYSICS = {
  heldGravity: -f.riderAirGravity.values.heldGravityRaw,
  stabSpeed: speed(f.enguardeStabImpulse.values.horizontalMagnitudeRaw),
  rollStill: speed(f.rollBaseSpeeds.values.stationaryRaw),
  rollMoving: speed(f.rollBaseSpeeds.values.directionHeldRaw),
  rollRunning: speed(f.recentRunRollBonus.values.bonusSpeedRaw),
  recentRunSeconds: f.recentRunRollBonus.values.elapsedThreshold / 60,
  chainIncrement: speed(f.rollChainAcceleration.values.incrementRaw),
  chainCap: speed(f.rollChainAcceleration.values.capRaw),
};

/** Horizontal fish and rider, using the same corridor scale as the swimmer. */
export const ENGUARDE_SWIM_BODY = { radius: .35, height: 1.25 };
