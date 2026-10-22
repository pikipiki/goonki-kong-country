import { createBossBattle, updateBossBattle, registerBossHit, bossAcceptsHit, BOSS_MAX_HITS, type BossBattle, type BossProjectile, type BossPhase } from "./bossBattle";
import { cannonWorldPosition } from './cannonMotion';
import { BUDDY_PHYSICS, ANIMAL_DESIGNS, ENGUARDE_SWIM_BODY, type Animal } from "./animals";
import { ROM_JUNGLE, ORIGINAL_JUNGLE_ORIGIN } from "./originalJungle";
import { ROM_CORAL } from "./originalCoral";
import { ROM_REVERB, ORIGINAL_REVERB_ORIGIN } from "./originalReverb";
import { ROM_MINE_CART, ORIGINAL_MINE_CART_ORIGIN } from "./originalMineCart";
import { query as originalTerrain } from "./originalTerrain";
import {
  query as originalCaveTerrain,
} from "./canyonTerrain";
import {
  query as originalMineCartTerrain,
} from "./originalMineCartTerrain";
import { ORIGINAL_CORAL_ORIGIN } from "./originalCoral";
import { queryCoral } from "./originalCoralTerrain";
import { terrainSolidSpans, resolveCoralMotion, resolveLandMotion, nearestCoralOpenY } from "./terrainSolids";
import { ENEMY_DESIGNS } from "./enemies";
import { LEVELS, type EnemySpec, type Platform, type Level } from "./levels";
import evidence from "../../reference/rom-analysis.json";
import playerEvidence from "../../reference/player-states.json";
import neckyEvidence from "../../reference/necky-ballistics.json";
import underwaterMotion from "../../reference/underwater-motion.json";
import { normalizeLandEnemyFeet, mineBeePatrolBounds, cannonMomentumDuration, mineEncounterClearance, mineBirdHasCloseBee } from "./routeSafety";
import { CORAL_WATER_SURFACE_Y, CORAL_WATER_FLOOR_Y, CORAL_WORLD_WIDTH } from "./marineScale";
import { tr } from "../i18n";
import { L } from "../i18n/keys";
import { tx } from "../i18n/resolveText";

export const STEP = 1 / 60;
/** ROM tag swap: state 17 / anim 80 lasts ~25 frames at 60 Hz. */
export const TEAM_SWAP_DURATION = 0.42;
export interface TeamSwap {
  remaining: number;
  back: { x: number; y: number; facing: number };
}
export const ROM = {
  gravity: -evidence.findings.gravity.values.accelerationRaw,
  terminal: -evidence.findings.gravity.values.terminalVelocityRaw,
  held: [
    -evidence.findings.heldJump.values.pinkGravityRaw,
    -evidence.findings.heldJump.values.violetGravityRaw,
  ],
  bounce: [
    evidence.findings.enemyBounce.values.pinkBounceRaw,
    evidence.findings.enemyBounce.values.violetBounceRaw,
  ],
  bananas: evidence.findings.bananaLife.values.bananasPerLife,
  jump: [playerEvidence.findings.pinkNormalJump.values.verticalSpeedRaw,
    playerEvidence.findings.violetNormalJump.values.verticalSpeedRaw],
};
const THROW = playerEvidence.findings.thrownObjectVelocity.values;
const CANNON_TEMPLATE = playerEvidence.findings.cannonBaseTemplate.values;
const CANNON_VECTORS = playerEvidence.cannonBaseTemplateVectors;
const JUMP_IMPULSE_DELAY_FRAMES = 2;
const NECKY_NUT = neckyEvidence.engine;
const NECKY_SHOOT_PERIOD = NECKY_NUT.shootPeriodFrames / 60;
const WORLD_PIXELS = 32;
const rawSpeed = (raw: number) => ((raw / 256) * 60) / WORLD_PIXELS;
const ROM_SWIM_HORIZONTAL = rawSpeed(underwaterMotion.horizontalCruiseVxRaw);
const ROM_SWIM_SINK = underwaterMotion.verticalSwim.sinkAccelerationWorldPerSecond;
const ROM_SWIM_IDLE_SINK =
  underwaterMotion.verticalSwim.idleSinkSpeedWorld ?? 0.85;
const ROM_SWIM_RISE = underwaterMotion.verticalSwim.riseSpeedWorld;
const ROM_SWIM_DIVE = underwaterMotion.verticalSwim.diveSpeedWorld;
const THROW_TARGET_VX = rawSpeed(THROW.horizontalTargetMagnitudeRaw);
const rawAcceleration = (raw: number) => rawSpeed(raw) * 60;
export type Key =
  "left" | "right" | "jump" | "action" | "swap" | "run" | "up" | "down";
export type Phase =
  "title" | "playing" | "paused" | "map" | "clear" | "gameover" | "victory";
export interface Input {
  held: Set<Key>;
  pressed: Set<Key>;
  released: Set<Key>;
  /** True when the mobile UI is in tap-to-toggle mode (see GameControls). */
  clickMode?: boolean;
  /** Screen action presses pick up / throw on separate taps, independently of steering mode. */
  tapAction?: boolean;
}
export interface Enemy extends EnemySpec {
  bossState?: BossPhase;
  bossFacing?: number;
  bossCrowned?: boolean;
  originY: number;
  vx: number;
  alive: boolean;
  hp: number;
  vy: number;
  timer: number;
  hurt: number;
  vulnerable: boolean;
  shootCooldown: number;
}
export interface Particle {
  x: number;
  y: number;
  age: number;
  text: string;
  color: string;
}
export interface Thrown {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}
export interface EnemyShot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}
export interface Save {
  unlocked: number;
  best: Record<string, { bananas: number; letters: number; time: number }>;
}
export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number;
  grounded: boolean;
  active: number;
  hp: number;
  invincible: number;
  roll: number;
  rollJump: boolean;
  rollJumpMomentum: number;
  /** Complete the forced rebound before the next mine Zinger, even after a short tap. */
  cartRebound: boolean;
  rollSpeed: number;
  rollFacing: number;
  rollChain: number;
  rollAngle: number;
  recentRun: number;
  mount: number;
  mountAttack: number;
  mountCharge: number;
  mountCharged: boolean;
  mountCooldown: number;
  carry: number;
  cannon: number;
  cannonLock: number;
  cannonTime: number;
  launched: number;
  cannonGravityDelay: number;
  cannonControlDelay: number;
  jumpDelay: number;
  coyote: number;
  buffer: number;
}
const cannonLaunchVelocity = (angleRad: number) => {
  const aimX = Math.cos(angleRad);
  const aimY = Math.sin(angleRad);
  let best = 0;
  let bestDot = -Infinity;
  CANNON_VECTORS.forEach((v, i) => {
    const vx = rawSpeed(v.velocityXRaw);
    const vy = rawSpeed(v.velocityYRaw);
    const mag = Math.hypot(vx, vy) || 1;
    const dot = (vx / mag) * aimX + (vy / mag) * aimY;
    if (dot > bestDot) {
      bestDot = dot;
      best = i;
    }
  });
  const v = CANNON_VECTORS[best];
  return {
    vx: rawSpeed(v.velocityXRaw),
    vy: rawSpeed(v.velocityYRaw),
  };
};
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const approach = (x: number, target: number, max: number) =>
  x + clamp(target - x, -max, max);
// Rev 2 Jungle traces: move 1/8 of the signed velocity error, quantized to 8.8.
// The fixed-step Director calls this once per 60 Hz simulation update.
const approachFootVelocity = (value: number, target: number) => {
  const raw = Math.round(value / rawSpeed(1));
  const targetRaw = Math.round(target / rawSpeed(1));
  const error = targetRaw - raw;
  const step = Math.abs(error) >> 3;
  return rawSpeed(raw + (step === 0 ? error : Math.sign(error) * step));
};
export const emptyInput = (): Input => ({
  held: new Set(),
  pressed: new Set(),
  released: new Set(),
});

/** Padded for portrait, landscape, camera look-ahead and enemy body size.
 * Activate before rendering, never hide an enemy already inside the play area. */
export function enemyViewportBand(_game: Game) {
  return { halfX: 28, halfY: 24, simHalfX: 36, simHalfY: 30 };
}

export function enemyVisibleToCamera(game: Game, enemy: Enemy, margin = 1) {
  if (!enemy.alive) return false;
  const band = enemyViewportBand(game), bounds = game.cameraBounds;
  const x = bounds?.x ?? game.player.x, y = bounds?.y ?? game.player.y;
  return Math.abs(enemy.x-x) <= (bounds?.halfX ?? band.halfX)*margin+2 &&
    Math.abs(enemy.y-y) <= (bounds?.halfY ?? band.halfY)*margin+3;
}

