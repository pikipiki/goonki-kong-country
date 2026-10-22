import { LEVELS } from '../game/levels'
import { ROM_CORAL } from '../game/originalCoral'
import { ROM_JUNGLE } from '../game/originalJungle'
import { ROM_MINE_CART } from '../game/originalMineCart'
import { ROM_REVERB } from '../game/originalReverb'

export const MAP_LEVELS = [
  ROM_JUNGLE,
  ROM_REVERB,
  ROM_MINE_CART,
  ROM_CORAL,
  ...LEVELS.slice(4),
]
