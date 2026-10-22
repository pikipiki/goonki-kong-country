/** Camera changes affect rendering only, never plush sizes or collision bodies. */
export function jungleViewport2D(width: number, height: number) {
  const aspect = width / Math.max(1, height), portrait = aspect < .95;
  const h = portrait ? Math.round(192 / aspect) : 180;
  return {width: portrait ? 192 : Math.round(h * aspect), height: h, portrait};
}
export function bossViewport2D(width: number, height: number) {
  const aspect = width / Math.max(1, height), portrait = aspect < 1.14;
  const h = portrait ? Math.round(240 / aspect) : 192;
  return {width: portrait ? 240 : Math.round(h * aspect), height: h,
    worldWidth: portrait ? 9 : 18, portrait};
}
export function bossCameraLeft(playerX: number, worldWidth: number, arenaWidth: number) {
  return Math.max(-1, Math.min(arenaWidth + 1 - worldWidth, playerX - worldWidth * .42));
}
