import { it, expect } from 'vitest'
import { LEVELS } from '../src/game/levels'
import { collectRouteGapFailures } from './helpers/routeGapFailures'

it('allows every consecutive platform gap to be crossed using the real simulation', () => {
  const failures = LEVELS.flatMap((level) => collectRouteGapFailures(level))
  expect(failures).toEqual([])
})
