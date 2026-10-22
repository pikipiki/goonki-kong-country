/** Fullscreen 2D map framing. Keep the original island and seven ROM nodes
 * intact, with readable callouts outside its crowded paths on narrow screens. */
function verticalMargins(fullscreen: boolean, portrait: boolean) {
  if (!fullscreen) {
    return { top: 8, bottom: 8 }
  }
  if (portrait) {
    return { top: 88, bottom: 190 }
  }
  return { top: 66, bottom: 90 }
}

export function romMapLayout(
  width: number,
  height: number,
  fullscreen = true,
  focus: readonly number[] = [128, 132],
) {
  const portrait = height > width
  const { top, bottom } = verticalMargins(fullscreen, portrait)
  const area = Math.max(160, height - top - bottom)
  const contentHeight = Math.min(area, portrait ? width * 1.5 : area)
  const contentTop = top + (area - contentHeight) / 2
  const scale = Math.min(
    (width - (portrait || !fullscreen ? 16 : 300)) / 256,
    contentHeight / 194,
  )
  const safeScale = Math.max(0.5, scale)
  const offsetX = width / 2 - 128 * safeScale
  const offsetY = contentTop + contentHeight / 2 - 132 * safeScale
  let left
  if (portrait) {
    left = 77
  } else {
    left = 91
  }
  const right = width - left
  let rows
  if (portrait) {
    rows = [
      [left, 0.04],
      [right, 0.19],
      [left, 0.36],
      [left, 0.55],
      [right, 0.53],
      [left, 0.79],
      [right, 0.91],
    ]
  } else {
    rows = [
      [left, 0.04],
      [right, 0.04],
      [left, 0.35],
      [left, 0.66],
      [right, 0.39],
      [left, 0.97],
      [right, 0.84],
    ]
  }
  const labels = rows.map(([labelX, ratio]) => ({
    x: labelX,
    y: contentTop + 22 + ratio * (contentHeight - 44),
  }))
  if (fullscreen) {
    // Cover the complete display with the actual ROM map. The viewport pans
    // with the travelers instead of shrinking the island into an ocean frame.
    const cover = Math.max(width / 256, height / 224)
    const centreY = (top + height - bottom) / 2
    return {
      scale: cover,
      offsetX: Math.max(
        width - 256 * cover,
        Math.min(0, width / 2 - focus[0] * cover),
      ),
      offsetY: Math.max(
        height - 224 * cover,
        Math.min(0, centreY - focus[1] * cover),
      ),
      labels,
    }
  }
  return { scale: safeScale, offsetX, offsetY, labels }
}
