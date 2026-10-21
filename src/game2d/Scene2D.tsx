import { useEffect, useRef } from "react";
import { ANIMAL_DESIGNS } from "../game/animals";
import { STEP, TEAM_SWAP_DURATION, type Game, type Input } from "../game/engine";
import { PlushSpriteRenderer } from "./plushSprite";

interface SpriteFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  ox: number;
  oy: number;
}

interface Manifest2D {
  skyDay: [number, number, number][];
  skyNight: [number, number, number][];
  frames: SpriteFrame[];
  groups: Record<string, number[]>;
}

interface TransientFx {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  group: string;
  fps: number;
  age: number;
  duration: number;
  flipX: boolean;
}

interface Assets2D {
  manifest: Manifest2D;
  sprites: HTMLImageElement;
  l1Back: HTMLImageElement;
  l1Front: HTMLImageElement;
  l1BackNight: HTMLImageElement;
  l1FrontNight: HTMLImageElement;
  l2: HTMLImageElement;
  l2Night: HTMLImageElement;
  l3: HTMLImageElement;
  l3Night: HTMLImageElement;
  caveBack: HTMLImageElement;
  caveFront: HTMLImageElement;
}

const SCREEN_H = 224;
const LEVEL_W = 5408;
const LEVEL_H = 512;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

