import { BODY_PROFILE } from "../game3d/plushGoonk/profile";
import { themeColors } from "../game3d/theme";

const plush = themeColors.plush;

export interface PlushPoseState {
  pink: boolean;
  facing: number;
  walking: number;
  grounded: boolean;
  roll: boolean;
  rollAngle: number;
  rollFacing: number;
  cannonFlight: boolean;
  swapping: boolean;
  swapHop: number;
  companion: boolean;
  riding: boolean;
  carrying: boolean;
  celebrating?: boolean;
  time: number;
}

export interface PlushFrameMeta {
  x: number;
  y: number;
  w: number;
  h: number;
  ox: number;
  oy: number;
}

export interface PlushAtlasManifest {
  frames: PlushFrameMeta[];
  groups: Record<string, number[]>;
}

export interface LoadedPlushAtlas {
  image: HTMLImageElement;
  manifest: PlushAtlasManifest;
}

let cachedPlushAtlasPromise: Promise<LoadedPlushAtlas | null> | null = null;

function assetUrl(path: string): string {
  const base =
    typeof import.meta !== "undefined" && import.meta.env?.BASE_URL
      ? import.meta.env.BASE_URL
      : "/";
  return `${base.replace(/\/?$/, "/")}${path.replace(/^\//, "")}`;
}

export function loadPlushAtlas(): Promise<LoadedPlushAtlas | null> {
  if (typeof window === "undefined" || typeof Image === "undefined") {
    return Promise.resolve(null);
  }
  if (!cachedPlushAtlasPromise) {
    cachedPlushAtlasPromise = Promise.all([
      fetch(assetUrl("rom2d/plush.json")).then((r) => {
        if (!r.ok) throw new Error("Missing plush.json");
        return r.json() as Promise<PlushAtlasManifest>;
      }),
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = assetUrl("rom2d/plush.png");
      }),
    ])
      .then(([manifest, image]) => ({ manifest, image }))
      .catch(() => null);
  }
  return cachedPlushAtlasPromise;
}

export class PlushSpriteRenderer {
  private atlas: LoadedPlushAtlas | null = null;

  constructor() {
    void loadPlushAtlas().then((loaded) => {
      this.atlas = loaded;
    });
  }

