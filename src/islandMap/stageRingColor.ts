import {
  ROM_NODE_FILL_DEFAULT,
  ROM_NODE_FILL_LOCKED,
  ROM_NODE_FILL_SELECTED,
  ROM_NODE_RING_DEFAULT,
  ROM_NODE_RING_LOCKED,
  ROM_NODE_RING_SELECTED,
} from './romMapPalette'

export function stageRingColor(
  index: number,
  selected: number,
  unlocked: number,
): string {
  if (index > unlocked) {
    return ROM_NODE_RING_LOCKED
  }
  if (index === selected) {
    return ROM_NODE_RING_SELECTED
  }
  return ROM_NODE_RING_DEFAULT
}

export function romNodeFill(
  index: number,
  selected: number,
  unlocked: number,
): string {
  if (index > unlocked) {
    return ROM_NODE_FILL_LOCKED
  }
  if (index === selected) {
    return ROM_NODE_FILL_SELECTED
  }
  return ROM_NODE_FILL_DEFAULT
}
