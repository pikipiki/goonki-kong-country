/** Fullscreen 2D map framing. Keep the original island and seven ROM nodes
 * intact, with readable callouts outside its crowded paths on narrow screens. */
export function romMapLayout(width: number, height: number, fullscreen = true, focus: readonly number[] = [128, 132]) {
  const portrait = height > width;
  const top = fullscreen ? (portrait ? 88 : 66) : 8;
  const bottom = fullscreen ? (portrait ? 190 : 90) : 8;
  const area = Math.max(160, height - top - bottom);
  const contentHeight = Math.min(area, portrait ? width * 1.5 : area);
  const contentTop = top + (area - contentHeight) / 2;
  const scale = Math.min((width - (portrait || !fullscreen ? 16 : 300)) / 256, contentHeight / 194);
  const safeScale = Math.max(0.5, scale);
  const offsetX = width / 2 - 128 * safeScale;
  const offsetY = contentTop + contentHeight / 2 - 132 * safeScale;
  const left = portrait ? 77 : 91;
  const right = width - left;
  const rows = portrait
    ? [[left, .04], [right, .19], [left, .36], [left, .55], [right, .53], [left, .79], [right, .91]]
    : [[left, .04], [right, .04], [left, .35], [left, .66], [right, .39], [left, .97], [right, .84]];
  const labels = rows.map(([x, ratio]) => ({ x, y: contentTop + 22 + ratio * (contentHeight - 44) }));
  if (fullscreen) {
    // Cover the complete display with the actual ROM map. The viewport pans
    // with the travelers instead of shrinking the island into an ocean frame.
    const cover = Math.max(width / 256, height / 224);
    const centreY = (top + height - bottom) / 2;
    return {scale: cover,
      offsetX: Math.max(width - 256 * cover, Math.min(0, width / 2 - focus[0] * cover)),
      offsetY: Math.max(height - 224 * cover, Math.min(0, centreY - focus[1] * cover)), labels};
  }
  return { scale: safeScale, offsetX, offsetY, labels };
}