  draw(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    state: PlushPoseState,
    scale = 1,
  ) {
    // Soft ground contact shadow when grounded so feet look firmly planted on the path
    if (state.grounded && !state.riding && !state.cannonFlight) {
      ctx.save();
      ctx.fillStyle = "rgba(8, 12, 6, 0.38)";
      ctx.beginPath();
      const shadowRx = (state.pink ? 11 : 10) * scale;
      const shadowRy = 3.2 * scale;
      ctx.ellipse(
        Math.round(screenX),
        Math.round(screenY + 2 * scale),
        shadowRx,
        shadowRy,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();
    }

    if (this.atlas) {
      this.drawFromAtlas(ctx, screenX, screenY, state, scale);
      return;
    }
    this.drawFallback2D(ctx, screenX, screenY, state, scale);
  }

  private drawFromAtlas(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    state: PlushPoseState,
    scale: number,
  ) {
    const { image, manifest } = this.atlas!;
    const charKey = state.pink ? "pink" : "violet";

    let groupName = `${charKey}_idle`;
    let frameIdxInGroup = 0;

    if (state.celebrating) {
      groupName = `${charKey}_celebrate`;
      const g = manifest.groups[groupName];
      if (g?.length) {
        frameIdxInGroup = Math.floor(state.time * 8) % g.length;
      }
    } else if (state.roll || state.cannonFlight) {
      groupName = `${charKey}_roll`;
      const g = manifest.groups[groupName];
      if (g?.length) {
        const angle = state.cannonFlight
          ? state.time * 14
          : Math.abs(state.rollAngle);
        frameIdxInGroup =
          ((Math.floor((angle / (Math.PI * 2)) * g.length) % g.length) +
            g.length) %
          g.length;
      }
    } else if (state.riding) {
      groupName = `${charKey}_ride`;
      const g = manifest.groups[groupName];
      if (g?.length) {
        frameIdxInGroup = Math.floor(state.time * 6) % g.length;
      }
    } else if (state.carrying) {
      groupName = `${charKey}_carry`;
      const g = manifest.groups[groupName];
      if (g?.length) {
        frameIdxInGroup =
          state.walking > 0.15
            ? Math.floor(state.time * (8 + state.walking * 1.4)) % g.length
            : 0;
      }
    } else if (!state.grounded || state.swapping) {
      groupName =
        state.swapping || state.swapHop > 0.2
          ? `${charKey}_jump`
          : `${charKey}_fall`;
      frameIdxInGroup = 0;
    } else if (state.walking > 0.15) {
      groupName = `${charKey}_walk`;
      const g = manifest.groups[groupName];
      if (g?.length) {
        frameIdxInGroup =
          Math.floor(state.time * (9 + Math.min(10, state.walking * 1.5))) %
          g.length;
      }
    } else {
      groupName = `${charKey}_idle`;
      const g = manifest.groups[groupName];
      if (g?.length) {
        frameIdxInGroup = Math.floor(state.time * 4) % g.length;
      }
    }

    const group = manifest.groups[groupName];
    const frameIndex = group?.[frameIdxInGroup] ?? group?.[0];
    if (frameIndex === undefined) {
      this.drawFallback2D(ctx, screenX, screenY, state, scale);
      return;
    }
    const f = manifest.frames[frameIndex];
    if (!f) {
      this.drawFallback2D(ctx, screenX, screenY, state, scale);
      return;
    }

    const sx = Math.round(screenX);
    const sy = Math.round(screenY);
    const flipX = state.facing < 0;
    const dw = Math.round(f.w * scale);
    const dh = Math.round(f.h * scale);
    const dox = Math.round(f.ox * scale);
    const doy = Math.round(f.oy * scale);

    ctx.save();
    ctx.translate(sx, sy);
    if (flipX) ctx.scale(-1, 1);
    ctx.drawImage(image, f.x, f.y, f.w, f.h, dox, doy, dw, dh);
    ctx.restore();
  }

  private drawFallback2D(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    state: PlushPoseState,
    userScale = 1,
  ) {
    const { pink, facing, walking, grounded, roll, rollAngle, time: t } = state;
    const scale = (pink ? 42 : 39) * (state.riding ? 0.78 : 1) * userScale;
    const bounce = grounded
      ? Math.abs(Math.sin(t * walking * 2.1)) * Math.min(2.5, walking * 0.5)
      : 1;

    ctx.save();
    ctx.translate(
      Math.round(screenX),
      Math.round(screenY - scale * 0.39 + 3 * userScale - bounce),
    );
    if (roll) {
      ctx.rotate(-rollAngle * state.rollFacing);
    } else if (state.cannonFlight) {
      ctx.rotate(t * 14 * facing);
    }
    ctx.scale(facing < 0 ? -1 : 1, 1);

    const swing = walking > 0.1 ? Math.sin(t * walking * 2.1) * 4 : 0;
    const bodyCol = pink ? plush.fabricPink : plush.fabricPurple;
    const sheenCol = pink ? plush.sheenPink : plush.sheenPurple;
    const stitchCol = pink ? plush.stitchPink : plush.stitchPurple;

    ctx.fillStyle = stitchCol;
    ctx.beginPath();
    ctx.ellipse(-3 - swing, scale * 0.38, 5, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bodyCol;
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const p = BODY_PROFILE.getPoint(i / 20);
      const px = p.x * scale;
      const py = (0.42 - p.y) * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    for (let i = 20; i >= 0; i--) {
      const p = BODY_PROFILE.getPoint(i / 20);
      const px = -p.x * scale;
      const py = (0.42 - p.y) * scale;
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = sheenCol;
    ctx.beginPath();
    ctx.ellipse(2, 0, scale * 0.18, scale * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bodyCol;
    ctx.beginPath();
    ctx.ellipse(
      scale * 0.26,
      -scale * 0.02,
      scale * (pink ? 0.18 : 0.15),
      scale * 0.08,
      0.32,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    if (pink) {
      ctx.strokeStyle = plush.tuftYellow;
      ctx.lineWidth = 1.6;
      for (let k = -2; k <= 2; k++) {
        ctx.beginPath();
        ctx.moveTo(k * 1.2, -scale * 0.35);
        ctx.lineTo(k * 2.2, -scale * 0.45);
        ctx.stroke();
      }
    }

    ctx.fillStyle = plush.eyeWhite;
    ctx.beginPath();
    ctx.ellipse(scale * 0.11, -scale * 0.16, 2.6, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = plush.eyeInk;
    ctx.beginPath();
    ctx.ellipse(scale * 0.13, -scale * 0.15, 1.5, 2.0, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bodyCol;
    ctx.beginPath();
    const armY = state.carrying ? -scale * 0.28 : 2 + swing * 0.5;
    ctx.ellipse(-1 + swing * 0.5, armY, 3.2, 6.5, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(3 + swing, scale * 0.39, 5.2, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  dispose() {
    // Pure 2D atlas renderer holds no WebGL context
  }
}
