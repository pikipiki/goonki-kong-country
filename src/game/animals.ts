import evidence from '../../reference/buddy-analysis.json'
import { localeKeys } from '../i18n/keys'
import { rawSpeed } from './engine/romPhysics'

const speed = rawSpeed
const findings = evidence.findings
/** Behaviour follows the Nintendo DKC manual; numerical tuning is an adaptation
 * until independently matched to Rev 2. See reference/buddy-analysis.md. */
export type AnimalKind = 'rambi' | 'enguarde' | 'winky' | 'expresso'

export interface AnimalSpawn {
  kind: AnimalKind
  x: number
  y: number
}

export interface Animal extends AnimalSpawn {
  state: 'crate' | 'idle' | 'ridden' | 'fleeing'
  vx: number
  vy: number
  facing: number
  timer: number
}

export const ANIMAL_DESIGNS = {
  rambi: {
    name: localeKeys.animals.rambi,
    seat: 1.25,
    width: 0.92,
    walk: speed(findings.buddyWalkTargets.values.defaultIncludingRambiRaw),
    run: speed(findings.buddyRunTargets.values.defaultIncludingRambiRaw),
    jump: speed(findings.rambiExpressoJumpImpulse.values.verticalSpeedRaw),
  },
  enguarde: {
    name: localeKeys.animals.enguarde,
    seat: 0.23,
    width: 1.1,
    walk: 5.2,
    run: 5.2,
    jump: 0,
  },
  winky: {
    name: localeKeys.animals.winky,
    seat: 0.88,
    width: 0.67,
    walk: speed(findings.buddyWalkTargets.values.winkyRaw),
    run: speed(findings.buddyRunTargets.values.winkyRaw),
    jump: speed(findings.winkyJumpImpulse.values.verticalSpeedRaw),
  },
  expresso: {
    name: localeKeys.animals.expresso,
    seat: 1.65,
    width: 0.68,
    walk: speed(findings.buddyWalkTargets.values.expressoRaw),
    run: speed(findings.buddyRunTargets.values.expressoRaw),
    jump: speed(findings.rambiExpressoJumpImpulse.values.verticalSpeedRaw),
  },
} as const
export const BUDDY_PHYSICS = {
  heldGravity: -findings.riderAirGravity.values.heldGravityRaw,
  stabSpeed: speed(findings.enguardeStabImpulse.values.horizontalMagnitudeRaw),
  rollStill: speed(findings.rollBaseSpeeds.values.stationaryRaw),
  rollMoving: speed(findings.rollBaseSpeeds.values.directionHeldRaw),
  rollRunning: speed(findings.recentRunRollBonus.values.bonusSpeedRaw),
  recentRunSeconds: findings.recentRunRollBonus.values.elapsedThreshold / 60,
  chainIncrement: speed(findings.rollChainAcceleration.values.incrementRaw),
  chainCap: speed(findings.rollChainAcceleration.values.capRaw),
}
/** Horizontal fish and rider, using the same corridor scale as the swimmer. */
export const ENGUARDE_SWIM_BODY = { radius: 0.35, height: 1.25 }
