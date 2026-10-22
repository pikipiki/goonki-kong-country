/** The captured room occupies the central twelve world units. */
export function drawBossShipRoom(
  ctx: CanvasRenderingContext2D,
  background: HTMLImageElement,
  width: number,
  height: number,
  floor: number,
  left: number,
  scale: number,
) {
  const top = floor - 190 * scale
  const viewMinX = -left / scale
  const viewMaxX = (width - left) / scale
  const viewMinY = -top / scale
  const viewMaxY = (height - top) / scale
  ctx.save()
  ctx.translate(left, top)
  ctx.scale(scale, scale)
  if (viewMinY < 0) {
    const sky = ctx.createLinearGradient(0, viewMinY, 0, 0)
    sky.addColorStop(0, '#808fb2')
    sky.addColorStop(1, '#6a71a4')
    ctx.fillStyle = sky
    ctx.fillRect(viewMinX, viewMinY, viewMaxX - viewMinX, -viewMinY)
  }
  ctx.save()
  ctx.globalAlpha = 0.22
  for (let cloudY = -80; cloudY > viewMinY - 80; cloudY -= 80) {
    for (
      let cloudX = Math.floor(viewMinX / 48) * 48;
      cloudX < viewMaxX;
      cloudX += 48
    ) {
      ctx.drawImage(background, 112, 0, 48, 80, cloudX, cloudY, 48, 80)
    }
  }
  ctx.restore()
  for (let stripX = -80; stripX > viewMinX - 80; stripX -= 80) {
    ctx.drawImage(background, 0, 0, 80, 224, stripX, 0, 80, 224)
  }
  for (let stripX = 256; stripX < viewMaxX; stripX += 80) {
    ctx.drawImage(background, 176, 0, 80, 224, stripX, 0, 80, 224)
  }
  ctx.drawImage(background, 0, 0)
  for (let trimY = -16; trimY > viewMinY - 16; trimY -= 16) {
    ctx.drawImage(background, 0, 0, 101, 16, 0, trimY, 101, 16)
    ctx.drawImage(background, 200, 0, 56, 16, 200, trimY, 56, 16)
  }
  for (let deckY = 224; deckY < viewMaxY; deckY += 24) {
    for (
      let deckX = Math.floor(viewMinX / 256) * 256;
      deckX < viewMaxX;
      deckX += 256
    ) {
      ctx.drawImage(background, 0, 196, 256, 24, deckX, deckY, 256, 24)
    }
  }
  ctx.restore()
}