export function enemySimulationActive(game: Game, enemy: Enemy) {
  if (!enemy.alive) return false;
  const band = enemyViewportBand(game), bounds = game.cameraBounds;
  // Include the player too while the camera catches up after a respawn.
  return enemyVisibleToCamera(game,enemy) ||
    (Math.abs(enemy.x-game.player.x) <= (bounds?.halfX ?? band.simHalfX)+8 &&
     Math.abs(enemy.y-game.player.y) <= (bounds?.halfY ?? band.simHalfY)+8);
}
/** Damage flashing must never override death or camera visibility. */
export function enemyRenderVisible(enemy: Enemy, time: number, game?: Game, preview = false) {
  return preview || (enemy.alive && (!game || enemyVisibleToCamera(game, enemy)) &&
    (enemy.hurt <= 0 || Math.sin(time * 32) > -0.25));
}
const defaultSave = (): Save => ({ unlocked: 0, best: {} });
export function readSave(text: string | null): Save {
  try {
    const value = JSON.parse(text ?? "{}") as Save;
    if (
      !Number.isInteger(value.unlocked) ||
      !value.best ||
      typeof value.best !== "object"
    )
      return defaultSave();
    const best: Save["best"] = {};
    for (const [key, item] of Object.entries(value.best))
      if (
        item &&
        Number.isFinite(item.bananas) &&
        Number.isFinite(item.letters) &&
        Number.isFinite(item.time)
      )
        best[key] = item;
    return { unlocked: clamp(value.unlocked, 0, LEVELS.length - 1), best };
  } catch {
    return defaultSave();
  }
}
export class Game {
  phase: Phase = "title";
  levelId = 0;
  sceneRevision = 0;
  private mineRecoveryLayout = 1;
  cameraBounds: { x:number; y:number; halfX:number; halfY:number } | null = null;
  originalRoute = false;
  /** Separate playable bonus scene; source-room layouts are still adapted. */
  bonus: { index: number; stage: Level; sourceIndices: number[]; world: Pick<Game,
    "player"|"enemies"|"animals"|"collected"|"letters"|"usedBarrels"|"thrown"|"enemyShots"|"checkpoint"|"companion"|"trail"> } | null = null;
  bonusDoorCooldown = 0;
  lives = 5;
  bananas = 0;
  total = 0;
  levelBananas = 0;
  letters = new Set<number>();
  collected = new Set<number>();
  revealedCaches = new Set<number>();
  collectedCaches = new Set<number>();
  brokenWalls = new Set<number>();
  collectedBonus = new Set<string>();
  completedBonus = new Set<number>();
  usedBarrels = new Set<number>();
  cannonTimes: number[] = [];
  enemies: Enemy[] = [];
  animals: Animal[] = [];
  particles: Particle[] = [];
  thrown: Thrown[] = [];
  enemyShots: EnemyShot[] = [];
  bossBattle: BossBattle | null = null;
  bossProjectiles: BossProjectile[] = [];
  player!: Player;
  time = 0;
  checkpoint = { x: 3, y: 0 };
  trail: { x: number; y: number; facing: number }[] = [];
  companion = { x: 1.3, y: 0, facing: 1 };
  swap: TeamSwap | null = null;
  toast = "";
  toastTimer = 0;
  save: Save;
  onEvent: (name: string) => void = () => {};
  onSave: (save: Save) => void = () => {};
  constructor(save = defaultSave()) {
    this.save = save;
    this.load(0, "title");
  }
  get level(): Level {
    if (this.bonus) return this.bonus.stage;
    if (!this.originalRoute) return LEVELS[this.levelId];
    if (this.levelId === 0) return ROM_JUNGLE;
    if (this.levelId === 1) return ROM_REVERB;
    if (this.levelId === 2) return ROM_MINE_CART;
    if (this.levelId === 3) return ROM_CORAL;
    return LEVELS[this.levelId];
  }
  get letterWord() { return this.level.letterWord ?? "GOONK"; }
  floorAt(x:number,y:number) {
    if (this.level.originalTerrain === "jungle")
      return originalTerrain(x, y, ORIGINAL_JUNGLE_ORIGIN)?.floorY ?? null;
    if (this.level.originalTerrain === "cave")
      return originalCaveTerrain(x, y, ORIGINAL_REVERB_ORIGIN)?.floorY ?? null;
    if (this.level.originalTerrain === "mineCart")
      return originalMineCartTerrain(x, y, ORIGINAL_MINE_CART_ORIGIN)?.floorY ?? null;
    if (this.level.originalTerrain === "coral")
      return queryCoral(x, y, ORIGINAL_CORAL_ORIGIN)?.floorY ?? null;
    let top:number|null=null;
    for(const platform of this.level.platforms) {
      const floor=this.surface(platform);
      if(Math.abs(x-platform.x)<platform.w/2 && floor<=y+0.2 && (top===null||floor>top))top=floor;
    }
    return top;
  }
  supportAt(x: number, feet: number, rise = 0.3) {
    const surfaces = this.level.originalTerrain
      ? terrainSolidSpans(this.level.originalTerrain, x).map(s => s.top)
      : this.level.platforms.filter(p => Math.abs(x-p.x) < p.w/2).map(p => this.surface(p));
    const below = surfaces.filter(y => y <= feet + rise);
    return below.length ? Math.max(...below) : null;
  }
  private groundEnemy(enemy: Enemy, dt: number) {
    const oldX = enemy.x, oldY = enemy.y;
    const support = this.supportAt(oldX, oldY);
    const onGround = support !== null && Math.abs(support-oldY) < 0.32;
    const nextX = clamp(oldX + enemy.vx*dt, enemy.min, enemy.max);
    const dir = Math.sign(enemy.vx);
    const ahead = this.supportAt(nextX + dir * 0.45, oldY);
    const wall = this.level.originalTerrain && terrainSolidSpans(this.level.originalTerrain, nextX + dir*0.45)
      .some(s => s.bottom < oldY+0.65 && s.top > oldY+0.35);
    if (nextX === enemy.min || nextX === enemy.max || (onGround && (ahead === null || ahead < oldY-0.45 || wall))) {
      enemy.vx *= -1;
    } else enemy.x = nextX;
    const floor = this.supportAt(enemy.x, oldY);
    enemy.vy = Math.max(-15, enemy.vy - 30*dt);
    enemy.y += enemy.vy*dt;
    if (floor !== null && enemy.y <= floor && (onGround || oldY >= floor-0.05)) {
      enemy.y = floor; enemy.vy = 0;
    }
    if(enemy.y < -8) enemy.alive = false;
  }
  load(id: number, phase: Phase = "playing") {
    this.bonus = null; this.bonusDoorCooldown = 0;
    this.bossBattle = null; this.bossProjectiles = [];
    this.sceneRevision++;
    this.cameraBounds = null;
    this.mineRecoveryLayout = 1;
    this.levelId = clamp(id, 0, LEVELS.length - 1);
    this.phase = phase;
    this.time = 0;
    this.levelBananas = 0;
    this.letters = new Set();
    this.collected = new Set();
    this.revealedCaches = new Set();
    this.collectedCaches = new Set();
    this.brokenWalls = new Set();
    this.collectedBonus = new Set();
    this.completedBonus = new Set();
    this.usedBarrels = new Set();
    this.cannonTimes = [];
    this.particles = [];
    this.thrown = [];
    this.trail = [];
    const sourceFloor = this.level.start?.y ?? this.level.platforms[0].y;
    const startX = this.level.start?.x ?? 3;
    const floor = this.level.originalTerrain === "coral" ? nearestCoralOpenY(startX,sourceFloor) : sourceFloor;
    this.checkpoint = { x: startX, y: floor };
    this.player = {
      x: startX,
      y: floor,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: this.level.biome !== "lagoon",
      active: 0,
      hp: 2,
      invincible: 0,
      roll: 0,
      rollJump: false, rollJumpMomentum: 0, cartRebound: false, rollSpeed: 0, rollFacing: 1, rollChain: 0, rollAngle: 0, recentRun: 1,
      mount: -1, mountAttack: 0, mountCharge: 0, mountCharged: false, mountCooldown: 0,
      carry: -1,
      cannon: -1, cannonLock: -1, cannonTime: 0, launched: 0,
      cannonGravityDelay: 0, cannonControlDelay: 0, jumpDelay: 0,
      coyote: 0.1,
      buffer: 0,
    };
    this.animals = (this.level.animals ?? []).map(spawn => ({
      ...spawn, state: "crate", vx: 0, vy: 0, facing: 1, timer: 0,
    }));
    this.companion = { x: startX - 1.8, y: floor, facing: 1 };
    this.swap = null;
    const spawnStart = this.level.start;
    const encounterSpecs=this.level.originalTerrain === "mineCart" ? mineEncounterClearance(this.level.enemies) : this.level.enemies;
    this.enemies = encounterSpecs.map((spec, i) => {
      let x = spec.x;
      if (
        this.level.originalTerrain === "coral" &&
        spawnStart &&
        Math.hypot(spec.x - spawnStart.x, spec.y - spawnStart.y) < 0.85
      ) {
        x = Math.min(spec.max - 0.4, spec.x + 4);
      }
      return {
      ...spec,
      x,
      originY: spec.y,
      vx:
        (i % 2 ? 1 : -1) *
        (spec.patrolSpeed ??
          (spec.kind === "croc" ? 1.8 : spec.kind === "bee" ? 1.25 : 1.25)),
      alive: true,
      hp: spec.kind === "boss" ? BOSS_MAX_HITS : 1,
      vy: 0,
      timer: 0,
      hurt: 0,
      vulnerable: false,
      shootCooldown: spec.throwsNuts
        ? NECKY_SHOOT_PERIOD * (0.85 + (i % 3) * 0.05)
        : 0,
    };
    });
    const boss=this.enemies.find(e=>e.kind==='boss');
    if(boss)this.bossBattle=createBossBattle(boss);
    if(this.level.biome !== "lagoon") for(const enemy of this.enemies) {
      if(enemy.kind === "bee" || enemy.kind === "boss" || enemy.pattern === "necky") continue;
      const floor = this.level.originalTerrain
        ? normalizeLandEnemyFeet(this.level.originalTerrain,enemy.x,enemy.y,{radius:ENEMY_DESIGNS[enemy.kind].width*.65,height:ENEMY_DESIGNS[enemy.kind].height})
        : this.supportAt(enemy.x, enemy.y, 0.5);
      if(floor !== null) { enemy.y = floor; enemy.originY = floor; }
    }
    if(this.level.originalTerrain === "mineCart") for(const enemy of this.enemies) {
      if(enemy.kind === "bee" && enemy.pattern !== "necky") Object.assign(enemy,mineBeePatrolBounds(enemy,this.level.enemies,this.level.length));
    }
    if(this.level.originalTerrain === "coral") {
      for(const enemy of this.enemies) {
        enemy.y = nearestCoralOpenY(enemy.x, enemy.y, ENEMY_DESIGNS[enemy.kind].height);
        if(Math.abs(enemy.x-startX)<2 && Math.abs(enemy.y-floor)<1.6) {
          enemy.x = clamp(startX+4, enemy.min, enemy.max);
          enemy.y = nearestCoralOpenY(enemy.x,enemy.y,ENEMY_DESIGNS[enemy.kind].height);
        }
        enemy.originY = enemy.y;
      }
      for(const animal of this.animals) animal.y = nearestCoralOpenY(animal.x,animal.y,ENGUARDE_SWIM_BODY.height);
    }
    this.enemyShots = [];
    this.message(tx(this.level.tip), 6);
  }
  start(id = 0, original = false) {
    this.originalRoute = original;
    this.lives = 5;
    this.bananas = 0;
    this.total = 0;
    this.load(id);
  }
  message(text: string, duration = 3) {
    this.toast = text;
    this.toastTimer = duration;
  }
  private throwableBarrelIndex(p: Player) {
    return this.level.barrels.findIndex(
      (b, i) =>
        b.kind === "throw" &&
        !this.usedBarrels.has(i) &&
        Math.abs(b.x - p.x) < 1.7 &&
        Math.abs(b.y - p.y) < 1.2,
    );
  }
  pop(x: number, y: number, text: string, color = "#ffdd75") {
    this.particles.push({ x, y, text, color, age: 0 });
  }
  private openBonusRoom(wallIndex: number) {
    const room = this.level.bonusRooms?.find((r) => r.wallIndex === wallIndex);
    if (room) this.message(tr("game.bonusOpened", { label: tx(room.label) }), 4);
  }
  isBonusCompleted(index: number) {
    // Existing hot-reloaded games can already have rewards from a prior visit.
    return this.completedBonus?.has(index) || this.level.bonusRooms?.[index]?.pickups
      .some((_, i) => this.collectedBonus.has(`${index}-${i}`)) || false;
  }
  private tryEnterBonus(input: Input, oldX: number) {
    if (this.bonus || this.bonusDoorCooldown > 0) return false;
    const p = this.player;
    const index = this.level.bonusRooms?.findIndex((room, roomIndex) => {
      if (this.isBonusCompleted(roomIndex)) return false;
      const wall = this.level.breakableWalls?.[room.wallIndex];
      if (!wall || !this.brokenWalls.has(room.wallIndex)) return false;
      const toward = Math.sign(wall.x-oldX);
      const walking = Math.abs(p.x-oldX) > 0.001 && Math.sign(p.x-oldX) === toward;
      return Math.abs(p.x-wall.x) < wall.w/2 + .7 && p.y + 1.35 > wall.y && p.y < wall.y+wall.h &&
        (walking || input.pressed.has("up") || input.pressed.has("action"));
    }) ?? -1;
    if (index < 0) return false;
    const source = this.level, room = source.bonusRooms![index];
    const sourceIndices = room.pickups.map((_, i)=>i).filter(i=>!this.collectedBonus.has(`${index}-${i}`));
    const world = { player: {...p,x:oldX}, enemies:this.enemies, animals:this.animals, collected:this.collected,
      letters:this.letters, usedBarrels:this.usedBarrels, thrown:this.thrown, enemyShots:this.enemyShots,
      checkpoint:this.checkpoint, companion:this.companion, trail:this.trail };
    const stage: Level = { id:source.id, name:room.label, subtitle:"game.bonusSubtitle", biome:"jungle",
      length:17, platforms:[{x:8.5,y:0,w:19,h:4.4},
        // A full-height solid entrance behind the player; exit remains at right.
        {x:0,y:10,w:1.5,h:10,kind:"stone"}], enemies:[], barrels:[],
      pickups:sourceIndices.map((i)=>({...room.pickups[i],x:5+i*2.5,y:1.05})),
      decors:[{x:13,y:1.5,kind:"sign",text:"game.bonusSign"}], tip:"game.bonusTip" };
    this.bonus = {index,stage,sourceIndices,world};
    this.player = {...p,x:2,y:0,vx:0,vy:0,grounded:true,carry:-1,cannon:-1,mount:-1,
      roll:0,rollJump:false,rollJumpMomentum:0,cartRebound:false,mountAttack:0,mountCharge:0,mountCharged:false,invincible:1};
    this.enemies=[];this.animals=[];this.collected=new Set();this.letters=new Set();this.usedBarrels=new Set();
    this.thrown=[];this.enemyShots=[];this.checkpoint={x:2,y:0};this.companion={x:.75,y:0,facing:1};this.trail=[];this.swap=null;
    this.sceneRevision++;this.cameraBounds=null;this.message(tx(stage.tip),5);this.onEvent("enter-cannon");
    input.pressed.clear(); input.released.clear();
    return true;
  }
  leaveBonus() {
    const visit = this.bonus;
    if (!visit) return;
    for (const pickup of this.collected) this.collectedBonus.add(`${visit.index}-${visit.sourceIndices[pickup]}`);
    const hp=this.player.hp, active=this.player.active;
    Object.assign(this,visit.world); this.bonus=null;
    (this.completedBonus ??= new Set()).add(visit.index);
    Object.assign(this.player,{hp,active,vx:0,vy:0,roll:0,rollJump:false,rollJumpMomentum:0,cartRebound:false,mountAttack:0,mountCharge:0,mountCharged:false,invincible:1.2});
    this.bonusDoorCooldown=1;this.sceneRevision++;this.cameraBounds=null;this.swap=null;
    this.message(tr("game.returnToLevel"),3);
  }
  private resolveBreakableWalls(p: Player, oldX: number) {
    const walls = this.level.breakableWalls;
    if (!walls) return;
    for (let i = 0; i < walls.length; i++) {
      if (this.brokenWalls.has(i)) continue;
      const wall = walls[i];
      const left = wall.x - wall.w / 2;
      const right = wall.x + wall.w / 2;
      const bottom = wall.y;
      const top = wall.y + wall.h;
      const overlap =
        p.x + 0.35 > left &&
        p.x - 0.35 < right &&
        p.y + 1.1 > bottom &&
        p.y < top - 0.65;
      if (!overlap) continue;
      if (p.roll > 0.12 || (this.mount?.kind === "rambi" && (p.mountAttack > 0 || Math.abs(p.vx) > 0.1))) {
        this.brokenWalls.add(i);
        this.onEvent("barrel-break");
        this.openBonusRoom(i);
        this.pop(wall.x, wall.y + wall.h * 0.5, tr("game.bonusBanner"), "#f5c98a");
        continue;
      }
      if ((p.x - oldX) * (wall.x - oldX) > 0) {
        p.x = oldX;
        p.vx = 0;
      }
    }
  }
  private breakWallsWithThrown() {
    const walls = this.level.breakableWalls;
    if (!walls) return;
    for (const barrel of this.thrown) {
      if (!barrel.active) continue;
      for (let i = 0; i < walls.length; i++) {
        if (this.brokenWalls.has(i)) continue;
        const wall = walls[i];
        if (
          Math.abs(barrel.x - wall.x) < wall.w / 2 + 0.5 &&
          barrel.y > wall.y - 0.5 &&
          barrel.y < wall.y + wall.h + 0.5
        ) {
          this.brokenWalls.add(i);
          barrel.active = false;
          this.onEvent("barrel-break");
          this.openBonusRoom(i);
        }
      }
    }
  }
  private updateItemCaches(p: Player, input: Input) {
    const caches = this.level.itemCaches;
    if (!caches) return;
    caches.forEach((cache, i) => {
      if (this.collectedCaches.has(i)) return;
      const dx = Math.abs(p.x - cache.x);
      const dy = Math.abs(p.y + 0.8 - cache.y);
      if (!this.revealedCaches.has(i)) {
        const slap =
          p.roll > 0.1 ||
          (input.pressed.has("action") && p.grounded && input.held.has("down"));
        if (slap && dx < 1.5 && dy < 1.8) {
          this.revealedCaches.add(i);
          this.onEvent("reveal");
          this.pop(cache.x, cache.y, "?", "#ffe08a");
        }
        return;
      }
      if (dx > 0.85 || dy > 1.2) return;
      this.collectedCaches.add(i);
      const reward = cache.reward;
      if (reward.kind === "letter") {
        this.pop(cache.x, cache.y, reward.letter, "#ffdf80");
        this.onEvent("letter");
      } else if (reward.kind === "balloon") {
        this.pop(cache.x, cache.y, "1UP", "#ff9fd0");
        this.onEvent("life");
      } else {
        const amount = reward.amount ?? 1;
        this.bananas += amount;
        this.levelBananas += amount;
        this.total += amount;
        this.pop(cache.x, cache.y, `+${amount}`);
        this.onEvent(amount > 1 ? "banana-bunch" : "banana");
      }
    });
  }
  private maybeSignHint(p: Player) {
    if (this.toastTimer > 0) return;
    for (const decor of this.level.decors ?? []) {
      if (decor.kind !== "sign" || !decor.text) continue;
      if (Math.abs(p.x - decor.x) < 2.2 && Math.abs(p.y - decor.y) < 2.5) {
        this.message(tx(decor.text), 3);
        return;
      }
    }
  }
  pause() {
    if (this.phase === "playing") this.phase = "paused";
    else if (this.phase === "paused") this.phase = "playing";
  }
  surface(p: Platform) {
    return p.kind === "moving"
      ? p.y + Math.sin(this.time * 1.1 + p.x) * (p.travel ?? 1.5)
      : p.y;
  }
  get mount() { return this.animals[this.player.mount]; }
  dismount(flee = false) {
    const p = this.player, buddy = this.mount;
    if (!buddy) return;
    buddy.state = flee ? "fleeing" : "idle";
    buddy.x = p.x; buddy.y = p.y; buddy.facing = p.facing;
    buddy.vx = flee ? p.facing * 6 : 0; buddy.vy = flee ? 4 : 0;
    buddy.timer = 0;
    p.y += ANIMAL_DESIGNS[buddy.kind].seat;
    if(this.level.originalTerrain === "coral") p.y=nearestCoralOpenY(p.x,p.y);
    p.vy = this.level.biome === "lagoon" ? 0 : 9;
    p.grounded = false; p.coyote = 0; p.buffer = 0;
    p.mount = -1; p.mountAttack = 0; p.mountCharge = 0; p.mountCharged = false; p.mountCooldown = 0.55;
    if (flee) p.invincible = 1.4;
    this.onEvent("jump");
    this.message(flee ? tr("game.catchBuddyFlee") : tr("game.catchBuddyMount"));
  }
  damage(fall = false) {
    const p = this.player;
    if (!fall && p.invincible > 0) return;
    if (fall && this.bonus) { this.leaveBonus(); return; }
    if (this.mount) {
      this.dismount(true);
      if (!fall) { this.onEvent("hurt"); return; }
    }
    this.onEvent("hurt");
    p.rollJumpMomentum = 0;
    if (!fall && p.hp === 2) {
      p.hp = 1;
      p.active = 1 - p.active;
      p.invincible = 2.3;
      p.vy = 6;
      p.vx = -p.facing * 3;
      p.roll = 0;
      p.carry = -1;
      this.pop(p.x, p.y + 2, tr("game.holdOn"), "#f6a4c9");
      return;
    }
    this.lives--;
    if (this.lives <= 0) {
      this.phase = "gameover";
      return;
    }
    Object.assign(p, {
      x: this.checkpoint.x,
      y: this.level.originalTerrain === "coral" ? nearestCoralOpenY(this.checkpoint.x,this.checkpoint.y) : this.checkpoint.y,
      grounded: this.level.biome !== "lagoon",
      buffer: 0, coyote: 0,
      vx: 0,
      vy: 0,
      hp: 1,
      invincible: 2.5,
      carry: -1,
      cannon: -1, cannonLock: -1, cannonTime: 0, launched: 0,
      cannonGravityDelay: 0, cannonControlDelay: 0, jumpDelay: 0,
      roll: 0, rollJump: false, rollJumpMomentum: 0, cartRebound: false, rollChain: 0, mount: -1, mountAttack: 0, mountCharge: 0, mountCharged: false, mountCooldown: 0.55,
    });
    this.trail = [];
    this.companion = { ...this.checkpoint, facing: 1 };
    // Rescue barrels become available again after a lost life.
    this.level.barrels.forEach((b, i) => {
      if (b.kind === "rescue") this.usedBarrels.delete(i);
    });
    this.message(tr("game.extraChance"));
  }
  cannonPosition(index:number,level=this.level) {
    const b=level.barrels[index];
    return b?cannonWorldPosition(b,b.motion?.activation==='always'?this.time:(this.cannonTimes[index]??0)):{x:0,y:0};
  }
  cannonAngle(index: number, level = this.level) {
    const b = level.barrels[index];
    if (!b) return 0.75;
    const aim = (b.angle ?? 0.75) + (b.rotationSpeed ? Math.sin(this.time * b.rotationSpeed) * 0.65 : 0);
    // The ROM fires discrete velocity vectors. Point the mesh at that actual
    // vector too, including while an oscillating cannon crosses an aim sector.
    const velocity = cannonLaunchVelocity(aim);
    return Math.atan2(velocity.vy, velocity.vx);
  }
  releaseAnimal(animal: Animal) {
    animal.state = "idle";
    this.pop(animal.x, animal.y + 1.8, tx(ANIMAL_DESIGNS[animal.kind].name), "#f9df93");
    this.onEvent("rescue");
    this.message(animal.kind === "enguarde" ? tr("game.releaseEnguarde") : tr("game.releaseMount", { name: tx(ANIMAL_DESIGNS[animal.kind].name) }), 5);
  }
  updateAnimals(input: Input, oldY: number, dt: number) {
    const p = this.player, water = this.level.biome === "lagoon";
    this.animals.forEach((a, i) => {
      a.timer += dt;
      if (a.state === "ridden") {
        a.x = p.x; a.y = p.y; a.facing = p.facing; a.vx = p.vx;
        return;
      }
      if (a.state === "fleeing" || a.state === "idle") {
        const lastX=a.x, lastY=a.y;
        if(a.state === "fleeing") a.x += a.vx*dt;
        if(!water) {
          a.vy-=28*dt; a.y+=a.vy*dt;
          if(this.level.originalTerrain) {
            const floor=this.supportAt(lastX,lastY,.2);
            const contact=resolveLandMotion(this.level.originalTerrain,lastX,lastY,a.x,a.y,floor!==null&&Math.abs(floor-lastY)<.2,a.vy);
            a.x=contact.x;a.y=contact.y;
            if(contact.blockedY)a.vy=0;
            if(contact.blockedX)a.vx*=-1;
          } else {
            const floor=this.supportAt(a.x,lastY,.2);
            if(floor!==null && a.vy<=0 && a.y<=floor && lastY>=floor-.2) {a.y=floor;a.vy=0;}
          }
        } else if(a.state === "fleeing") {
          a.y+=Math.sin(a.timer*5)*dt;
          if(this.level.originalTerrain === "coral") {
            const contact=resolveCoralMotion(lastX,lastY,a.x,a.y);
            a.x=contact.x;a.y=contact.y;
          }
        }
        if(a.state === "fleeing" && a.timer>1.25) {a.state="idle";a.vx=0;}
      }
      if (a.state === "crate") {
        if (Math.abs(p.x - a.x) < 0.9 && Math.abs(p.y - a.y) < 1.35 &&
          (p.roll > 0 || (p.vy < 0 && oldY >= a.y + 0.85) || water)) this.releaseAnimal(a);
        return;
      }
      if (p.mount >= 0 || p.mountCooldown > 0 || a.y < -7) return;
      const seat = ANIMAL_DESIGNS[a.kind].seat;
      const descending = p.vy <= 0 && oldY >= a.y + seat - 0.2 && p.y <= a.y + seat;
      if (Math.abs(p.x - a.x) < ANIMAL_DESIGNS[a.kind].width &&
        (water ? Math.abs(p.y - a.y) < 1.2 : descending)) {
        a.state = "ridden"; a.timer = 0;
        p.mount = i;
        p.y = this.level.originalTerrain === "coral" ? nearestCoralOpenY(a.x,a.y,ENGUARDE_SWIM_BODY.height) : a.y;
        a.y=p.y; p.vy = 0; p.grounded = !water;
        p.roll = 0; p.rollJump = false; p.rollJumpMomentum = 0; p.carry = -1; p.coyote = 0;
        this.onEvent("mount");
        this.message(`${tr("game.mountGreeting", { name: tx(ANIMAL_DESIGNS[a.kind].name) })} ${a.kind === "winky" ? tr("game.mountWinky") : a.kind === "expresso" ? tr("game.mountExpresso") : a.kind === "enguarde" ? tr("game.mountEnguarde") : tr("game.mountRambi")}`, 5);
      }
    });
  }
  finish() {
    if (this.phase !== "playing") return;
    this.phase = this.levelId === LEVELS.length - 1 ? "victory" : "clear";
    this.save.unlocked = Math.max(
      this.save.unlocked,
      Math.min(LEVELS.length - 1, this.levelId + 1),
    );
    const old = this.save.best[this.levelId];
    this.save.best[this.levelId] = {
      bananas: Math.max(old?.bananas ?? 0, this.levelBananas),
      letters: Math.max(old?.letters ?? 0, this.letters.size),
      time: Math.min(old?.time ?? Infinity, this.time),
    };
    this.onSave(this.save);
    this.onEvent("clear");
  }
  update(input: Input, dt = STEP) {
    if (this.phase !== "playing") return;
    // Fast Refresh preserves existing actors as well as the Game instance.
    // Migrate only the two new landing corridors in an already-open cart run.
    if(this.level.originalTerrain === "mineCart" && this.mineRecoveryLayout !== 1) {
      const layout=mineEncounterClearance(this.level.enemies);
      for(const bird of this.level.enemies.filter(e=>mineBirdHasCloseBee(e,this.level.enemies))) {
        for(const spec of layout.filter(e=>e.kind==='bee'&&e.pattern!=='necky'&&e.x>bird.x&&e.x-bird.x<12)) {
          const actor=this.enemies.find(e=>e.kind==='bee'&&e.pattern!=='necky'&&Math.abs(e.x-spec.x)<.65);
          if(actor){actor.originY=spec.y;actor.y=spec.y;actor.hoverAmplitude=0;}
        }
      }
      this.mineRecoveryLayout=1;
    }
    this.time += dt;
    this.bonusDoorCooldown = Math.max(0,this.bonusDoorCooldown-dt);
    this.toastTimer = Math.max(0, this.toastTimer - dt);
    this.particles.forEach((p) => {
      p.age += dt;
    });
    this.particles = this.particles.filter((p) => p.age < 1.3);
    const p = this.player,
      water = this.level.biome === "lagoon",
      cart =
        this.level.originalTerrain === "mineCart" ||
        (this.level.biome === "mine" && this.level.originalTerrain !== "cave");
    if (!cart || p.grounded || this.mount) p.cartRebound = false;
    p.invincible = Math.max(0, p.invincible - dt);
    p.launched = Math.max(0, p.launched - dt);
    if (p.cannonLock >= 0) {
      const source = this.level.barrels[p.cannonLock] && this.cannonPosition(p.cannonLock);
      if (!source || Math.hypot(p.x - source.x, p.y - source.y) > 1.7) p.cannonLock = -1;
    }
    p.roll = Math.max(0, p.roll - dt);
    p.mountAttack = Math.max(0, p.mountAttack - dt);
    p.mountCooldown = Math.max(0, p.mountCooldown - dt);
    p.recentRun = (input.held.has("run") || input.held.has("action")) && (input.held.has("left") || input.held.has("right")) ? 0 : p.recentRun + dt;
    if (p.roll === 0) { p.rollJump = false; p.rollChain = 0; }
    if (p.roll > 0) p.rollAngle += Math.abs(p.vx) * dt * 3.4;
    else p.rollAngle = 0;
    p.buffer = input.pressed.has("jump") ? (cart ? .22 : .13) : Math.max(0, p.buffer - dt);
    p.coyote = p.grounded ? 0.1 : Math.max(0, p.coyote - dt);
    if (input.pressed.has("swap") && this.mount) this.dismount();
    else if (
      input.pressed.has("swap") &&
      p.hp === 2 &&
      p.cannon < 0 &&
      !this.swap &&
      p.roll <= 0
    ) {
      p.active = 1 - p.active;
      this.swap = {
        remaining: TEAM_SWAP_DURATION,
        back: { ...this.companion },
      };
      this.onEvent("swap");
      this.pop(
        p.x,
        p.y + 2,
        tx(p.active ? L.buddies.violet : L.buddies.rose),
        p.active ? "#c0a2ff" : "#f6a4c9",
      );
    }
    if (this.swap) {
      this.swap.remaining -= dt;
      if (this.swap.remaining <= 0) {
        this.companion = {
          x: p.x - p.facing * 1.25,
          y: p.y,
          facing: p.facing,
        };
        this.swap = null;
      }
    }
    const swapping = !!this.swap;
    if (p.cannon >= 0) {
      const barrel = this.level.barrels[p.cannon];
      p.cannonTime += dt;
      this.cannonTimes[p.cannon]=(this.cannonTimes[p.cannon]??0)+dt;
      const position=this.cannonPosition(p.cannon);p.x=position.x;p.y=position.y;
      if (input.pressed.has("jump") || input.pressed.has("action") || (barrel.autoFire && p.cannonTime > 0.15)) {
        const angle = this.cannonAngle(p.cannon);
        const launch = cannonLaunchVelocity(angle);
        const mult =
          (barrel.launchMultiplier ?? CANNON_TEMPLATE.launchMultiplier) /
          CANNON_TEMPLATE.launchMultiplier;
        p.cannonLock = p.cannon;
        p.launched = cannonMomentumDuration(barrel);
        p.cannonGravityDelay =
          barrel.cannonGravityDelay ?? CANNON_TEMPLATE.gravityDelayCounter;
        p.cannonControlDelay =
          barrel.cannonControlDelay ?? CANNON_TEMPLATE.controlDelayCounter;
        p.grounded = false;
        p.coyote = 0;
        p.roll = 0;
        p.rollJump = false;
        p.rollJumpMomentum = 0;
        p.vx = launch.vx * mult;
        p.vy = launch.vy * mult;
        p.cannon = -1;
        p.invincible = 1;
        p.buffer = 0;
        p.jumpDelay = 0;
        this.onEvent("cannon");
      } else return;
    }
    const carryingAtStart = p.carry >= 0;
    let actionUsed = false;
    if (input.pressed.has("action") && this.mount) {
      const kind = this.mount.kind;
      if (kind === "rambi" || kind === "enguarde") {
        p.mountAttack = 0.32; p.mountCharged = false; p.mountCharge = 0;
        this.onEvent("roll");
      }
      actionUsed = true;
    }
    const chargeable = this.mount?.kind === "rambi" || this.mount?.kind === "enguarde";
    const quickSwimAttack = this.mount?.kind === "enguarde" && input.pressed.has("jump");
    if (quickSwimAttack) {
      // Immediate, repeatable short thrust; cancel any prepared long charge.
      p.mountCharge = 0; p.mountCharged = false; p.mountAttack = .32;
      this.onEvent("roll");
    }
    if (chargeable && !quickSwimAttack && input.held.has("action")) {
      p.mountCharge = Math.min(.75,p.mountCharge+dt);
      if (p.mountCharge > .18) p.mountAttack = 0;
    } else if (chargeable && p.mountCharge > 0) {
      if (p.mountCharge >= .65) {
        p.mountAttack = .85; p.mountCharged = true; this.onEvent("roll");
      }
      p.mountCharge = 0;
    }
    if (p.mountAttack === 0) p.mountCharged = false;
    if (input.pressed.has("action") && !this.mount && !cart) {
      const crate = this.animals.find(b => b.state === "crate" &&
        Math.abs(b.x - p.x) < 1.65 && Math.abs(b.y - p.y) < 1.8);
      if (crate) { this.releaseAnimal(crate); actionUsed = true; }
    }
    if (!actionUsed && !water && !cart && p.launched === 0 && !swapping) {
      const releaseThrow =
        (!input.tapAction && input.released.has("action")) ||
        ((input.clickMode || input.tapAction) && input.pressed.has("action"));
      const barrelNear = this.throwableBarrelIndex(p);
      if (carryingAtStart && releaseThrow) {
        if (p.grounded && input.held.has("down")) {
          this.usedBarrels.delete(p.carry);
          p.carry = -1;
          this.onEvent("place");
        } else {
          this.thrown.push({
            x: p.x + p.facing * 0.7,
            y: p.y + 1,
            vx: p.facing * rawSpeed(THROW.horizontalInitialMagnitudeRaw),
            vy: rawSpeed(THROW.verticalRaw),
            active: true,
          });
          p.carry = -1;
          this.onEvent("throw");
        }
      } else if (!carryingAtStart) {
        const pickupBarrel =
          input.clickMode || input.tapAction
            ? input.pressed.has("action") && barrelNear >= 0
            : input.held.has("action") && barrelNear >= 0;
        if (pickupBarrel) {
          p.carry = barrelNear;
          this.usedBarrels.add(barrelNear);
          this.onEvent("pickup");
        } else if (
          input.pressed.has("action") &&
          p.grounded &&
          p.roll === 0 &&
          barrelNear < 0
        ) {
          p.roll = 0.48;
          p.rollJump = true;
          p.rollChain = 0;
          p.rollAngle = 0;
          p.rollFacing =
            (Number(input.held.has("right")) - Number(input.held.has("left"))) ||
            p.facing;
          p.facing = p.rollFacing;
          const base =
            p.recentRun < BUDDY_PHYSICS.recentRunSeconds
              ? BUDDY_PHYSICS.rollRunning
              : input.held.has("right") || input.held.has("left")
                ? BUDDY_PHYSICS.rollMoving
                : BUDDY_PHYSICS.rollStill;
          p.rollSpeed = base * (p.active ? 1 : 1.125);
          this.onEvent("roll");
        }
      }
    }
    if (p.cannonControlDelay > 0) p.cannonControlDelay--;
    const direction =
      Number(input.held.has("right")) - Number(input.held.has("left"));
    if (direction && p.roll === 0 && p.mountAttack === 0) p.facing = direction;
    const buddy = this.mount, design = buddy && ANIMAL_DESIGNS[buddy.kind];
    const speed =
      (input.held.has("run") || input.held.has("action") ? 5.625 : 3.75) *
      (p.active ? 1.125 : 1);
    if (swapping) p.vx = approach(p.vx, 0, 52 * dt);
    else if (cart) p.vx = 8.5;
    else if (p.cannonControlDelay > 0) {
      /* ROM cannon flight: ignore steering until the control counter expires. */
    } else if (p.launched > 0) {
      // Releasing the fire button must not brake a cannon shot in mid-flight.
      // Steering is available only after the imported control delay expires.
      if (direction) p.vx = approach(p.vx,direction*Math.max(Math.abs(p.vx),speed),12*dt);
    }
    else if (!buddy && !water && p.rollJumpMomentum !== 0 && !p.grounded) {
      // A roll jump carries its launch momentum; releasing/reversing brakes it.
      if (direction === Math.sign(p.rollJumpMomentum)) p.vx = p.rollJumpMomentum;
      else {
        p.rollJumpMomentum = approach(p.rollJumpMomentum, direction * speed, 18 * dt);
        p.vx = p.rollJumpMomentum;
        if (Math.abs(p.rollJumpMomentum) <= speed) p.rollJumpMomentum = 0;
      }
    }
    else if (chargeable && p.mountCharge > .18 && !direction) p.vx = approach(p.vx,0,60*dt);
    else if (p.roll > 0) p.vx = p.rollFacing * p.rollSpeed;
    else if (buddy?.kind === "enguarde" && p.mountAttack > 0) p.vx = p.facing * (p.mountCharged ? 18 : BUDDY_PHYSICS.stabSpeed);
    else if (buddy?.kind === "rambi" && p.mountAttack > 0) p.vx = p.facing * (p.mountCharged ? 16 : 9);
    else if (p.invincible < 1.9) {
      const swimSpeed =
        water && this.level.originalTerrain === "coral"
          ? ROM_SWIM_HORIZONTAL
          : 4.8;
      const target =
        direction *
        (design
          ? input.held.has("run") || input.held.has("action")
            ? design.run
            : design.walk
          : water
            ? swimSpeed
            : speed);
      // Mounts, swimming and ice retain their distinct movement handling.
      p.vx = !buddy && !water && this.level.biome !== "snow"
        ? approachFootVelocity(p.vx, target)
        : approach(p.vx, target, (this.level.biome === "snow" ? 8 : p.grounded ? 38 : 19) * dt);
    }
    if (water) {
      if (buddy?.kind === "enguarde") {
        if (input.pressed.has("jump") || input.pressed.has("action")) p.vy = 0;
        const vertical = Number(input.held.has("up")) - Number(input.held.has("down"));
        p.vy = approach(p.vy, vertical * 5, 24 * dt);
      } else {
      const coralSwim = this.level.originalTerrain === "coral";
      const sink = coralSwim ? ROM_SWIM_SINK : 7;
      const rise = coralSwim ? ROM_SWIM_RISE : 4.3;
      const dive = coralSwim ? ROM_SWIM_DIVE : 4;
      const idleSink = coralSwim ? ROM_SWIM_IDLE_SINK : 1.2;
      if (input.held.has("down")) {
        p.vy = -dive;
      } else if (input.held.has("jump") || input.held.has("up")) {
        p.vy = approach(p.vy, rise, 32 * dt);
        if (coralSwim) p.vy -= sink * 0.22 * dt;
        else p.vy -= sink * dt;
      } else if (coralSwim) {
        p.vy = approach(p.vy, -idleSink, 16 * dt);
      } else {
        p.vy -= sink * dt;
      }
      p.vy = clamp(p.vy, -dive, rise);
      }
    } else {
      if (p.jumpDelay > 0) {
        p.jumpDelay--;
        if (p.jumpDelay === 0 && (p.coyote > 0 || p.rollJump)) {
          p.vy = design ? design.jump : rawSpeed(ROM.jump[p.active]);
          p.rollJumpMomentum = p.rollJump ? p.vx : 0;
          p.rollJump = false;
          p.roll = 0;
          p.grounded = false;
          p.coyote = 0;
          this.onEvent("jump");
        }
      } else if (
        !swapping &&
        p.buffer > 0 &&
        (p.coyote > 0 || p.rollJump)
      ) {
        p.buffer = 0;
        if (p.rollJump) {
          p.vy = design ? design.jump : rawSpeed(ROM.jump[p.active]);
          p.rollJumpMomentum = p.rollJump ? p.vx : 0;
          p.rollJump = false;
          p.roll = 0;
          p.grounded = false;
          p.coyote = 0;
          this.onEvent("jump");
        } else p.jumpDelay = JUMP_IMPULSE_DELAY_FRAMES;
      }
      if (p.cannonGravityDelay > 0) p.cannonGravityDelay--;
      else {
        const gravity =
          cart && p.cartRebound ? ROM.held[0] : input.held.has("jump") ? buddy ? BUDDY_PHYSICS.heldGravity : ROM.held[p.active] : ROM.gravity;
        p.vy = Math.max(
          -rawSpeed(ROM.terminal),
          p.vy - rawAcceleration(gravity) * dt,
        );
      }
      // Expresso flutters while jump is tapped/held in the air, never climbs.
      if (buddy?.kind === "expresso" && !p.grounded && p.vy < 0 && input.held.has("jump"))
        p.vy = Math.max(p.vy, -.65);
    }
    const wasGrounded = p.grounded;
    const oldY = p.y,
      oldX = p.x;
    p.x = clamp(p.x + p.vx * dt, -2, this.level.length + 1);
    if (this.level.breakableWalls?.length) this.resolveBreakableWalls(p, oldX);
    if (this.originalRoute) {
      const minX = 0;
      if (p.x < minX) {
        p.x = minX;
        p.vx = Math.max(0, p.vx);
      }
    }
    if (this.tryEnterBonus(input,oldX)) return;
    p.y += p.vy * dt;
    p.grounded = false;
    if (water && this.level.originalTerrain === "coral") {
      if (p.y > CORAL_WATER_SURFACE_Y) {
        p.y = CORAL_WATER_SURFACE_Y;
        p.vy = Math.min(0, p.vy);
      }
    } else if (water && p.y > 6) {
      p.y = 6;
      p.vy = Math.min(0, p.vy);
    }
    if (this.level.originalTerrain && this.level.originalTerrain !== "coral") {
      const contact = resolveLandMotion(this.level.originalTerrain, oldX, oldY, p.x, p.y, wasGrounded, p.vy);
      p.x = contact.x; p.y = contact.y; p.grounded = contact.grounded;
      if(contact.blockedX) { p.vx = 0; p.rollJumpMomentum = 0; p.mountAttack = 0; p.mountCharged = false; }
      if(contact.blockedY) p.vy = 0;
    } else if (this.level.originalTerrain === "coral") {
      const swimBody = this.mount ? ENGUARDE_SWIM_BODY : undefined;
      const motion = resolveCoralMotion(oldX, oldY, p.x, p.y, swimBody);
      if(Math.abs(motion.x - p.x) > 0.00001) p.vx = 0;
      if(Math.abs(motion.y - p.y) > 0.00001) p.vy = 0;
      p.x = clamp(motion.x,.3,CORAL_WORLD_WIDTH-.3);
      p.y = clamp(motion.y, CORAL_WATER_FLOOR_Y, CORAL_WATER_SURFACE_Y);
      if(p.y === CORAL_WATER_FLOOR_Y && p.vy < 0) p.vy = 0;
      p.grounded = false;
    } else for (const platform of this.level.platforms) {
      const top = this.surface(platform),
        left = platform.x - platform.w / 2,
        right = platform.x + platform.w / 2;
      if (
        p.x + 0.3 > left &&
        p.x - 0.3 < right &&
        p.vy <= 0 &&
        oldY >= top - 0.18 &&
        p.y <= top
      ) {
        p.y = top;
        p.vy = 0;
        p.grounded = true;
      } else if (
        platform.h > 2 &&
        p.y + 1.3 > top - platform.h &&
        p.y < top - 0.22
      ) {
        if (oldX + 0.3 <= left && p.x + 0.3 > left) {
          p.x = left - 0.3;
          p.vx = 0;
        }
        if (oldX - 0.3 >= right && p.x - 0.3 < right) {
          p.x = right + 0.3;
          p.vx = 0;
        }
      }
    }
    if (p.y < -8) {
      this.damage(true);
      return;
    }
    if (p.grounded) { p.launched = 0; p.rollJumpMomentum = 0; p.cartRebound = false; }
    this.updateAnimals(input, oldY, dt);
    if (!swapping) {
      this.trail.push({ x: p.x, y: p.y, facing: p.facing });
      if (this.trail.length > 22) {
        const trail = this.trail.shift()!;
        this.companion = {
          ...trail,
          x:
            Math.abs(trail.x - p.x) < 1.25
              ? p.x - trail.facing * 1.25
              : trail.x,
        };
      }
    }
    this.updateItemCaches(p, input);
    this.maybeSignHint(p);
    // Bonus rewards are collected by normal pickup handling in their own scene.
    this.level.pickups.forEach((item, i) => {
      if (
        this.collected.has(i) ||
        Math.abs(p.x - item.x) > 0.85 ||
        Math.abs(p.y + 0.85 + (this.mount ? ANIMAL_DESIGNS[this.mount.kind].seat * 0.45 : 0) - item.y) > (this.mount ? 1.5 : 1)
      )
        return;
      this.collected.add(i);
      if (item.kind === "letter") {
        this.letters.add(i);
        this.pop(item.x, item.y, item.letter ?? "", "#ffdf80");
        this.onEvent("letter");
        if (this.letters.size === this.letterWord.length) {
          this.lives++;
          this.pop(p.x, p.y + 3, tr("game.letterLife", { word: this.letterWord }));
          this.onEvent("life");
        }
      } else if (item.kind === "balloon") {
        this.lives += item.amount ?? 1;
        this.pop(item.x, item.y, tr("game.extraLifeCount", { count: item.amount ?? 1 }));
        this.onEvent("life");
      } else {
        const amount=item.amount ?? 1;
        this.bananas+=amount;
        this.levelBananas+=amount;
        this.total+=amount;
        this.onEvent(amount>1 ? "banana-bunch" : "banana");
        if (this.bananas >= ROM.bananas) {
          this.bananas -= ROM.bananas;
          this.lives++;
          this.pop(p.x, p.y + 2, tr("game.extraLife"));
          this.onEvent("life");
        }
      }
    });
    this.level.barrels.forEach((b, i) => {
      const position=b.kind==='cannon'?this.cannonPosition(i):b;
      if (
        this.usedBarrels.has(i) ||
        Math.abs(position.x - p.x) > 0.8 ||
        (b.kind === "cannon"
          ? position.y < p.y - .75 || position.y > p.y + 2.1
          : Math.abs(position.y - p.y) > 1.1)
      )
        return;
      if (b.kind === "rescue") {
        p.hp = 2;
        this.usedBarrels.add(i);
        this.onEvent("rescue");
        this.pop(b.x, b.y + 2, tr("game.together"), "#f4a9d5");
      }
      if (b.kind === "checkpoint") {
        this.checkpoint = { x: b.x, y: b.y };
        this.usedBarrels.add(i);
        this.onEvent("checkpoint");
        this.message(tr("game.checkpoint"));
        this.pop(b.x, b.y + 2, "✓", "#b5e7a0");
      }
      if (b.kind === "cannon" && p.cannonLock !== i && !this.mount) {
        p.cannon = i; p.cannonTime = 0; p.launched = 0;
        p.carry = -1; p.roll = 0; p.rollJump = false; p.rollJumpMomentum = 0;
        this.onEvent("enter-cannon");
        p.x = position.x;
        p.y = position.y;
        p.vx = 0;
        p.vy = 0;
        this.message(b.autoFire ? tr("game.cannonAuto") : tr("game.cannonManual"));
      }
    });
    this.breakWallsWithThrown();
    this.thrown.forEach((b) => {
      if (!b.active) return;
      const oldBarrelX=b.x, oldBarrelY=b.y, rolling=b.vy===0;
      const targetVx = Math.sign(b.vx || p.facing) * THROW_TARGET_VX;
      b.vx = approach(
        b.vx,
        targetVx,
        rawSpeed(THROW.horizontalInitialMagnitudeRaw) * 2.2 * dt,
      );
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vy -= 12 * dt;
      if(this.level.originalTerrain && this.level.originalTerrain !== "coral") {
        const contact=resolveLandMotion(this.level.originalTerrain,oldBarrelX,oldBarrelY-.5,b.x,b.y-.5,rolling,b.vy,{radius:.45,height:.9});
        b.x=contact.x;b.y=contact.y+.5;
        if(contact.blockedY) b.vy=0;
        if(contact.blockedX) b.active=false;
      } else {
        const floor=this.supportAt(b.x,oldBarrelY-.5,.2);
        if(floor!==null && b.vy<0 && b.y<=floor+.5 && oldBarrelY>=floor+.3) {
          b.y=floor+.5;b.vy=0;
        }
      }
      if (b.y < -6 || Math.abs(b.x - p.x) > 30) b.active = false;
    });
    this.thrown = this.thrown.filter((b) => b.active);
    this.enemyShots.forEach((shot) => {
      if (!shot.active) return;
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.vy -= rawAcceleration(NECKY_NUT.gravityRawPerFrame) * dt;
      if (shot.y < -8 || Math.abs(shot.x - p.x) > 35) shot.active = false;
      for (const barrel of this.thrown) {
        if (
          barrel.active &&
          Math.abs(barrel.x - shot.x) < 0.55 &&
          Math.abs(barrel.y - shot.y) < 0.55
        ) {
          shot.active = false;
          barrel.active = false;
        }
      }
      if (
        shot.active &&
        p.invincible <= 0 &&
        Math.abs(p.x - shot.x) < 0.55 &&
        p.y + 1.1 > shot.y &&
        p.y < shot.y + 0.45
      ) {
        shot.active = false;
        this.damage();
      }
    });
    this.enemyShots = this.enemyShots.filter((s) => s.active);
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (!enemySimulationActive(this, enemy)) continue;
      const previousEnemyY = enemy.y, previousEnemyX = enemy.x;
      enemy.timer += dt;
      enemy.hurt = Math.max(0, enemy.hurt - dt);
      if (enemy.kind === "boss") {
        this.bossBattle ??= createBossBattle(enemy);
        this.bossProjectiles ??= [];
        updateBossBattle(this.bossBattle,enemy,this.bossProjectiles,dt,name=>this.onEvent(name));
        if(this.bossBattle.phase==='dead'&&this.bossBattle.phaseTime>1.5){enemy.alive=false;this.finish();continue;}
      } else if (enemy.pattern === "necky") {
        enemy.x = enemy.min;
        enemy.vx = 0;
        enemy.y = enemy.originY + Math.sin(enemy.timer * 1.55) * 0.42;
        if (enemy.throwsNuts && enemy.alive) {
          enemy.shootCooldown -= dt;
          const dx = p.x - enemy.x;
          if (
            enemy.shootCooldown <= 0 &&
            Math.abs(dx) < 22 &&
            Math.abs(dx) > 0.6 &&
            Math.abs(p.y - enemy.y) < 5
          ) {
            const toward = Math.sign(dx) || 1;
            this.enemyShots.push({
              x: enemy.x,
              y: enemy.y + 0.85,
              vx: toward * Math.abs(rawSpeed(NECKY_NUT.nutVxRaw)),
              vy: rawSpeed(NECKY_NUT.nutVyRaw),
              active: true,
            });
            enemy.shootCooldown = NECKY_SHOOT_PERIOD;
            this.onEvent("necky-shot");
          }
        }
      } else if (enemy.kind === "bee" || water) {
        enemy.x += enemy.vx * dt;
        if(enemy.x < enemy.min || enemy.x > enemy.max) {
          enemy.x = clamp(enemy.x, enemy.min, enemy.max); enemy.vx *= -1;
        }
        enemy.y = enemy.originY + Math.sin(enemy.timer * 2) * (enemy.hoverAmplitude ?? .6);
        if(water) {
          enemy.y = clamp(enemy.y, CORAL_WATER_FLOOR_Y, CORAL_WATER_SURFACE_Y - ENEMY_DESIGNS[enemy.kind].height * 0.5);
          if(this.level.originalTerrain === "coral") {
            const contact = resolveCoralMotion(previousEnemyX,previousEnemyY,enemy.x,enemy.y, { radius: ENEMY_DESIGNS[enemy.kind].width*0.6, height: ENEMY_DESIGNS[enemy.kind].height });
            if(Math.abs(contact.x-enemy.x)>0.00001) enemy.vx *= -1;
            enemy.x=contact.x; enemy.y=contact.y;
          }
        }
      } else this.groundEnemy(enemy, dt);
      if(!enemy.alive) continue;
      const boss = enemy.kind === "boss",
        height = ENEMY_DESIGNS[enemy.kind].height,
        width = ENEMY_DESIGNS[enemy.kind].width;
      let hit = false;
      if(boss && this.bossBattle && !bossAcceptsHit(this.bossBattle))continue;
      for (const barrel of this.thrown) {
        if (
          barrel.active &&
          Math.abs(barrel.x - enemy.x) < width + 0.6 &&
          Math.abs(barrel.y - enemy.y - height / 2) < height / 2 + 0.5
        ) {
          hit = true;
          barrel.active = false;
        }
      }
      if (
        Math.abs(p.x - enemy.x) < width + (this.mount ? ANIMAL_DESIGNS[this.mount.kind].width : 0.3) &&
        p.y <= enemy.y + height &&
        p.y + (water ? this.mount ? ENGUARDE_SWIM_BODY.height : .95 : 1.35 + (this.mount ? ANIMAL_DESIGNS[this.mount.kind].seat : 0)) > enemy.y
      ) {
        const mount = this.mount;
        const mountHit = !!mount && !boss && (
          (mount.kind === "rambi" && enemy.kind !== "bee" && (p.facing * (enemy.x - p.x) > -0.2)) ||
          (mount.kind === "enguarde" && p.mountAttack > 0 && p.facing * (enemy.x - p.x) > -0.2) ||
          (mount.kind === "winky" && p.vy < -0.5 && oldY >= enemy.y + height - 0.4)
        );
        const strideOver = mount?.kind === "expresso" && enemy.kind === "beetle" && enemy.y <= p.y + 0.1;
        const spiked = enemy.kind === "bee" && enemy.pattern !== "necky";
        const stomp = !mount && !water && p.vy < -0.5 &&
          oldY >= previousEnemyY + height - 0.18;
        const roll =
          p.roll > 0 &&
          !spiked &&
          !boss;
        if (mountHit) {
          hit = true;
          if (mount?.kind === "winky") p.vy = 13.5;
        } else if (strideOver) { /* Expresso steps over small ground enemies. */ }
        else if (
          stomp &&
          !spiked &&
          (enemy.kind !== "armored" || p.active === 0)
        ) {
          // A protected head still bounces the player safely; only an exposed
          // boss loses health. Side/underside contact retains normal damage.
          hit = !boss || enemy.vulnerable;
          p.y = enemy.y + height;
          p.grounded = false;
          p.vy = rawSpeed(ROM.bounce[p.active]);
          if(this.level.originalTerrain === "mineCart" && mineBirdHasCloseBee(enemy,this.level.enemies)) {
            p.vy = Math.max(p.vy,16); p.cartRebound = true;
          }
          if(cart && !boss) p.invincible = Math.max(p.invincible,.18);
          this.onEvent("bounce");
        } else if (roll) {
          hit = true;
          p.rollChain++;
          p.rollSpeed = Math.min(BUDDY_PHYSICS.chainCap, p.rollSpeed + BUDDY_PHYSICS.chainIncrement);
          p.roll = Math.max(p.roll, 0.32);
        }
        else if (!hit && enemy.hurt <= 0) this.damage();
      }
      if (hit && enemy.hurt <= 0) {
        enemy.hp--;
        enemy.hurt = 1;
        this.onEvent("stomp");
        this.pop(enemy.x, enemy.y + height, boss ? `${BOSS_MAX_HITS - enemy.hp} / ${BOSS_MAX_HITS}` : "★");
        if(boss && this.bossBattle)registerBossHit(this.bossBattle,enemy,this.bossProjectiles);
        else if (enemy.hp <= 0) enemy.alive = false;
      }
    }
    if(this.bossBattle){
      p.x=clamp(p.x,1,this.level.length-1);
      for(const shot of this.bossProjectiles){
        if(shot.active&&shot.warning<=0&&Math.abs(p.x-shot.x)<shot.width+.3&&p.y<shot.y+shot.height/2&&p.y+1.35>shot.y-shot.height/2){this.damage();}
      }
      this.bossProjectiles=this.bossProjectiles.filter(shot=>shot.active);
    }
    const zone = this.level.finishZone;
    if (this.bonus && p.x >= this.level.length - 2) {
      this.leaveBonus();
    } else if (zone) {
      if (
        p.x >= zone.x - zone.w / 2 &&
        p.x <= zone.x + zone.w / 2 &&
        p.y >= zone.y - 0.6 &&
        p.y <= zone.y + zone.h
      ) {
        this.finish();
      }
    } else if (this.levelId !== LEVELS.length - 1 && p.x >= this.level.length - 2) {
      this.finish();
    }
    input.pressed.clear();
    input.released.clear();
  }
}