let cachedAssetsPromise: Promise<Assets2D> | null = null;
function loadAssets2D(): Promise<Assets2D> {
  if (!cachedAssetsPromise) {
    cachedAssetsPromise = Promise.all([
      fetch("/rom2d/manifest.json").then((r) => r.json() as Promise<Manifest2D>),
      loadImage("/rom2d/sprites.png"),
      loadImage("/rom2d/layer1-back.png"),
      loadImage("/rom2d/layer1-front.png"),
      loadImage("/rom2d/layer1-back-night.png"),
      loadImage("/rom2d/layer1-front-night.png"),
      loadImage("/rom2d/layer2.png"),
      loadImage("/rom2d/layer2-night.png"),
      loadImage("/rom2d/layer3.png"),
      loadImage("/rom2d/layer3-night.png"),
      loadImage("/rom2d/bonus-cave-back.png"),
      loadImage("/rom2d/bonus-cave-front.png"),
    ]).then(
      ([
        manifest,
        sprites,
        l1Back,
        l1Front,
        l1BackNight,
        l1FrontNight,
        l2,
        l2Night,
        l3,
        l3Night,
        caveBack,
        caveFront,
      ]) => ({
        manifest,
        sprites,
        l1Back,
        l1Front,
        l1BackNight,
        l1FrontNight,
        l2,
        l2Night,
        l3,
        l3Night,
        caveBack,
        caveFront,
      }),
    );
  }
  return cachedAssetsPromise;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function Scene2D({
  game,
  input,
  onTick,
}: {
  game: Game;
  input: Input;
  onTick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let active = true;
    let raf = 0;
    let assets: Assets2D | null = null;
    const plushRenderer = new PlushSpriteRenderer();

    void loadAssets2D().then((loaded) => {
      if (active) assets = loaded;
    });

    let lastTime = performance.now();
    let accumulator = 0;
    let nextUI = 0;
    let screenW = 256;
    let screenH = SCREEN_H;
    let camX = Math.max(0, game.player.x * 32 - 96);
    let camY = clamp(337 - game.player.y * 32 - 168, 0, LEVEL_H - SCREEN_H);
    let lastRevision = game.sceneRevision;

    // State trackers for spawning authentic ROM death / break / puff animations
    const fxList: TransientFx[] = [];
    const prevEnemyAlive = new Map<number, boolean>();
    const prevUsedBarrels = new Set<number>();
    const prevBrokenWalls = new Set<number>();
    const prevRevealedCaches = new Set<number>();
    let prevCrateState = "crate";
    let prevGrounded = true;

    const toPixel = (wx: number, wy: number) => {
      if (game.bonus) {
        return {
          px: (wx / 16) * 212 + 22,
          py: 192 - wy * 26,
        };
      }
      return {
        px: wx * 32,
        py: 337 - wy * 32,
      };
    };

    const drawSprite = (
      ctx: CanvasRenderingContext2D,
      frameIdx: number | undefined,
      px: number,
      py: number,
      flipX = false,
    ) => {
      if (!assets || frameIdx === undefined) return;
      const f = assets.manifest.frames[frameIdx];
      if (!f) return;
      const sx = Math.round(px - camX);
      const sy = Math.round(py - camY);
      if (sx + f.w < -64 || sx - f.w > screenW + 64) return;
      if (sy + f.h < -64 || sy - f.h > screenH + 64) return;

      if (!flipX) {
        ctx.drawImage(
          assets.sprites,
          f.x,
          f.y,
          f.w,
          f.h,
          sx + f.ox,
          sy + f.oy,
          f.w,
          f.h,
        );
      } else {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.scale(-1, 1);
        ctx.drawImage(
          assets.sprites,
          f.x,
          f.y,
          f.w,
          f.h,
          f.ox,
          f.oy,
          f.w,
          f.h,
        );
        ctx.restore();
      }
    };

    const drawGroupAnim = (
      ctx: CanvasRenderingContext2D,
      groupName: string,
      animTime: number,
      fps: number,
      px: number,
      py: number,
      flipX = false,
      loop = true,
    ) => {
      if (!assets) return;
      const group = assets.manifest.groups[groupName];
      if (!group || group.length === 0) return;
      const rawIdx = Math.floor(Math.max(0, animTime) * fps);
      const idx = loop
        ? rawIdx % group.length
        : Math.min(group.length - 1, rawIdx);
      drawSprite(ctx, group[idx], px, py, flipX);
    };

    const step = (now: number) => {
      if (!active) return;
      raf = requestAnimationFrame(step);

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (game.phase === "playing") {
        accumulator += dt;
        while (accumulator >= STEP) {
          game.update(input);
          accumulator -= STEP;
        }
      }

      if (lastRevision !== game.sceneRevision) {
        lastRevision = game.sceneRevision;
        fxList.length = 0;
        prevEnemyAlive.clear();
        prevUsedBarrels.clear();
        prevBrokenWalls.clear();
        prevRevealedCaches.clear();
        const startPos = toPixel(game.player.x, game.player.y);
        camX = clamp(startPos.px - 96, 0, LEVEL_W - 256);
        camY = clamp(startPos.py - 168, 0, LEVEL_H - SCREEN_H);
      }

      // Detect newly defeated enemies, broken barrels, caches, walls
      game.enemies.forEach((e, i) => {
        const wasAlive = prevEnemyAlive.get(i) ?? true;
        if (wasAlive && !e.alive) {
          const { px, py } = toPixel(e.x, e.y);
          const deathGroup =
            e.kind === "beetle"
              ? "gnawty_hurt"
              : e.kind === "armored"
                ? "klump_hurt"
                : e.pattern === "necky"
                  ? "necky_hurt"
                  : "kritter_hurt";
          fxList.push({
            x: px,
            y: py - 8,
            vx: (e.vx >= 0 ? 1 : -1) * 35,
            vy: -130,
            gravity: 380,
            group: deathGroup,
            fps: 10,
            age: 0,
            duration: 1.1,
            flipX: e.vx < 0,
          });
          fxList.push({
            x: px,
            y: py - 12,
            vx: 0,
            vy: 0,
            gravity: 0,
            group: "smoke_puff",
            fps: 16,
            age: 0,
            duration: 0.5,
            flipX: false,
          });
        }
        prevEnemyAlive.set(i, e.alive);
      });

      game.usedBarrels.forEach((bIdx) => {
        if (!prevUsedBarrels.has(bIdx)) {
          prevUsedBarrels.add(bIdx);
          const b = game.level.barrels[bIdx];
          if (b) {
            const { px, py } = toPixel(b.x, b.y);
            if (b.kind === "checkpoint") {
              fxList.push({
                x: px,
                y: py - 14,
                vx: 0,
                vy: 0,
                gravity: 0,
                group: "checkpoint_stars",
                fps: 15,
                age: 0,
                duration: 1.0,
                flipX: false,
              });
            } else if (b.kind === "rescue") {
              fxList.push({
                x: px,
                y: py - 12,
                vx: 0,
                vy: 0,
                gravity: 0,
                group: "barrel_break",
                fps: 14,
                age: 0,
                duration: 0.55,
                flipX: false,
              });
              fxList.push({
                x: px,
                y: py - 14,
                vx: 0,
                vy: 0,
                gravity: 0,
                group: "burst_effect",
                fps: 18,
                age: 0,
                duration: 0.65,
                flipX: false,
              });
            }
          }
        }
      });

      game.brokenWalls.forEach((wIdx) => {
        if (!prevBrokenWalls.has(wIdx)) {
          prevBrokenWalls.add(wIdx);
          const w = game.level.breakableWalls?.[wIdx];
          if (w) {
            const { px, py } = toPixel(w.x, w.y + w.h * 0.4);
            fxList.push({
              x: px,
              y: py,
              vx: 0,
              vy: 0,
              gravity: 0,
              group: "smoke_puff",
              fps: 15,
              age: 0,
              duration: 0.55,
              flipX: false,
            });
          }
        }
      });

      game.revealedCaches.forEach((cIdx) => {
        if (!prevRevealedCaches.has(cIdx)) {
          prevRevealedCaches.add(cIdx);
          const c = game.level.itemCaches?.[cIdx];
          if (c) {
            const { px, py } = toPixel(c.x, c.y);
            fxList.push({
              x: px,
              y: py - 6,
              vx: 0,
              vy: 0,
              gravity: 0,
              group: "smoke_puff",
              fps: 16,
              age: 0,
              duration: 0.5,
              flipX: false,
            });
          }
        }
      });

      const rambi = game.animals[0];
      if (rambi && prevCrateState === "crate" && rambi.state !== "crate") {
        const { px, py } = toPixel(rambi.x, rambi.y);
        fxList.push({
          x: px,
          y: py - 12,
          vx: 0,
          vy: 0,
          gravity: 0,
          group: "rambi_box",
          fps: 8,
          age: 0.13,
          duration: 0.4,
          flipX: false,
        });
      }
      if (rambi) prevCrateState = rambi.state;

      if (!prevGrounded && game.player.grounded && Math.abs(game.player.vx) > 2) {
        const { px, py } = toPixel(game.player.x, game.player.y);
        fxList.push({
          x: px,
          y: py - 2,
          vx: 0,
          vy: 0,
          gravity: 0,
          group: "smoke_puff",
          fps: 18,
          age: 0,
          duration: 0.4,
          flipX: false,
        });
      }
      prevGrounded = game.player.grounded;

      for (let i = fxList.length - 1; i >= 0; i--) {
        const fx = fxList[i];
        fx.age += dt;
        fx.x += fx.vx * dt;
        fx.y += fx.vy * dt;
        fx.vy += fx.gravity * dt;
        if (fx.age >= fx.duration) fxList.splice(i, 1);
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const rawW = rect.width > 0 ? rect.width : window.innerWidth;
      const rawH = rect.height > 0 ? rect.height : window.innerHeight;
      const aspect = rawW / Math.max(1, rawH);
      const isPortrait = aspect < 0.95;
      const isShortLandscape = !isPortrait && rawH <= 560;

      if (isPortrait) {
        screenW = 240;
        screenH = clamp(Math.round(screenW / aspect), 224, 384);
      } else {
        screenH = SCREEN_H;
        screenW = clamp(Math.round(screenH * aspect), 256, 480);
      }
      if (canvas.width !== screenW || canvas.height !== screenH) {
        canvas.width = screenW;
        canvas.height = screenH;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;

      const pPos = toPixel(game.player.x, game.player.y);
      if (game.bonus) {
        camX = -Math.round((screenW - 256) * 0.5);
        camY = 32 - Math.round((screenH - SCREEN_H) * 0.5);
      } else {
        const lookAhead = game.player.facing * (isPortrait ? 22 : 28);
        const anchorX = isPortrait ? 0.42 : 0.44;
        const anchorY = isPortrait
          ? Math.round(screenH * 0.72)
          : isShortLandscape
            ? Math.round(screenH * 0.64)
            : 166;
        const targetX = clamp(
          pPos.px + lookAhead - screenW * anchorX,
          0,
          LEVEL_W - screenW,
        );
        const targetY = clamp(pPos.py - anchorY, 0, LEVEL_H - screenH);
        camX += (targetX - camX) * (1 - Math.exp(-dt * 9));
        camY += (targetY - camY) * (1 - Math.exp(-dt * 7));
      }

      game.cameraBounds = {
        x: (camX + screenW * 0.5) / 32,
        y: (337 - (camY + screenH * 0.5)) / 32,
        halfX: screenW / 64 + 6,
        halfY: screenH / 64 + 6,
      };

      // Render scene
      if (!assets) {
        ctx.fillStyle = "#122014";
        ctx.fillRect(0, 0, screenW, screenH);
      } else if (game.bonus) {
        // Cave bonus room centered for both portrait and landscape
        ctx.fillStyle = "#080604";
        ctx.fillRect(0, 0, screenW, screenH);
        ctx.drawImage(assets.caveBack, -camX, -camY);

        // Bonus pickups
        game.level.pickups.forEach((item, i) => {
          if (game.collected.has(i)) return;
          const { px, py } = toPixel(item.x, item.y);
          if (item.kind === "balloon") {
            drawGroupAnim(ctx, "balloon", game.time + i * 0.2, 8, px, py);
          } else if ((item as { amount?: number }).amount === 10) {
            drawGroupAnim(ctx, "banana_bunch", game.time + i * 0.1, 10, px, py);
          } else {
            drawGroupAnim(ctx, "banana_spin", game.time + i * 0.15, 12, px, py);
          }
        });

        // Exit sign inside bonus room
        drawGroupAnim(ctx, "sign_exit", game.time, 1, 212, 186);

        // Companion & Player plushies in 2D
        drawPlushCast(ctx, game, plushRenderer, toPixel, camX, camY);

        ctx.drawImage(assets.caveFront, -camX, -camY);
      } else {
        // Stage 1: Jungle Hijinxs Day -> Dusk -> Night -> Dawn transition (CODE_BDFD50)
        const wx = game.player.x;
        const nightBlend =
          wx < 45
            ? 0
            : wx < 68
              ? (wx - 45) / 23
              : wx < 145
                ? 1
                : wx < 156
                  ? 1 - (wx - 145) / 11
                  : 0;
        const dawnBlend = wx < 146 ? 0 : clamp((wx - 146) / 12, 0, 1);

        // 1. Sky HDMA Scanline Table (stretched across screenH)
        const skyDay = assets.manifest.skyDay;
        const skyNight = assets.manifest.skyNight;
        for (let y = 0; y < screenH; y++) {
          const hdmaY = Math.min(
            SCREEN_H - 1,
            Math.floor((y / Math.max(1, screenH)) * SCREEN_H),
          );
          const d = skyDay[Math.min(hdmaY, skyDay.length - 1)] ?? [72, 16, 0];
          const n = skyNight[Math.min(hdmaY, skyNight.length - 1)] ?? [8, 16, 24];
          let r = d[0] * (1 - nightBlend) + n[0] * nightBlend;
          let g = d[1] * (1 - nightBlend) + n[1] * nightBlend;
          let b = d[2] * (1 - nightBlend) + n[2] * nightBlend;
          if (dawnBlend > 0) {
            const u = y / screenH;
            const dr = 255 * (1 - u * 0.35);
            const dg = 120 + u * 95;
            const db = 65 + u * 80;
            r = r * (1 - dawnBlend * 0.65) + dr * (dawnBlend * 0.65);
            g = g * (1 - dawnBlend * 0.65) + dg * (dawnBlend * 0.65);
            b = b * (1 - dawnBlend * 0.65) + db * (dawnBlend * 0.65);
          }
          ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
          ctx.fillRect(0, y, screenW, 1);
        }

        // 2. Layer 3 Distant Canopy Silhouette (0.25x horizontal parallax)
        const l3ScrollX = Math.floor(camX * 0.25) % 256;
        const l3Y = Math.round(64 - (camY - 168) * 0.12);
        for (let x = -l3ScrollX; x < screenW; x += 256) {
          ctx.drawImage(assets.l3, x, l3Y);
          if (nightBlend > 0.01) {
            ctx.save();
            ctx.globalAlpha = nightBlend;
            ctx.drawImage(assets.l3Night, x, l3Y);
            ctx.restore();
          }
        }

        // 3. Layer 2 Parallax Palm Trees (0.5x X parallax, 0.25x Y parallax)
        const l2ScrollX = Math.floor(camX * 0.5) % 512;
        const l2ScrollY = Math.round(-(camY * 0.15));
        for (let x = -l2ScrollX; x < screenW; x += 512) {
          ctx.drawImage(assets.l2, x, l2ScrollY);
          if (nightBlend > 0.01) {
            ctx.save();
            ctx.globalAlpha = nightBlend;
            ctx.drawImage(assets.l2Night, x, l2ScrollY);
            ctx.restore();
          }
        }

        // 4. Layer 1 Back (priority 0: main ground, treehouse, trunks, back foliage)
        const srcX = Math.round(camX);
        const srcY = Math.round(camY);
        ctx.drawImage(
          assets.l1Back,
          srcX,
          srcY,
          screenW,
          screenH,
          0,
          0,
          screenW,
          screenH,
        );
        if (nightBlend > 0.01) {
          ctx.save();
          ctx.globalAlpha = nightBlend;
          ctx.drawImage(
            assets.l1BackNight,
            srcX,
            srcY,
            screenW,
            screenH,
            0,
            0,
            screenW,
            screenH,
          );
          ctx.restore();
        }

        // 5. Stage 1 Decors, Ground Covers, Breakable Walls, Moving Platforms
        game.level.breakableWalls?.forEach((wall, i) => {
          const { px, py } = toPixel(wall.x, wall.y);
          if (game.brokenWalls.has(i)) {
            if (i > 0) drawGroupAnim(ctx, "cave_hole", 0, 1, px + 6, py - 18);
          } else if (i > 0) {
            drawGroupAnim(ctx, "breakable_wall", 0, 1, px + 6, py - 18);
          }
        });

        game.level.itemCaches?.forEach((cache, i) => {
          if (game.collectedCaches.has(i)) return;
          const { px, py } = toPixel(cache.x, cache.y);
          if (!game.revealedCaches.has(i)) {
            if (cache.y <= 3.0) {
              drawGroupAnim(ctx, "ground_cover", 0, 1, px, py - 2);
            }
          } else {
            const bob = Math.sin(game.time * 6 + i) * 3;
            const amount = "amount" in cache.reward ? (cache.reward.amount ?? 1) : 1;
            drawGroupAnim(
              ctx,
              amount > 1 ? "banana_bunch" : "banana_spin",
              game.time,
              10,
              px,
              py - 10 + bob,
            );
          }
        });

        game.level.decors?.forEach((decor, i) => {
          const { px, py } = toPixel(decor.x, decor.y);
          if (decor.kind === "butterfly") {
            const bx = px + Math.sin(game.time * 1.8 + i) * 10;
            const by = py - 8 + Math.cos(game.time * 2.7 + i) * 6;
            drawGroupAnim(ctx, "butterfly", game.time + i * 0.3, 12, bx, by);
          } else if (decor.kind === "token") {
            const by = py - 12 + Math.sin(game.time * 3) * 3;
            drawGroupAnim(ctx, "token_expresso", game.time, 1, px, by);
          } else if (decor.kind === "sign") {
            const isExit = decor.x > 160;
            drawGroupAnim(
              ctx,
              isExit ? "sign_exit" : "sign_arrow",
              game.time,
              1,
              px,
              py - 14,
            );
          } else if (decor.kind === "sparkle") {
            drawGroupAnim(ctx, "sparkle", game.time + i * 0.25, 12, px, py - 8);
          }
        });

        game.level.platforms.forEach((plat) => {
          if (plat.kind !== "moving") return;
          const pyWorld = game.surface(plat);
          const { px, py } = toPixel(plat.x, pyWorld);
          drawGroupAnim(ctx, "platform", game.time, 1, px, py + 4);
        });

        // 6. Pickups (Bananas, Banana Bunches, KONG Letters, Extra Life Balloons)
        game.level.pickups.forEach((item, i) => {
          if (game.collected.has(i)) return;
          const { px, py } = toPixel(item.x, item.y);
          const bob = Math.sin(game.time * 2.5 + i) * 2;
          if (item.kind === "letter") {
            const key = `letter_${(item.letter ?? "k").toLowerCase()}`;
            drawGroupAnim(ctx, key, game.time, 1, px, py + bob);
          } else if (item.kind === "balloon") {
            drawGroupAnim(ctx, "balloon", game.time + i * 0.2, 8, px, py + bob - 4);
          } else if ((item as { amount?: number }).amount === 10) {
            drawGroupAnim(ctx, "banana_bunch", game.time + i * 0.15, 10, px, py + bob);
          } else {
            drawGroupAnim(ctx, "banana_spin", game.time + i * 0.1, 12, px, py + bob);
          }
        });

        // 7. Barrels & Barrel Cannons
        game.level.barrels.forEach((b, i) => {
          if (game.usedBarrels.has(i)) return;
          if (b.kind === "cannon") {
            const cPos = game.cannonPosition(i);
            const { px, py } = toPixel(cPos.x, cPos.y);
            const angle = game.cannonAngle(i);
            const sector =
              ((Math.round(((angle - Math.PI / 2) / (Math.PI * 2)) * 16) % 16) + 16) % 16;
            const group = b.autoFire
              ? assets!.manifest.groups["cannon_auto"]
              : assets!.manifest.groups["cannon_normal"];
            if (group && group.length > 0) {
              drawSprite(ctx, group[sector % group.length], px, py);
            }
          } else {
            const { px, py } = toPixel(b.x, b.y);
            if (b.kind === "rescue") {
              drawGroupAnim(ctx, "dk_barrel", game.time + i, 10, px, py - 12);
              drawGroupAnim(ctx, "dk_letters", game.time + i, 10, px, py - 12);
            } else if (b.kind === "checkpoint") {
              drawGroupAnim(ctx, "checkpoint_barrel", game.time, 10, px, py - 12);
            } else {
              drawGroupAnim(ctx, "barrel_idle", game.time, 1, px, py - 12);
            }
          }
        });

        // Thrown & Carried barrels
        if (game.player.carry >= 0) {
          const { px, py } = toPixel(game.player.x, game.player.y + 1.45);
          drawGroupAnim(ctx, "barrel_idle", game.time, 1, px, py - 8);
        }
        game.thrown.forEach((t) => {
          if (!t.active) return;
          const { px, py } = toPixel(t.x, t.y);
          drawGroupAnim(ctx, "barrel_roll", game.time, 18, px, py - 6, t.vx < 0);
        });

        // 8. Animal Buddy (Rambi Crate & Rambi)
        game.animals.forEach((a) => {
          if (a.y <= -7) return;
          const { px, py } = toPixel(a.x, a.y);
          if (a.state === "crate") {
            const boxFrames = assets!.manifest.groups["rambi_box"];
            if (boxFrames?.length) drawSprite(ctx, boxFrames[0], px, py - 14);
          } else {
            const flipX = a.facing < 0;
            const moving =
              a.state === "fleeing" ||
              (a.state === "ridden" && Math.abs(game.player.vx) > 0.25);
            const attacking = a.state === "ridden" && game.player.mountAttack > 0;
            const jumping = a.state === "ridden" && !game.player.grounded;
            const groupName = attacking
              ? "rambi_attack"
              : jumping
                ? "rambi_jump"
                : moving
                  ? "rambi_walk"
                  : "rambi_idle";
            drawGroupAnim(ctx, groupName, game.time, moving ? 16 : 8, px, py - 12, flipX);
          }
        });

        // 9. Enemies & Necky Coconuts
        game.enemies.forEach((e) => {
          if (!e.alive) return;
          if (e.hurt > 0 && Math.sin(game.time * 32) <= -0.25) return;
          const { px, py } = toPixel(e.x, e.y);
          if (e.pattern === "necky") {
            const flipX = game.player.x > e.x;
            drawGroupAnim(ctx, "necky_throw", e.timer, 8, px, py - 14, flipX);
          } else if (e.kind === "beetle") {
            drawGroupAnim(ctx, "gnawty_walk", e.timer, 12, px, py - 10, e.vx < 0);
          } else if (e.kind === "armored") {
            drawGroupAnim(ctx, "klump_walk", e.timer, 10, px, py - 16, e.vx < 0);
          } else {
            drawGroupAnim(ctx, "kritter_walk", e.timer, 11, px, py - 15, e.vx < 0);
          }
        });

        game.enemyShots.forEach((shot) => {
          if (!shot.active) return;
          const { px, py } = toPixel(shot.x, shot.y);
          drawGroupAnim(ctx, "necky_nut", game.time, 14, px, py, shot.vx > 0);
        });

        // 10. Playable Characters: Rose (pink plush) & Violette (violet plush) in 2D
        drawPlushCast(ctx, game, plushRenderer, toPixel, camX, camY);

        // 11. Transient ROM Effects (defeated enemies, barrel break, smoke puffs, stars)
        fxList.forEach((fx) => {
          drawGroupAnim(
            ctx,
            fx.group,
            fx.age,
            fx.fps,
            fx.x,
            fx.y,
            fx.flipX,
            false,
          );
        });

        // 12. Layer 1 Front (priority 1: foreground leaves & secret cave tunnel mouths)
        ctx.drawImage(
          assets.l1Front,
          srcX,
          srcY,
          screenW,
          screenH,
          0,
          0,
          screenW,
          screenH,
        );
        if (nightBlend > 0.01) {
          ctx.save();
          ctx.globalAlpha = nightBlend;
          ctx.drawImage(
            assets.l1FrontNight,
            srcX,
            srcY,
            screenW,
            screenH,
            0,
            0,
            screenW,
            screenH,
          );
          ctx.restore();
        }

        // 13. Weather: ROM Rain & Lightning Flash during the night storm section
        if (nightBlend > 0.15) {
          ctx.save();
          ctx.strokeStyle = `rgba(185, 215, 255, ${(nightBlend * 0.42).toFixed(2)})`;
          ctx.lineWidth = 1;
          const rainStep = Math.floor(game.time * 240);
          ctx.beginPath();
          for (let i = 0; i < 42; i++) {
            const rx = ((i * 73 - rainStep + screenW * 10) % (screenW + 32)) - 16;
            const ry = ((i * 47 + rainStep * 1.4) % (screenH + 24)) - 12;
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx - 5, ry + 10);
          }
          ctx.stroke();

          // Periodic subtle lightning flash
          const flashCycle = (game.time * 0.45) % 1;
          if (flashCycle > 0.96) {
            ctx.fillStyle = `rgba(235, 245, 255, ${(nightBlend * 0.28).toFixed(2)})`;
            ctx.fillRect(0, 0, screenW, screenH);
          }
          ctx.restore();
        }
      }

      // 14. Authentic ROM 2D Sprite HUD (Banana counter, KONG letters, Life Balloon counter)
      if (assets && game.phase === "playing") {
        drawRomHud(ctx, assets, game, screenW, isPortrait);
      }

      nextUI += dt;
      if (nextUI > 0.09) {
        nextUI = 0;
        onTick();
      }
    };

    raf = requestAnimationFrame(step);
    return () => {
      active = false;
      cancelAnimationFrame(raf);
      plushRenderer.dispose();
    };
  }, [game, input, onTick]);

  return (
    <canvas
      ref={canvasRef}
      className="scene-2d-canvas"
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        imageRendering: "pixelated",
      }}
    />
  );
}

