import type { AnimalKind } from './types'
import { pick } from '../../utils/pick'

export type AnimalMotionInput = {
  moving: boolean
  attacking: boolean
  gliding: boolean
  charging: number
}

export type AnimalFrameContext = {
  kind: AnimalKind
  tick: number
  move: boolean
  attack: boolean
  glide: boolean
  charge: number
  ready: boolean
}

function chargeShakeSpeed(ready: boolean): number {
  if (ready) {
    return 46
  }

  return 26
}

export function rootOffsetX(
  charge: number,
  ready: boolean,
  tick: number,
): number {
  let shake
  if (charge > 0) {
    shake = Math.sin(tick * chargeShakeSpeed(ready)) * 0.025 * charge
  } else {
    shake = 0
  }

  return -charge * 0.16 + shake
}

export function rootOffsetY(
  kind: AnimalKind,
  glide: boolean,
  charge: number,
  tick: number,
): number {
  if (kind === 'rambi') {
    return -charge * 0.1
  }

  if (glide) {
    return Math.sin(tick * 20) * 0.035
  }

  if (charge > 0) {
    return Math.sin(tick * 28) * 0.025
  }

  return 0
}

export function rootAnimationLabel(
  glide: boolean,
  charge: number,
  ready: boolean,
  attack: boolean,
  move: boolean,
): string {
  if (glide) {
    return 'flutter'
  }

  if (charge > 0) {
    if (ready) {
      return 'ready'
    }

    return 'charging'
  }

  if (attack) {
    return 'attack'
  }

  if (move) {
    return 'moving'
  }

  return 'idle'
}

export function strideRotationZ(
  ctx: AnimalFrameContext,
  phase: number,
  amplitude: number,
): number {
  const { kind, tick, move, charge, ready } = ctx

  if (charge > 0 && kind === 'rambi') {
    return Math.sin(tick * pick(ready, 30, 18) + phase) * 0.22 * charge
  }

  let speed
  if (kind === 'expresso') {
    speed = 15
  } else {
    speed = 10
  }

  let swing
  if (move) {
    swing = amplitude
  } else {
    swing = 0.025
  }

  return Math.sin(tick * speed + phase) * swing
}

export function tailRotationY(ctx: AnimalFrameContext): number {
  const { tick, move, attack, charge } = ctx

  let speed = 4

  if (charge > 0) {
    speed = 24
  } else if (attack) {
    speed = 22
  } else if (move) {
    speed = 10
  }

  let amount = 0.13

  if (charge > 0) {
    amount = 0.55
  } else if (move) {
    amount = 0.32
  }

  return Math.sin(tick * speed) * amount
}

export function finRotationX(ctx: AnimalFrameContext, phase: number): number {
  const { tick, attack, charge } = ctx

  let speed
  if (charge > 0 || attack) {
    speed = 22
  } else {
    speed = 7
  }

  let amount
  if (charge > 0) {
    amount = 0.55
  } else {
    amount = 0.13
  }

  return Math.sin(tick * speed + phase) * amount
}

export function wingMotion(
  side: number,
  glide: boolean,
  tick: number,
): { rotationX: number; rotationZ: number; scale: number } {
  if (glide) {
    return {
      rotationX: side * (0.85 + Math.sin(tick * 20) * 0.55),
      rotationZ: -0.2 + Math.sin(tick * 20) * 0.65,
      scale: 1.3,
    }
  }

  return {
    rotationX: side * (Math.sin(tick * 6) * 0.07),
    rotationZ: 0,
    scale: 1,
  }
}
