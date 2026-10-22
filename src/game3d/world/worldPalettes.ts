import type { Biome } from '../../game/levels'

export const PALETTES: Record<
  Biome,
  {
    sky: string
    mist: string
    leaf: string
    light: string
    ground: string
    grass: string
  }
> = {
  jungle: {
    sky: '#07140e',
    mist: '#183828',
    leaf: '#528b2b',
    light: '#ffe2a1',
    ground: '#6b442b',
    grass: '#5b7d24',
  },
  canopy: {
    sky: '#42312a',
    mist: '#5a5440',
    leaf: '#426a25',
    light: '#ffd596',
    ground: '#64402a',
    grass: '#698531',
  },
  mine: {
    sky: '#0d161b',
    mist: '#223038',
    leaf: '#3d5440',
    light: '#ffbb69',
    ground: '#49423a',
    grass: '#615c44',
  },
  lagoon: {
    sky: '#08243c',
    mist: '#17566a',
    leaf: '#398872',
    light: '#9edcdb',
    ground: '#8e8660',
    grass: '#668b57',
  },
  snow: {
    sky: '#819daa',
    mist: '#91a9ae',
    leaf: '#315a49',
    light: '#e8eee2',
    ground: '#5b6770',
    grass: '#dfebe5',
  },
  temple: {
    sky: '#1a2623',
    mist: '#314a3b',
    leaf: '#345627',
    light: '#e6cf8d',
    ground: '#696447',
    grass: '#6c772d',
  },
  ship: {
    sky: '#7885a8',
    mist: '#a6b0c8',
    leaf: '#385641',
    light: '#f4c98b',
    ground: '#674a2a',
    grass: '#a27d3f',
  },
}

export function worldRandom(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}