function drawPlushCast(
  ctx: CanvasRenderingContext2D,
  game: Game,
  plushRenderer: PlushSpriteRenderer,
  toPixel: (wx: number, wy: number) => { px: number; py: number },
  camX: number,
  camY: number,
) {
  const p = game.player;
  const swap = game.swap;
  const swapU = swap ? 1 - swap.remaining / TEAM_SWAP_DURATION : 0;
  const swapHop = Math.sin(Math.min(1, swapU) * Math.PI);
  const swapping = swapU > 0 && swapU < 1;

  // 1. Companion plush (drawn behind active plush when hp === 2)
  if (p.hp === 2) {
    let cx = game.companion.x;
    let cy = game.companion.y;
    if (swap) {
      const start = swap.back;
      const behindX = p.x - p.facing * 1.25;
      if (swapU < 0.5) {
        const t = swapU * 2;
        const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);
        cx = start.x + (p.x - start.x) * ease;
        cy = start.y + (p.y - start.y) * ease + swapHop * 0.55;
      } else {
        const t = (swapU - 0.5) * 2;
        const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);
        cx = p.x + (behindX - p.x) * ease;
        cy = p.y + swapHop * 0.25 * (1 - t);
      }
    }
    const compPx = toPixel(cx, cy);
    plushRenderer.draw(ctx, compPx.px - camX, compPx.py - camY, {
      pink: p.active !== 0,
      facing: game.companion.facing,
      walking: Math.abs(p.vx),
      grounded: p.grounded,
      roll: false,
      rollAngle: 0,
      rollFacing: 1,
      cannonFlight: false,
      swapping,
      swapHop,
      companion: true,
      riding: false,
      carrying: false,
      time: game.time,
    });
  }

  // 2. Active plush (hidden while inside a barrel cannon or on hurt blink frames)
  if (p.cannon < 0 && !(p.invincible > 0 && Math.sin(game.time * 34) <= -0.45)) {
    const mount = game.mount;
    const ax = mount ? p.x - p.facing * 0.12 : p.x;
    const ay = mount
      ? p.y + ANIMAL_DESIGNS[mount.kind].seat - 0.03
      : p.y + (swapping ? swapHop * 1.35 : 0);
    const actPx = toPixel(ax, ay);
    plushRenderer.draw(ctx, actPx.px - camX, actPx.py - camY, {
      pink: p.active === 0,
      facing: p.facing,
      walking: mount ? 0 : Math.abs(p.vx),
      grounded: p.grounded,
      roll: p.roll > 0,
      rollAngle: p.rollAngle,
      rollFacing: p.rollFacing,
      cannonFlight: p.launched > 0,
      swapping,
      swapHop,
      companion: false,
      riding: !!mount,
      carrying: p.carry >= 0,
      time: game.time,
    });
  }
}

