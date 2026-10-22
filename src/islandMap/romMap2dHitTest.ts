import { romMapLayout } from '../mapLayout'
import { romMapNodes } from './mapData'

export function pickRomMapNode(
  clickX: number,
  clickY: number,
  layout: ReturnType<typeof romMapLayout>,
  unlocked: number,
): number | null {
  for (let index = 0; index < romMapNodes.length; index++) {
    if (index > unlocked) {
      continue
    }
    const nodeX = layout.offsetX + romMapNodes[index][0] * layout.scale
    const nodeY = layout.offsetY + romMapNodes[index][1] * layout.scale
    if (
      Math.hypot(clickX - nodeX, clickY - nodeY) <
      Math.max(22, 12 * layout.scale)
    ) {
      return index
    }
  }
  return null
}
