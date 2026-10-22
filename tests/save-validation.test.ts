import { describe, expect, it } from 'vitest'
import { readSave } from '../src/game/engine'

const score = { bananas: 42, letters: 4, time: 12.5 }
describe('save input boundary', () => {
  it('retains valid records and copies only known fields', () => {
    const save = readSave(
      JSON.stringify({
        unlocked: 2,
        best: { '0': { ...score, extra: { injected: true } } },
      }),
    )
    expect(save).toEqual({ unlocked: 2, best: { '0': score } })
  })
  it('discards prototype keys and unknown stages', () => {
    const save = readSave(
      '{"unlocked":1,"best":{"__proto__":{"bananas":1,"letters":1,"time":1,"polluted":true},"constructor":{"bananas":1,"letters":1,"time":1},"999":{"bananas":1,"letters":1,"time":1}}}',
    )
    expect(save.best).toEqual({})
    expect(Object.getPrototypeOf(save.best)).toBe(Object.prototype)
    expect(Object.hasOwn(save.best, '__proto__')).toBe(false)
  })
  it.each([
    { ...score, bananas: -1 },
    { ...score, bananas: 1.5 },
    { ...score, bananas: 1e20 },
    { ...score, letters: 6 },
    { ...score, letters: -1 },
    { ...score, time: -1 },
    { ...score, time: '12' },
    { ...score, time: 1e20 },
  ])('rejects an invalid record: %j', (record) => {
    expect(
      readSave(JSON.stringify({ unlocked: 0, best: { '0': record } })).best,
    ).toEqual({})
  })
  it.each(['[]', 'null', '{', '{"unlocked":0,"best":[]}', ' '.repeat(20_000)])(
    'recovers from malformed or oversized storage',
    (text) => {
      expect(readSave(text)).toEqual({ unlocked: 0, best: {} })
    },
  )
})