function drawRomHud(
  ctx: CanvasRenderingContext2D,
  assets: Assets2D,
  game: Game,
  screenW: number,
  isPortrait: boolean,
) {
  const { frames, groups } = assets.manifest;
  const drawFrameAt = (idx: number | undefined, x: number, y: number) => {
    if (idx === undefined) return;
    const f = frames[idx];
    if (!f) return;
    ctx.drawImage(assets.sprites, f.x, f.y, f.w, f.h, x, y, f.w, f.h);
  };

  const hudY = isPortrait ? 44 : 22;
  const kongDark = groups["hud_kong_dark"];
  const kongLit = groups["hud_kong_lit"];
  const letters = ["K", "O", "N", "G"];
  const kongStartX = isPortrait
    ? Math.round(screenW * 0.5 - 12)
    : Math.round(screenW * 0.5 - 36);
  for (let i = 0; i < 4; i++) {
    const found = [...game.letters].some(
      (idx) => game.level.pickups[idx]?.letter === letters[i],
    );
    const fIdx = found ? kongLit?.[i] : kongDark?.[i];
    drawFrameAt(fIdx, kongStartX + i * 17, hudY);
  }

  // Spinning Banana + banana count
  const bananaGroup = groups["banana_spin"];
  const bananaX = isPortrait ? kongStartX - 42 : kongStartX - 54;
  if (bananaGroup?.length) {
    const bIdx = bananaGroup[Math.floor(game.time * 10) % bananaGroup.length];
    drawFrameAt(bIdx, bananaX, hudY);
  }
  const digits = groups["hud_digits"];
  if (digits?.length === 10) {
    const bStr = String(clamp(game.bananas, 0, 999)).padStart(2, "0");
    for (let i = 0; i < bStr.length; i++) {
      const d = Number(bStr[i]) || 0;
      drawFrameAt(digits[d], bananaX + 18 + i * 9, hudY);
    }
  }

  // Life Balloon + lives count
  const balloonGroup = groups["hud_balloon"];
  const rightX = kongStartX + 72;
  if (balloonGroup?.length) {
    const fIdx = balloonGroup[Math.floor(game.time * 6) % balloonGroup.length];
    const f = frames[fIdx];
    if (f) {
      ctx.drawImage(
        assets.sprites,
        f.x,
        f.y,
        f.w,
        Math.min(22, f.h),
        rightX,
        hudY - 4,
        f.w,
        Math.min(22, f.h),
      );
    }
  }
  if (digits?.length === 10) {
    const lStr = String(clamp(game.lives, 0, 99)).padStart(2, "0");
    for (let i = 0; i < lStr.length; i++) {
      const d = Number(lStr[i]) || 0;
      drawFrameAt(digits[d], rightX + 17 + i * 9, hudY);
    }
  }
}
