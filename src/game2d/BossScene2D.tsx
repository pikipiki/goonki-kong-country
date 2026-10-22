import {bossArenaBounds, BOSS_BARREL_HEIGHT, BOSS_CARRY} from "../game/bossArena";
import { useEffect, useRef } from "react";
import { STEP, type Game, type Input } from "../game/engine";
import { ENEMY_DESIGNS } from "../game/enemies";
import type { BossBattle, BossProjectile } from "../game/bossBattle";
import { bossViewport2D, bossCameraLeft } from "./camera2D";
import { PlushSpriteRenderer } from "./plushSprite";
interface Frame {
    x: number;
    y: number;
    w: number;
    h: number;
    ox: number;
    oy: number;
}
interface BossAssets {
    image: HTMLImageElement;
    manifest: {
        frames: Frame[];
        groups: Record<string, number[]>;
    };
    background: HTMLImageElement | null;
    objects: HTMLImageElement;
    objectManifest: {frames: Frame[]; groups: Record<string, number[]>};
}
function url(path: string) { return `${import.meta.env.BASE_URL.replace(/\/?$/, "/")}rom2d/${path}`; }
function image(src: string): Promise<HTMLImageElement> { return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = url(src); }); }
let assetsPromise: Promise<BossAssets> | null = null;
function loadAssets(): Promise<BossAssets> {
    if (!assetsPromise)
        assetsPromise = Promise.all([image("boss-sprites.png"), fetch(url("boss.json")).then(r => { if (!r.ok)
                throw new Error("Missing boss atlas"); return r.json(); }), image("boss-background.png").catch(() => null), image("sprites.png"), fetch(url("manifest.json")).then(r => {if(!r.ok)throw new Error("Missing object atlas");return r.json();})]).then(([image, manifest, background, objects, objectManifest]) => ({ image, manifest, background, objects, objectManifest })).catch(e => { assetsPromise = null; throw e; });
    return assetsPromise;
}
/** Keep the original 256×224 room undistorted. Extend its own sky, rigging
 * and edge deck strips where a phone viewport exposes additional space. */
