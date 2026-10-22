export type AudioEffectContext = {
  character?: number
  animal?: string
  letterIndex?: number
  inWater?: boolean
}

const DIRECT_EFFECT_IDS: Record<string, number> = {
  banana: 0x21,
  'banana-bunch': 0x22,
  life: 0x2f,
  stomp: 0x08,
  bounce: 0x01,
  cannon: 0x04,
  'enter-cannon': 0x26,
  rescue: 0x14,
  mount: 0x58,
  swap: 0x65,
  'barrel-break': 0x14,
  throw: 0x02,
  pickup: 0x11,
  place: 0x11,
  checkpoint: 0x10,
  reveal: 0x10,
  'necky-shot': 0x5c,
  'map-step': 0x33,
  'map-arrive': 0x60,
  'boss-hurt': 0x53,
  'boss-land': 0x15,
  'boss-ball-impact': 0x1e,
  'animal-token-1': 0x60,
  'animal-token-2': 0x61,
  'animal-token-3': 0x62,
}

function hurtEffectId(context: AudioEffectContext): number {
  if (context.character) {
    return 0x43
  } else {
    return 0x46
  }
}

function letterEffectId(context: AudioEffectContext): number {
  return 0x4f + Math.min(3, context.letterIndex ?? 0)
}

function jumpEffectId(context: AudioEffectContext): number | undefined {
  if (context.inWater && !context.animal) {
    if (context.character) {
      return 0x75
    } else {
      return 0x76
    }
  }

  if (context.animal) {
    if (context.animal === 'enguarde') {
      return 0x57
    } else {
      return 0x5f
    }
  }

  return undefined
}

function rollEffectId(context: AudioEffectContext): number | undefined {
  if (context.animal === 'rambi') {
    return 0x56
  }

  if (context.animal === 'enguarde') {
    return 0x57
  }

  return undefined
}

/** Pure Rev 2 SFX id routing for tests and tooling. */
export function resolveAudioEffectId(
  name: string,
  context: AudioEffectContext = {},
): number | undefined {
  if (name === 'hurt') {
    return hurtEffectId(context)
  }

  if (name === 'letter') {
    return letterEffectId(context)
  }

  if (name === 'jump') {
    const jumpId = jumpEffectId(context)

    if (jumpId !== undefined) {
      return jumpId
    }
  }

  if (name === 'roll') {
    const rollId = rollEffectId(context)

    if (rollId !== undefined) {
      return rollId
    }
  }

  return DIRECT_EFFECT_IDS[name]
}
