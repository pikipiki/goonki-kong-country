import { describe, expect, it } from 'vitest'
import { resolveAudioEffectId } from '../src/game/audio'
describe('resolveAudioEffectId branches', () => {
  it('covers contextual hurt, letter, jump, and roll routing', () => {
    expect(resolveAudioEffectId('hurt', { character: 0 })).toBe(0x46)
    expect(resolveAudioEffectId('hurt', { character: 1 })).toBe(0x43)
    expect(resolveAudioEffectId('letter', { letterIndex: 0 })).toBe(0x4f)
    expect(resolveAudioEffectId('letter', { letterIndex: 9 })).toBe(0x52)
    expect(resolveAudioEffectId('jump', { inWater: true, character: 1 })).toBe(
      0x75,
    )
    expect(resolveAudioEffectId('jump', { inWater: true, character: 0 })).toBe(
      0x76,
    )
    expect(resolveAudioEffectId('jump', { animal: 'enguarde' })).toBe(0x57)
    expect(resolveAudioEffectId('jump', { animal: 'rambi' })).toBe(0x5f)
    expect(resolveAudioEffectId('roll', { animal: 'rambi' })).toBe(0x56)
    expect(resolveAudioEffectId('roll', { animal: 'enguarde' })).toBe(0x57)
  })
  it('covers the direct effect table', () => {
    const names = [
      'banana',
      'banana-bunch',
      'life',
      'stomp',
      'bounce',
      'cannon',
      'enter-cannon',
      'rescue',
      'mount',
      'swap',
      'barrel-break',
      'throw',
      'pickup',
      'place',
      'checkpoint',
      'reveal',
      'necky-shot',
      'map-step',
      'map-arrive',
      'boss-hurt',
      'boss-land',
      'boss-ball-impact',
      'animal-token-1',
      'animal-token-2',
      'animal-token-3',
    ]
    for (const name of names) {
      expect(resolveAudioEffectId(name)).toBeTypeOf('number')
    }
    expect(resolveAudioEffectId('missing')).toBeUndefined()
  })
})
