import { romMapNodes } from './mapData'

export type RomTravelState = {
  at: number
  destination: number
  progress: number
  lastHop: number
  celebrateTimer: number
  posX: number
  posY: number
  facing: number
  walking: number
  hopY: number
  celebrating: boolean
}

export function createRomTravelState(initial: number): RomTravelState {
  const anchor = romMapNodes[initial] ?? romMapNodes[0]
  return {
    at: initial,
    destination: initial,
    progress: 0,
    lastHop: -1,
    celebrateTimer: 0,
    posX: anchor[0],
    posY: anchor[1],
    facing: 1,
    walking: 0,
    hopY: 0,
    celebrating: false,
  }
}

export function advanceRomTravel(
  state: RomTravelState,
  selected: number,
  frameDelta: number,
  elapsed: number,
  onStep?: () => void,
  onArrive?: () => void,
) {
  if (state.destination === state.at && state.at !== selected) {
    state.destination = state.at + Math.sign(selected - state.at)
    state.progress = 0
    state.lastHop = -1
    state.celebrateTimer = 0
  }

  state.walking = 0
  state.hopY = 0
  state.celebrating = false

  if (state.destination !== state.at) {
    state.progress = Math.min(1, state.progress + frameDelta * 1.65)
    const hopIndex = Math.min(2, Math.floor(state.progress * 3))
    if (hopIndex !== state.lastHop) {
      state.lastHop = hopIndex
      onStep?.()
    }
    const start = romMapNodes[state.at] ?? romMapNodes[0]
    const end = romMapNodes[state.destination] ?? romMapNodes[0]
    const ease = state.progress * state.progress * (3 - 2 * state.progress)
    state.posX = start[0] + (end[0] - start[0]) * ease
    state.posY = start[1] + (end[1] - start[1]) * ease
    if (end[0] >= start[0]) {
      state.facing = 1
    } else {
      state.facing = -1
    }
    state.walking = 6
    state.hopY = Math.abs(Math.sin(state.progress * Math.PI * 3)) * 8
    if (state.progress >= 1) {
      state.at = state.destination
      state.progress = 0
      if (state.at === selected) {
        state.celebrateTimer = 1.25
        onArrive?.()
      }
    }
    return
  }

  if (state.celebrateTimer > 0) {
    state.celebrateTimer = Math.max(0, state.celebrateTimer - frameDelta)
    state.celebrating = true
    state.hopY = Math.abs(Math.sin(elapsed * 10)) * 6
  }
}
