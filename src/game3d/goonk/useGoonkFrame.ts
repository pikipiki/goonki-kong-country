import { useFrame } from '@react-three/fiber'
import type { RefObject } from 'react'
import type { Group } from 'three'
import type { Game } from '../../game/engine'
import { applyGoonkBodyRotation } from './goonkBodyRotation'
import { buildGoonkFrameContext } from './goonkFrameContext'
import { animateGoonkLimbs } from './goonkLimbMotion'
import { applyGoonkRootTransform } from './goonkRootMotion'
import { goonkSwapBlend } from './goonkSwapMotion'

type LimbRefs = { current: (Group | null)[] }

export function useGoonkFrame(
  root: RefObject<Group | null>,
  body: RefObject<Group | null>,
  limbs: LimbRefs,
  opts: {
    pink: boolean
    game?: Game
    companion: boolean
    preview: boolean
    mapWalk: number
    mapCelebrate: boolean
  },
) {
  const { pink, game, companion, preview, mapWalk, mapCelebrate } = opts

  useFrame(({ clock }) => {
    const rootNode = root.current

    const bodyNode = body.current

    if (!rootNode || !bodyNode) {
      return
    }

    let blend
    if (game) {
      blend = goonkSwapBlend(game)
    } else {
      blend = { swapU: 0, swapHop: 0, swapping: false }
    }

    const frame = buildGoonkFrameContext(
      game,
      companion,
      preview,
      mapWalk,
      clock.elapsedTime,
    )

    applyGoonkRootTransform(
      rootNode,
      game,
      companion,
      pink,
      frame,
      blend.swapU,
      blend.swapHop,
    )
    const player = frame.player

    const roll = !companion && (player?.roll ?? 0) > 0

    const cannonFlight = !companion && (player?.launched ?? 0) > 0

    applyGoonkBodyRotation(
      bodyNode,
      player,
      companion,
      pink,
      frame.animTime,
      frame.walking,
      frame.grounded,
      frame.swimming,
      roll,
      cannonFlight,
      blend.swapping,
      blend.swapHop,
      frame.pose?.facing ?? 1,
    )
    animateGoonkLimbs(
      limbs.current,
      frame.animTime,
      frame.walking,
      frame.grounded,
      pink,
      mapCelebrate,
      blend.swapping,
      blend.swapHop,
      frame.riding,
      roll,
      player,
      companion,
    )
  })
}
