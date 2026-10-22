import { bossArenaBounds } from '../game/bossArena'
import { ENEMY_DESIGNS } from '../game/enemies'
import { drawBossShipRoom } from './bossShipRoomDraw'
import { bossSpriteGroup } from './bossScene2dPhase'
import { drawBossBarrel } from './bossScene2dPaintBarrels'
import { paintBossPlush } from './bossScene2dPaintPlush'
import { paintBossProjectiles } from './bossScene2dPaintShots'
import type { BossPaintContext } from './bossScene2dPaintTypes'
import { createBossAtlasDrawer } from './bossScene2dSprite'

export type { BossPaintContext } from './bossScene2dPaintTypes'

function paintBossSky(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, 160)

  sky.addColorStop(0, '#515e87')
  sky.addColorStop(0.55, '#a1adc3')
  sky.addColorStop(1, '#b7bfcb')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, width, height)
}

function paintBossDeckFallback(paint: BossPaintContext) {
  const { ctx, game, width, floor, scale, toCanvasX } = paint

  ctx.fillStyle = '#99afc1'
  ctx.fillRect(0, floor - 60, width, 60)
  ctx.fillStyle = '#4d301e'
  ctx.fillRect(0, floor, width, paint.height - floor)

  for (let plankX = -2; plankX < game.level.length + 2; plankX += 0.6) {
    const screenX = toCanvasX(plankX)

    const plankWidth = 0.6 * scale

    ctx.fillStyle = '#c18b47'
    ctx.fillRect(screenX, floor, plankWidth - 1, paint.height - floor)
    ctx.fillStyle = '#e3bb73'
    ctx.fillRect(screenX, floor, 1, paint.height - floor)
  }
}

function paintBossArenaRails(paint: BossPaintContext) {
  const { ctx, game, floor, scale, toCanvasX, toCanvasY } = paint

  const bounds = bossArenaBounds(game.level.length)

  const drawAtlas = createBossAtlasDrawer(paint.assets)

  drawAtlas(
    'island',
    0,
    paint.roomCentre,
    floor - 94 * paint.roomScale,
    ctx,
    false,
    40 * paint.roomScale,
  )

  for (const edge of [bounds.left, bounds.right]) {
    const screenX = toCanvasX(edge)

    const pole = Math.max(3, scale * 0.18)

    ctx.fillStyle = '#49321f'
    ctx.fillRect(screenX - pole / 2, 0, pole, floor + scale * 0.3)
    ctx.fillStyle = '#bd8c48'
    ctx.fillRect(
      screenX - pole / 2,
      0,
      Math.max(1, pole * 0.3),
      floor + scale * 0.3,
    )
    ctx.strokeStyle = '#aa844a'
    ctx.lineWidth = Math.max(1, scale * 0.07)

    for (const ropeY of [1, 2.15]) {
      ctx.beginPath()
      ctx.moveTo(screenX, toCanvasY(ropeY))
      ctx.lineTo(
        screenX + (edge === bounds.left ? -1 : 1) * scale,
        toCanvasY(ropeY) + scale * 0.12,
      )
      ctx.stroke()
    }
  }

  ctx.strokeStyle = '#e2ad5c'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(toCanvasX(bounds.left), floor)
  ctx.lineTo(toCanvasX(bounds.right), floor)
  ctx.stroke()
}

function paintBossBarrelsOnDeck(paint: BossPaintContext) {
  const { ctx, game, assets, toCanvasX, toCanvasY } = paint

  game.level.barrels.forEach((barrel, barrelIdx) => {
    if (barrel.kind === 'cannon' || game.usedBarrels.has(barrelIdx)) {
      return
    }

    drawBossBarrel(
      ctx,
      assets,
      barrel.kind,
      toCanvasX(barrel.x),
      toCanvasY(barrel.y),
      'feet',
      game.time,
      paint.scale,
    )
  })
}

function paintBossKing(paint: BossPaintContext) {
  const { ctx, game, assets, bossBattle, toCanvasX, toCanvasY, scale } = paint

  const boss = game.enemies.find((enemy) => enemy.kind === 'boss')

  if (!boss) {
    return
  }

  const phase = bossBattle?.phase ?? 'intro'

  const group = bossSpriteGroup(bossBattle, phase)

  const screenX = toCanvasX(boss.x)

  const screenY = toCanvasY(boss.y)

  const bossHeight = ENEMY_DESIGNS.boss.height * scale

  const waitGroup = assets?.manifest.groups.wait

  let headFrame
  if (assets && waitGroup && waitGroup.length > 0) {
    headFrame = assets.manifest.frames[waitGroup[0]]
  } else {
    headFrame = undefined
  }

  const headPixels = Math.abs(headFrame?.oy ?? -65) + 5

  const bossScale = bossHeight / headPixels

  const drawAtlas = createBossAtlasDrawer(assets)

  const drew = drawAtlas(
    group,
    bossBattle?.phaseTime ?? game.time,
    screenX,
    screenY - 5 * bossScale,
    ctx,
    (bossBattle?.facing ?? -1) < 0,
    undefined,
    !(['throw', 'hurt', 'fall', 'getUp'] as readonly string[]).includes(group),
    bossScale,
  )

  if (!drew) {
    ctx.fillStyle = '#759044'
    ctx.fillRect(screenX - 12, screenY - 30, 24, 30)
    ctx.fillStyle = '#d4b954'
    ctx.fillRect(screenX - 11, screenY - 29, 22, 4)
  }
}

export function paintBossScene2dFrame(paint: BossPaintContext) {
  const { ctx, game, assets, width, height, floor, roomCentre, roomScale } =
    paint

  paintBossSky(ctx, width, height)

  if (assets?.background) {
    drawBossShipRoom(
      ctx,
      assets.background,
      width,
      height,
      floor,
      roomCentre - 128 * roomScale,
      roomScale,
    )
  } else {
    paintBossDeckFallback(paint)
  }

  paintBossArenaRails(paint)
  paintBossBarrelsOnDeck(paint)
  paintBossKing(paint)
  paintBossProjectiles(paint)

  for (const thrown of game.thrown) {
    if (!thrown.active) {
      continue
    }

    drawBossBarrel(
      ctx,
      assets,
      'rolling',
      paint.toCanvasX(thrown.x),
      paint.toCanvasY(thrown.y),
      'centre',
      game.time,
      paint.scale,
    )
  }

  const boss = game.enemies.find((enemy) => enemy.kind === 'boss')

  if (
    boss?.alive &&
    (paint.toCanvasX(boss.x) < 0 || paint.toCanvasX(boss.x) > width)
  ) {
    const offRight = paint.toCanvasX(boss.x) > width

    ctx.fillStyle = '#ffd66a'
    ctx.font = 'bold 14px monospace'
    if (offRight) {
      ctx.textAlign = 'right'
    } else {
      ctx.textAlign = 'left'
    }
    ctx.fillText(
      offRight ? '♛ ▶' : '◀ ♛',
      offRight ? width - 7 : 7,
      floor - 3 * paint.scale,
    )
  }

  paintBossPlush(paint)
}
