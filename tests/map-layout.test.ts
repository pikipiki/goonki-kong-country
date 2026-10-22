import { describe, expect, it } from 'vitest'
import { romMapLayout } from '../src/mapLayout'
import { pick } from '../src/utils/pick'

const nodes = [
  [54, 76],
  [114, 82],
  [108, 126],
  [60, 148],
  [148, 146],
  [136, 188],
  [216, 182],
]
describe('fullscreen ROM map framing', () => {
  for (const [width, height] of [
    [390, 844],
    [320, 640],
    [844, 390],
    [1000, 900],
  ]) {
    it(`keeps all seven named destinations visible and apart at ${String(width)}x${String(height)}`, () => {
      const map = romMapLayout(width, height)
      let buttonWidth
      if (width > height && height <= 560) {
        buttonWidth = 150
      } else {
        buttonWidth = 138
      }
      expect(map.labels).toHaveLength(7)
      for (let index = 0; index < 7; index++) {
        const label = map.labels[index]
        expect(label.x - buttonWidth / 2).toBeGreaterThanOrEqual(0)
        expect(label.x + buttonWidth / 2).toBeLessThanOrEqual(width)
        expect(label.y - 24).toBeGreaterThan(50)
        expect(label.y + 22).toBeLessThan(
          height - pick(height > width, 130, 82),
        )
        // Cover mode deliberately pans: only the focused node must stay
        // visible while every named destination remains selectable.
        const focused = romMapLayout(width, height, true, nodes[index])
        const [posX, posY] = nodes[index]
        expect(focused.offsetX).toBeLessThanOrEqual(0)
        expect(focused.offsetY).toBeLessThanOrEqual(0)
        expect(focused.offsetX + 256 * focused.scale).toBeGreaterThanOrEqual(
          width - 0.001,
        )
        expect(focused.offsetY + 224 * focused.scale).toBeGreaterThanOrEqual(
          height - 0.001,
        )
        expect(focused.offsetX + posX * focused.scale).toBeGreaterThan(0)
        expect(focused.offsetX + posX * focused.scale).toBeLessThan(width)
        expect(focused.offsetY + posY * focused.scale).toBeGreaterThan(60)
        expect(focused.offsetY + posY * focused.scale).toBeLessThan(height - 80)
        for (const other of map.labels.slice(index + 1)) {
          expect(
            Math.abs(label.x - other.x) >= buttonWidth ||
              Math.abs(label.y - other.y) >= 46,
          ).toBe(true)
        }
      }
    })
  }
})