function drawShipRoom(ctx: CanvasRenderingContext2D, background: HTMLImageElement,
    width: number, height: number, floor: number) {
    const left = Math.round((width - 256) / 2), top = Math.round(floor - 190);
    const sky = ctx.createLinearGradient(0, 0, 0, Math.max(1, top));
    sky.addColorStop(0, "#808fb2"); sky.addColorStop(1, "#6a71a4");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, width, Math.max(0, top));
    ctx.save(); ctx.globalAlpha = .22;
    for (let y = top - 80; y > -80; y -= 80) {
        for (let x = 0; x < width; x += 48) {
            ctx.drawImage(background, 112, 0, 48, 80, x, y, 48, 80);
        }
    }
    ctx.restore();
    // Side strips extend the deck in wide viewports without widening barrels.
    for (let x = left - 80; x > -80; x -= 80) {
        ctx.drawImage(background, 0, 0, 80, 224, x, top, 80, 224);
    }
    for (let x = left + 256; x < width; x += 80) {
        ctx.drawImage(background, 176, 0, 80, 224, x, top, 80, 224);
    }
    ctx.drawImage(background, left, top);
    for (let y = top - 16; y > -16; y -= 16) {
        ctx.drawImage(background, 0, 0, 101, 16, left, y, 101, 16);
        ctx.drawImage(background, 200, 0, 56, 16, left + 200, y, 56, 16);
    }
    // Extra portrait space below the contact plane is made from deck planks.
    for (let y = top + 224; y < height; y += 24) {
        for (let x = 0; x < width; x += 256) {
            ctx.drawImage(background, 0, 196, 256, 24, x, y, 256, 24);
        }
    }
}
/** Shared gameplay clock and boss state; the pixel renderer never runs a separate fight. */
export function BossScene2D({ game, input, onTick }: {
    game: Game;
    input: Input;
    onTick: () => void;
}) {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        let alive = true, raf = 0, last = performance.now(), acc = 0, ui = 0, assets: BossAssets | null = null;
        const plush = new PlushSpriteRenderer();
        let cameraLeft: number | null = null, cameraLift = 0, revision = game.sceneRevision;
        void loadAssets().then(a => { if (alive)
            assets = a; }).catch(e => console.error("[BossScene2D]", e));
        const step = (now: number) => {
            if (!alive)
                return;
            raf = requestAnimationFrame(step);
            const dt = Math.min(.1, (now - last) / 1000);
            last = now;
            if (game.phase === "playing") {
                acc += dt;
                while (acc >= STEP) {
                    game.update(input);
                    acc -= STEP;
                }
            }
            else
                acc = 0;
            const canvas = ref.current;
            if (!canvas)
                return;
            const ctx = canvas.getContext("2d");
            if (!ctx)
                return;
            const rect = canvas.getBoundingClientRect(), aspect = rect.width / Math.max(1, rect.height);
            const viewport = bossViewport2D(rect.width, rect.height), w = viewport.width, h = viewport.height;
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }
            ctx.imageSmoothingEnabled = false;
            const view = game as Game & {
                bossBattle?: BossBattle | null;
                bossProjectiles?: BossProjectile[];
            };
            const fight = view.bossBattle, boss = game.enemies.find(e => e.kind === "boss"), p = game.player;
            const targetLeft = bossCameraLeft(p.x, viewport.worldWidth, game.level.length);
            if (cameraLeft === null || revision !== game.sceneRevision || Math.abs(targetLeft - cameraLeft) > viewport.worldWidth) {
                cameraLeft = targetLeft; cameraLift = 0; revision = game.sceneRevision;
            }
            cameraLeft += (targetLeft - cameraLeft) * (1 - Math.exp(-dt * 9));
            // Landscape touch controls occupy the lower corners; keep feet and
            // projectiles above them, with the captured deck aligned to this plane.
            const scale = (w - 32) / viewport.worldWidth;
            // Track high jumps/bounces too, keeping the plush below the HUD.
            const targetLift = Math.max(0, p.y - (viewport.portrait ? 2.2 : 1.2));
            cameraLift += (targetLift - cameraLift) * (1 - Math.exp(-dt * 10));
            const floor = Math.round(h * (aspect >= 1.14 ? .65 : 190 / 224) + cameraLift * scale);
            const px = (x: number) => 16 + (x - cameraLeft!) * scale, py = (y: number) => floor - y * scale;
            game.cameraBounds = {x: cameraLeft + viewport.worldWidth / 2, y: (floor - h / 2) / scale, halfX: viewport.worldWidth / 2 + 1, halfY: h / scale / 2 + 1};
            const sky = ctx.createLinearGradient(0, 0, 0, 160);
            sky.addColorStop(0, "#515e87");
            sky.addColorStop(.55, "#a1adc3");
            sky.addColorStop(1, "#b7bfcb");
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, w, h);
            if (assets?.background)
                drawShipRoom(ctx, assets.background, w, h, floor);
            else {
                ctx.fillStyle = "#627b9c";
                ctx.fillRect(0, 119, w, 48);
                ctx.fillStyle = "#99afc1";
                for (let i = 0; i < 24; i++)
                    ctx.fillRect((i * 41 + Math.floor(game.time * 3)) % w, 128 + i % 6 * 5, 22, 1);
                ctx.fillStyle = "#253929";
                ctx.beginPath();
                ctx.moveTo(w * .42, 121);
                ctx.lineTo(w * .47, 104);
                ctx.lineTo(w * .50, 70);
                ctx.lineTo(w * .54, 111);
                ctx.lineTo(w * .59, 122);
                ctx.fill();
                ctx.fillStyle = "#c6ad78";
                ctx.fillRect(0, 160, w, 64);
                for (let x = 0; x < w; x += 16) {
                    ctx.fillStyle = x % 32 ? "#92582c" : "#c18b47";
                    ctx.fillRect(x, 164, 15, 60);
                    ctx.fillStyle = "#e3bb73";
                    ctx.fillRect(x, 164, 2, 60);
                    ctx.fillStyle = "#4d301e";
                    ctx.fillRect(x + 10, 171, 2, 2);
                    ctx.fillRect(x + 10, 210, 2, 2);
                }
                for (const x of [w * .10, w * .90]) {
                    ctx.strokeStyle = "#362b23";
                    ctx.lineWidth = 2;
                    for (let i = -2; i <= 2; i++) {
                        ctx.beginPath();
                        ctx.moveTo(x + i * 10, 0);
                        ctx.lineTo(x + i * 12, 99);
                        ctx.stroke();
                    }
                    for (let y = 4; y < 100; y += 15) {
                        ctx.beginPath();
                        ctx.moveTo(x - 25, y);
                        ctx.lineTo(x + 25, y);
                        ctx.stroke();
                    }
                }
            }
            // Adapt the captured ship room to each viewport, keeping the deck contact
            // plane aligned with physics and every attack inside the visible arena.
            const draw = (group: string, time: number, x: number, y: number, flip = false, desiredHeight?: number, loop = true, fixedScale?: number, centered = false) => {
                if (!assets)
                    return false;
                const list = assets.manifest.groups[group];
                if (!list?.length)
                    return false;
                const index = Math.floor(Math.max(0, time) * 12), f = assets.manifest.frames[list[loop ? index % list.length : Math.min(index, list.length - 1)]];
                if (!f)
                    return false;
                const s = fixedScale ?? (desiredHeight ? desiredHeight / f.h : 1);
                ctx.save();
                ctx.translate(Math.round(x), Math.round(y));
                if (flip)
                    ctx.scale(-1, 1);
                ctx.drawImage(assets.image, f.x, f.y, f.w, f.h, Math.round((centered ? -f.w / 2 : f.ox) * s), Math.round((centered ? -f.h / 2 : group === "fall" || group === "getUp" ? -f.h : f.oy) * s), Math.ceil(f.w * s), Math.ceil(f.h * s));
                ctx.restore();
                return true;
            };
            draw("island", 0, w * .5, floor - 190 + 96, false, 40);
            const bounds = bossArenaBounds(game.level.length);
            // End masts are real arena limits, projected with the same camera
            // as the player. No invisible clamp partway along a continuous deck.
            for(const edge of [bounds.left,bounds.right]) {
                const x=px(edge), pole=Math.max(3,scale*.18);
                ctx.fillStyle="#49321f";ctx.fillRect(x-pole/2,0,pole,floor+scale*.3);
                ctx.fillStyle="#bd8c48";ctx.fillRect(x-pole/2,0,Math.max(1,pole*.3),floor+scale*.3);
                ctx.strokeStyle="#aa844a";ctx.lineWidth=Math.max(1,scale*.07);
                for(const y of [1,2.15]){ctx.beginPath();ctx.moveTo(x,py(y));ctx.lineTo(x+(edge===bounds.left?-1:1)*scale,py(y)+scale*.12);ctx.stroke();}
            }
            ctx.strokeStyle="#e2ad5c";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px(bounds.left),floor);ctx.lineTo(px(bounds.right),floor);ctx.stroke();
            const objectFrame=(group:string,time:number)=>{
                const list=assets?.objectManifest.groups[group];
                return list?.length?assets!.objectManifest.frames[list[Math.floor(time*12)%list.length]]:undefined;
            };
            const barrel=(kind:string,x:number,y:number,anchor:'feet'|'centre',time:number)=>{
                const f=objectFrame(kind==='rescue'?'dk_barrel':kind==='checkpoint'?'checkpoint_barrel':kind==='rolling'?'barrel_roll':'barrel_idle',time);
                // Fixed WORLD height in every state; never fixed canvas pixels.
                const s=BOSS_BARREL_HEIGHT*scale/40;
                if(!f||!assets){ctx.fillStyle="#9b622f";ctx.fillRect(x-.4*scale,y-(anchor==='feet'?1:.5)*BOSS_BARREL_HEIGHT*scale,.8*scale,BOSS_BARREL_HEIGHT*scale);return;}
                const ax=x-(f.ox+f.w/2)*s, ay=y-(f.oy+f.h*(anchor==='feet'?1:.5))*s;
                const drawFrame=(frame:Frame)=>ctx.drawImage(assets!.objects,frame.x,frame.y,frame.w,frame.h,ax+frame.ox*s,ay+frame.oy*s,frame.w*s,frame.h*s);
                drawFrame(f);
                if(kind==='rescue'){const letters=objectFrame('dk_letters',time);if(letters)drawFrame(letters);}
            };
            game.level.barrels.forEach((b,i)=>{
                if(b.kind==='cannon'||game.usedBarrels.has(i))return;
                barrel(b.kind,px(b.x),py(b.y),'feet',game.time);
            });
            if (boss) {
                const phase = fight?.phase ?? "intro", group = phase === "intro" ? "jump" : phase === "run" ? "run" : phase === "throw" ? "throw" : phase === "jump" ? "jump" : phase === "hurt" ? "hurt" : phase === "fakeDeath" || phase === "dead" ? "fall" : phase === "getUp" ? "getUp" : phase === "rain" ? "rain" : fight?.crowned === false ? "wait" : "idle";
                const x = px(boss.x), y = py(boss.y), bossHeight = ENEMY_DESIGNS.boss.height * scale;
                // Scale the exposed head, not the taller crown frame. Its source
                // anchor is 65px above the feet plus the 5px ground correction.
                const head = assets?.manifest.frames[assets.manifest.groups.wait?.[0]];
                const headPixels = Math.abs(head?.oy ?? -65) + 5, bossScale = bossHeight / headPixels;
                if (!draw(group, fight?.phaseTime ?? game.time, x, y - 5 * bossScale, (fight?.facing ?? -1) < 0, undefined, !["throw", "hurt", "fall", "getUp"].includes(group), bossScale)) {
                    ctx.fillStyle = "#759044";
                    ctx.fillRect(x - 12, y - 30, 24, 30);
                    ctx.fillStyle = "#d4b954";
                    ctx.fillRect(x - 11, y - 29, 22, 4);
                }
            }
            for (const shot of view.bossProjectiles ?? []) {
                if (!shot.active)
                    continue;
                if (shot.kind === "cannonball" && shot.warning > 0) {
                    ctx.fillStyle = "rgba(255,205,90,.72)";
                    ctx.fillRect(px(shot.x) - 4, floor - 2, 8, 2);
                    continue;
                }
                const x = px(shot.x), y = py(shot.y);
                if (shot.kind === "crown") {
                    if (!draw("crown", game.time, x, y, false, Math.max(8, shot.height * scale), true, undefined, true)) {
                        ctx.fillStyle = "#efc342";
                        ctx.fillRect(x - 5, y - 4, 10, 7);
                    }
                }
                else {
                    ctx.save();ctx.translate(x,y);
                    if((shot.impact??0)>0)ctx.scale(1.25,.65);
                    if(!draw("cannonball",0,0,0,false,shot.height*scale,true,undefined,true)){
                        ctx.fillStyle="#252326";ctx.beginPath();ctx.arc(0,0,shot.width*scale,0,Math.PI*2);ctx.fill();
                    }
                    ctx.restore();
                }
            }
            for (const t of game.thrown) {
                if (!t.active)
                    continue;
                barrel('rolling',px(t.x),py(t.y),'centre',game.time);
            }
            if (boss?.alive && (px(boss.x) < 0 || px(boss.x) > w)) {
                const right = px(boss.x) > w;
                ctx.fillStyle = "#ffd66a"; ctx.font = "bold 14px monospace";
                ctx.textAlign = right ? "right" : "left";
                ctx.fillText(right ? "♛ ▶" : "◀ ♛", right ? w - 7 : 7, floor - 3 * scale);
            }
            const pose = (pink: boolean, facing: number, companion: boolean) => ({ pink, facing, walking: Math.abs(p.vx), grounded: p.grounded, roll: !companion && p.roll > 0, rollAngle: p.rollAngle, rollFacing: p.rollFacing, cannonFlight: p.launched > 0, swapping: false, swapHop: 0, companion, riding: false, carrying: !companion && p.carry >= 0, celebrating: game.phase === "clear" || game.phase === "victory", time: game.time });
            const plushScale = scale / 32;
            if (p.hp === 2)
                plush.draw(ctx, px(game.companion.x), py(game.companion.y), pose(p.active !== 0, game.companion.facing, true), plushScale);
            if (!(p.invincible > 0 && Math.sin(game.time * 34) < -.45))
                plush.draw(ctx, px(p.x), py(p.y), pose(p.active === 0, p.facing, false), plushScale);
            if (p.carry >= 0) {
                barrel(game.level.barrels[p.carry]?.kind??'throw',px(p.x+p.facing*BOSS_CARRY.x),py(p.y+BOSS_CARRY.y),'centre',game.time);
            }
            ui += dt;
            if (ui > .09) {
                ui = 0;
                onTick();
            }
        };
        raf = requestAnimationFrame(step);
        return () => { alive = false; cancelAnimationFrame(raf); plush.dispose(); };
    }, [game, input, onTick]);
    return <canvas ref={ref} className="scene-2d-canvas" aria-label="Gangplank Galleon 2D" style={{ width: "100%", height: "100%", display: "block", imageRendering: "pixelated" }}/>;
}
