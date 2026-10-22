import type { PlushAtlasManifest, PlushPoseState } from './plushSprite'
import { pick } from '../utils/pick'

function frameInGroup(
  manifest: PlushAtlasManifest,
  groupName: string,
  chooseFrame: (group: number[]) => number,
): { groupName: string; frameIdxInGroup: number } {
  const group = manifest.groups[groupName] ?? []

  let frameIdxInGroup
  if (group.length > 0) {
    frameIdxInGroup = chooseFrame(group)
  } else {
    frameIdxInGroup = 0
  }

  return { groupName, frameIdxInGroup }
}

function charPrefix(state: PlushPoseState) {
  if (state.pink) {
    return 'pink'
  } else {
    return 'violet'
  }
}

function rollFrameIndex(state: PlushPoseState, group: number[]) {
  let angle
  if (state.cannonFlight) {
    angle = state.time * 14
  } else {
    angle = Math.abs(state.rollAngle)
  }

  return (
    ((Math.floor((angle / (Math.PI * 2)) * group.length) % group.length) +
      group.length) %
    group.length
  )
}

export function plushAnimationGroup(
  manifest: PlushAtlasManifest,
  state: PlushPoseState,
): { groupName: string; frameIdxInGroup: number } {
  const charKey = charPrefix(state)

  if (state.celebrating) {
    return frameInGroup(
      manifest,
      `${charKey}_celebrate`,
      (group) => Math.floor(state.time * 8) % group.length,
    )
  }

  if (state.roll || state.cannonFlight) {
    return frameInGroup(manifest, `${charKey}_roll`, (group) =>
      rollFrameIndex(state, group),
    )
  }

  if (state.riding) {
    return frameInGroup(
      manifest,
      `${charKey}_ride`,
      (group) => Math.floor(state.time * 6) % group.length,
    )
  }

  if (state.carrying) {
    return frameInGroup(manifest, `${charKey}_carry`, (group) =>
      pick(
        state.walking > 0.15,
        Math.floor(state.time * (8 + state.walking * 1.4)) % group.length,
        0,
      ),
    )
  }

  if (!state.grounded || state.swapping) {
    const jumping = state.swapping || state.swapHop > 0.2

    let groupName
    if (jumping) {
      groupName = `${charKey}_jump`
    } else {
      groupName = `${charKey}_fall`
    }

    return { groupName, frameIdxInGroup: 0 }
  }

  if (state.walking > 0.15) {
    return frameInGroup(
      manifest,
      `${charKey}_walk`,
      (group) =>
        Math.floor(state.time * (9 + Math.min(10, state.walking * 1.5))) %
        group.length,
    )
  }

  return frameInGroup(
    manifest,
    `${charKey}_idle`,
    (group) => Math.floor(state.time * 4) % group.length,
  )
}
