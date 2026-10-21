import { BUDDY_PHYSICS, ANIMAL_DESIGNS, type Animal } from "./animals";
import { ROM_JUNGLE, ORIGINAL_JUNGLE_ORIGIN } from "./originalJungle";
import { query as originalTerrain } from "./originalTerrain";
import { ENEMY_DESIGNS } from "./enemies";
import { LEVELS, type EnemySpec, type Platform } from "./levels";
import evidence from "../../reference/rom-analysis.json";
import playerEvidence from "../../reference/player-states.json";

export const STEP = 1 / 60;
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
const WORLD_PIXELS = 32;
const rawSpeed = (raw: number) => ((raw / 256) * 60) / WORLD_PIXELS;
const rawAcceleration = (raw: number) => rawSpeed(raw) * 60;
export type Key =
  "left" | "right" | "jump" | "action" | "swap" | "run" | "up" | "down";
export type Phase =
  "title" | "playing" | "paused" | "map" | "clear" | "gameover" | "victory";
export interface Input {
  held: Set<Key>;
  pressed: Set<Key>;
}
export interface Enemy extends EnemySpec {
  originY: number;
  vx: number;
  alive: boolean;
  hp: number;
  vy: number;
  timer: number;
  hurt: number;
  vulnerable: boolean;
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
  rollSpeed: number;
  rollFacing: number;
  rollChain: number;
  rollAngle: number;
  recentRun: number;
  mount: number;
  mountAttack: number;
  mountCooldown: number;
  carry: number;
  cannon: number;
  cannonLock: number;
  cannonTime: number;
  launched: number;
  coyote: number;
  buffer: number;
}
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
});
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
  originalRoute = false;
  lives = 5;
  bananas = 0;
  total = 0;
  levelBananas = 0;
  letters = new Set<number>();
  collected = new Set<number>();
  usedBarrels = new Set<number>();
  enemies: Enemy[] = [];
  animals: Animal[] = [];
  particles: Particle[] = [];
  thrown: Thrown[] = [];
  player!: Player;
  time = 0;
  checkpoint = { x: 3, y: 0 };
  trail: { x: number; y: number; facing: number }[] = [];
  companion = { x: 1.3, y: 0, facing: 1 };
  toast = "";
  toastTimer = 0;
  save: Save;
  onEvent: (name: string) => void = () => {};
  onSave: (save: Save) => void = () => {};
  constructor(save = defaultSave()) {
    this.save = save;
    this.load(0, "title");
  }
  get level() {
    return this.originalRoute && this.levelId === 0 ? ROM_JUNGLE : LEVELS[this.levelId];
  }
  get letterWord() { return this.level.letterWord ?? "GOONK"; }
  floorAt(x:number,y:number) {
    if(this.level.originalTerrain === "jungle") return originalTerrain(x,y,ORIGINAL_JUNGLE_ORIGIN)?.floorY ?? null;
    let top:number|null=null;
    for(const platform of this.level.platforms) {
      const floor=this.surface(platform);
      if(Math.abs(x-platform.x)<platform.w/2 && floor<=y+0.2 && (top===null||floor>top))top=floor;
    }
    return top;
  }
  load(id: number, phase: Phase = "playing") {
    this.levelId = clamp(id, 0, LEVELS.length - 1);
    this.phase = phase;
    this.time = 0;
    this.levelBananas = 0;
    this.letters = new Set();
    this.collected = new Set();
    this.usedBarrels = new Set();
    this.particles = [];
    this.thrown = [];
    this.trail = [];
    const floor = this.level.start?.y ?? this.level.platforms[0].y;
    const startX = this.level.start?.x ?? 3;
    this.checkpoint = { x: startX, y: floor };
    this.player = {
      x: startX,
      y: floor,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: true,
      active: 0,
      hp: 2,
      invincible: 0,
      roll: 0,
      rollJump: false, rollSpeed: 0, rollFacing: 1, rollChain: 0, rollAngle: 0, recentRun: 1,
      mount: -1, mountAttack: 0, mountCooldown: 0,
      carry: -1,
      cannon: -1, cannonLock: -1, cannonTime: 0, launched: 0,
      coyote: 0.1,
      buffer: 0,
    };
    this.animals = (this.level.animals ?? []).map(spawn => ({
      ...spawn, state: "crate", vx: 0, vy: 0, facing: 1, timer: 0,
    }));
    this.companion = { x: startX - 1.8, y: floor, facing: 1 };
    this.enemies = this.level.enemies.map((spec, i) => ({
      ...spec,
      originY: spec.y,
      vx: (i % 2 ? 1 : -1) * (spec.kind === "croc" ? 1.8 : 1.25),
      alive: true,
      hp: spec.kind === "boss" ? 5 : 1,
      vy: 0,
      timer: 0,
      hurt: 0,
      vulnerable: false,
    }));
    this.message(this.level.tip, 6);
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
  pop(x: number, y: number, text: string, color = "#ffdd75") {
    this.particles.push({ x, y, text, color, age: 0 });
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
    p.vy = this.level.biome === "lagoon" ? 0 : 9;
    p.grounded = false; p.coyote = 0; p.buffer = 0;
    p.mount = -1; p.mountAttack = 0; p.mountCooldown = 0.55;
    if (flee) p.invincible = 1.4;
    this.onEvent("jump");
    this.message(flee ? "Rattrape ton compagnon !" : "Saute sur son dos pour remonter.");
  }
  damage(fall = false) {
    const p = this.player;
    if (!fall && p.invincible > 0) return;
    if (this.mount) {
      this.dismount(true);
      if (!fall) { this.onEvent("hurt"); return; }
    }
    this.onEvent("hurt");
    if (!fall && p.hp === 2) {
      p.hp = 1;
      p.active = 1 - p.active;
      p.invincible = 2.3;
      p.vy = 6;
      p.vx = -p.facing * 3;
      p.roll = 0;
      p.carry = -1;
      this.pop(p.x, p.y + 2, "Tiens bon !", "#f6a4c9");
      return;
    }
    this.lives--;
    if (this.lives <= 0) {
      this.phase = "gameover";
      return;
    }
    Object.assign(p, {
      x: this.checkpoint.x,
      y: this.checkpoint.y,
      vx: 0,
      vy: 0,
      hp: 1,
      invincible: 2.5,
      carry: -1,
      cannon: -1, cannonLock: -1, cannonTime: 0, launched: 0,
      roll: 0, rollJump: false, rollChain: 0, mount: -1, mountAttack: 0, mountCooldown: 0.55,
    });
    this.trail = [];
    this.companion = { ...this.checkpoint, facing: 1 };
    // Rescue barrels become available again after a lost life.
    this.level.barrels.forEach((b, i) => {
      if (b.kind === "rescue") this.usedBarrels.delete(i);
    });
    this.message(
      "Une nouvelle chance. Retrouve ton amie dans un tonneau rose !",
    );
  }
  cannonAngle(index: number, level = this.level) {
    const b = level.barrels[index];
    if (!b) return 0.75;
    return (b.angle ?? 0.75) + (b.rotationSpeed ? Math.sin(this.time * b.rotationSpeed) * 0.65 : 0);
  }
  releaseAnimal(animal: Animal) {
    animal.state = "idle";
    this.pop(animal.x, animal.y + 1.8, ANIMAL_DESIGNS[animal.kind].name, "#f9df93");
    this.onEvent("rescue");
    this.message(animal.kind === "enguarde" ? "Enguarde : approche pour monter. Action pour le rostre, joystick pour nager." : `${ANIMAL_DESIGNS[animal.kind].name} : saute sur son dos. Changer pour descendre.`, 5);
  }
  updateAnimals(input: Input, oldY: number, dt: number) {
    const p = this.player, water = this.level.biome === "lagoon";
    this.animals.forEach((a, i) => {
      a.timer += dt;
      if (a.state === "ridden") {
        a.x = p.x; a.y = p.y; a.facing = p.facing; a.vx = p.vx;
        return;
      }
      if (a.state === "fleeing") {
        const lastY = a.y;
        a.x += a.vx * dt;
        if (!water) { a.vy -= 28 * dt; a.y += a.vy * dt; }
        else a.y += Math.sin(a.timer * 5) * dt;
        for (const platform of this.level.platforms) {
          const top = this.surface(platform);
          if (a.x > platform.x - platform.w / 2 && a.x < platform.x + platform.w / 2 &&
            a.vy <= 0 && lastY >= top - 0.2 && a.y <= top) { a.y = top; a.vy = 0; }
        }
        if (a.timer > 1.25) { a.state = "idle"; a.vx = 0; }
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
        p.mount = i; p.y = a.y; p.vy = 0; p.grounded = !water;
        p.roll = 0; p.rollJump = false; p.carry = -1; p.coyote = 0;
        this.onEvent("mount");
        this.message(`${ANIMAL_DESIGNS[a.kind].name} ! ${a.kind === "winky" ? "Sauter pour bondir très haut." : a.kind === "expresso" ? "Maintiens le saut en l’air pour planer." : a.kind === "enguarde" ? "Action : coup de rostre. Joystick : nager." : "Course et corne pour repousser les ennemis."}`, 5);
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
    this.time += dt;
    this.toastTimer = Math.max(0, this.toastTimer - dt);
    this.particles.forEach((p) => {
      p.age += dt;
    });
    this.particles = this.particles.filter((p) => p.age < 1.3);
    const p = this.player,
      water = this.level.biome === "lagoon",
      cart = this.level.biome === "mine";
    p.invincible = Math.max(0, p.invincible - dt);
    p.launched = Math.max(0, p.launched - dt);
    if (p.cannonLock >= 0) {
      const source = this.level.barrels[p.cannonLock];
      if (!source || Math.hypot(p.x - source.x, p.y - source.y) > 1.7) p.cannonLock = -1;
    }
    p.roll = Math.max(0, p.roll - dt);
    p.mountAttack = Math.max(0, p.mountAttack - dt);
    p.mountCooldown = Math.max(0, p.mountCooldown - dt);
    p.recentRun = (input.held.has("run") || input.held.has("action")) && (input.held.has("left") || input.held.has("right")) ? 0 : p.recentRun + dt;
    if (p.roll === 0) { p.rollJump = false; p.rollChain = 0; }
    if (p.roll > 0) p.rollAngle += Math.abs(p.vx) * dt * 3.4;
    else p.rollAngle = 0;
    p.buffer = input.pressed.has("jump") ? 0.13 : Math.max(0, p.buffer - dt);
    p.coyote = p.grounded ? 0.1 : Math.max(0, p.coyote - dt);
    if (input.pressed.has("swap") && this.mount) this.dismount();
    else if (input.pressed.has("swap") && p.hp === 2 && p.cannon < 0) {
      p.active = 1 - p.active;
      this.onEvent("swap");
      this.pop(
        p.x,
        p.y + 2,
        p.active ? "Violette" : "Rose",
        p.active ? "#c0a2ff" : "#f6a4c9",
      );
    }
    if (p.cannon >= 0) {
      const barrel = this.level.barrels[p.cannon];
      p.cannonTime += dt;
      if (input.pressed.has("jump") || input.pressed.has("action") || (barrel.autoFire && p.cannonTime > 0.15)) {
        const angle = this.cannonAngle(p.cannon);
        p.cannonLock = p.cannon;
        p.launched = 0.65; p.grounded = false; p.coyote = 0; p.roll = 0; p.rollJump = false;
        p.vx = Math.cos(angle) * 19;
        p.vy = Math.sin(angle) * 19;
        p.cannon = -1;
        p.invincible = 1;
        p.buffer = 0;
        this.onEvent("cannon");
      } else return;
    }
    let actionUsed = false;
    if (input.pressed.has("action") && this.mount) {
      const kind = this.mount.kind;
      if (kind === "rambi" || kind === "enguarde") {
        p.mountAttack = 0.32;
        this.onEvent("roll");
      }
      actionUsed = true;
    }
    if (input.pressed.has("action") && !this.mount && !cart) {
      const crate = this.animals.find(b => b.state === "crate" &&
        Math.abs(b.x - p.x) < 1.65 && Math.abs(b.y - p.y) < 1.8);
      if (crate) { this.releaseAnimal(crate); actionUsed = true; }
    }
    if (input.pressed.has("action") && !actionUsed && !water && !cart && p.launched === 0) {
      if (p.carry >= 0) {
        this.thrown.push({
          x: p.x + p.facing * 0.7,
          y: p.y + 1,
          vx: p.facing * 12,
          vy: 3,
          active: true,
        });
        p.carry = -1;
        this.onEvent("throw");
      } else {
        const barrel = this.level.barrels.findIndex(
          (b, i) =>
            b.kind === "throw" &&
            !this.usedBarrels.has(i) &&
            Math.abs(b.x - p.x) < 1.7 &&
            Math.abs(b.y - p.y) < 1.2,
        );
        if (barrel >= 0) {
          p.carry = barrel;
          this.usedBarrels.add(barrel);
          this.onEvent("pickup");
        } else if (p.grounded && p.roll === 0) {
          p.roll = 0.48;
          p.rollJump = true; p.rollChain = 0; p.rollAngle = 0;
          p.rollFacing = (Number(input.held.has("right")) - Number(input.held.has("left"))) || p.facing;
          p.facing = p.rollFacing;
          const base = p.recentRun < BUDDY_PHYSICS.recentRunSeconds ? BUDDY_PHYSICS.rollRunning :
            input.held.has("right") || input.held.has("left") ? BUDDY_PHYSICS.rollMoving : BUDDY_PHYSICS.rollStill;
          p.rollSpeed = base * (p.active ? 1.125 : 1);
          this.onEvent("roll");
        }
      }
    }
    const direction =
      Number(input.held.has("right")) - Number(input.held.has("left"));
    if (direction && p.roll === 0 && p.mountAttack === 0) p.facing = direction;
    const buddy = this.mount, design = buddy && ANIMAL_DESIGNS[buddy.kind];
    const speed =
      (input.held.has("run") || input.held.has("action") ? 5.625 : 3.75) *
      (p.active ? 1.125 : 1);
    if (cart) p.vx = 8.5;
    else if (p.launched > 0) { /* Preserve the cannon impulse instead of braking it immediately. */ }
    else if (p.roll > 0) p.vx = p.rollFacing * p.rollSpeed;
    else if (buddy?.kind === "enguarde" && p.mountAttack > 0) p.vx = p.facing * BUDDY_PHYSICS.stabSpeed;
    else if (buddy?.kind === "rambi" && p.mountAttack > 0) p.vx = p.facing * 9;
    else if (p.invincible < 1.9) {
      const target = direction * (design ? (input.held.has("run") || input.held.has("action") ? design.run : design.walk) : water ? 4.8 : speed);
      // Mounts, swimming and ice retain their distinct movement handling.
      p.vx = !buddy && !water && this.level.biome !== "snow"
        ? approachFootVelocity(p.vx, target)
        : approach(p.vx, target, (this.level.biome === "snow" ? 8 : p.grounded ? 38 : 19) * dt);
    }
    if (water) {
      if (buddy?.kind === "enguarde") {
        if (input.pressed.has("jump")) { p.mountAttack = 0.32; this.onEvent("roll"); }
        if (input.pressed.has("jump") || input.pressed.has("action")) p.vy = 0;
        const vertical = Number(input.held.has("up")) - Number(input.held.has("down"));
        p.vy = approach(p.vy, vertical * 5, 24 * dt);
      } else {
      p.vy -= 7 * dt;
      if (input.held.has("jump") || input.held.has("up"))
        p.vy = approach(p.vy, 4.3, 23 * dt);
      if (input.held.has("down")) p.vy = -4;
      p.vy = clamp(p.vy, -4, 4.3);
      }
    } else {
      if (p.buffer > 0 && (p.coyote > 0 || p.rollJump)) {
        p.vy = design ? design.jump : rawSpeed(ROM.jump[p.active]);
        p.rollJump = false; p.roll = 0;
        p.grounded = false;
        p.coyote = 0;
        p.buffer = 0;
        this.onEvent("jump");
      }
      const gravity =
        input.held.has("jump") ? buddy ? BUDDY_PHYSICS.heldGravity : ROM.held[p.active] : ROM.gravity;
      p.vy = Math.max(
        -rawSpeed(ROM.terminal),
        p.vy - rawAcceleration(gravity) * dt,
      );
      // Expresso flutters while jump is tapped/held in the air, never climbs.
      if (buddy?.kind === "expresso" && !p.grounded && p.vy < 0 && input.held.has("jump"))
        p.vy = Math.max(p.vy, -1.8);
    }
    const wasGrounded = p.grounded;
    const oldY = p.y,
      oldX = p.x;
    p.x = clamp(p.x + p.vx * dt, -2, this.level.length + 1);
    p.y += p.vy * dt;
    p.grounded = false;
    if (water && p.y > 6) {
      p.y = 6;
      p.vy = Math.min(0, p.vy);
    }
    if(this.level.originalTerrain === "jungle") {
      const hit=originalTerrain(p.x,oldY+0.45,ORIGINAL_JUNGLE_ORIGIN);
      if(hit && p.vy<=0 && p.y<=hit.floorY && hit.floorY<=oldY+(wasGrounded?0.45:0.12)) {
        p.y=hit.floorY; p.vy=0; p.grounded=true;
      } else if(hit && wasGrounded && hit.floorY>oldY+0.45) {p.x=oldX;p.vx=0;}
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
    if (p.grounded) p.launched = 0;
    this.updateAnimals(input, oldY, dt);
    this.trail.push({ x: p.x, y: p.y, facing: p.facing });
    if (this.trail.length > 22) {
      const trail = this.trail.shift()!;
      this.companion = {
        ...trail,
        x: Math.abs(trail.x - p.x) < 1.25 ? p.x - trail.facing * 1.25 : trail.x,
      };
    }
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
          this.pop(p.x, p.y + 3, `${this.letterWord} ! +1 vie`);
          this.onEvent("life");
        }
      } else if (item.kind === "balloon") {
        this.lives += item.amount ?? 1;
        this.pop(item.x, item.y, `+${item.amount ?? 1} vie`);
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
          this.pop(p.x, p.y + 2, "+1 vie");
          this.onEvent("life");
        }
      }
    });
    this.level.barrels.forEach((b, i) => {
      if (
        this.usedBarrels.has(i) ||
        Math.abs(b.x - p.x) > 0.8 ||
        Math.abs(b.y - p.y) > 1.1
      )
        return;
      if (b.kind === "rescue") {
        p.hp = 2;
        this.usedBarrels.add(i);
        this.onEvent("rescue");
        this.pop(b.x, b.y + 2, "Ensemble !", "#f4a9d5");
      }
      if (b.kind === "checkpoint") {
        this.checkpoint = { x: b.x, y: b.y };
        this.usedBarrels.add(i);
        this.onEvent("checkpoint");
        this.message("Point de passage enregistré");
        this.pop(b.x, b.y + 2, "✓", "#b5e7a0");
      }
      if (b.kind === "cannon" && p.cannonLock !== i && !this.mount) {
        p.cannon = i; p.cannonTime = 0; p.launched = 0;
        p.carry = -1; p.roll = 0; p.rollJump = false;
        this.onEvent("enter-cannon");
        p.x = b.x;
        p.y = b.y;
        p.vx = 0;
        p.vy = 0;
        this.message(b.autoFire ? "Canon automatique !" : "Sauter ou Action pour décoller. Observe la direction du canon.");
      }
    });
    this.thrown.forEach((b) => {
      if (!b.active) return;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vy -= 12 * dt;
      for (const platform of this.level.platforms) {
        const top = this.surface(platform) + 0.5;
        if (Math.abs(b.x - platform.x) < platform.w / 2 && b.vy < 0 && b.y <= top && b.y - b.vy * dt >= top - 0.2) {
          b.y = top; b.vy = 0;
        }
      }
      if (b.y < -6 || Math.abs(b.x - p.x) > 30) b.active = false;
    });
    this.thrown = this.thrown.filter((b) => b.active);
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      enemy.timer += dt;
      enemy.hurt = Math.max(0, enemy.hurt - dt);
      if (enemy.kind === "boss") {
        const cycle = enemy.timer % 3.7;
        enemy.vulnerable = cycle > 2.55;
        if (cycle < 2.4) {
          enemy.x = approach(
            enemy.x,
            clamp(p.x, enemy.min, enemy.max),
            (4.5 + (5 - enemy.hp) * 0.3) * dt,
          );
          enemy.y =
            Math.abs(Math.sin((cycle / 0.8) * Math.PI)) *
            (1.8 + (5 - enemy.hp) * 0.12);
        } else enemy.y = approach(enemy.y, 0, 12 * dt);
      } else {
        enemy.x += enemy.vx * dt;
        if (enemy.x < enemy.min || enemy.x > enemy.max) {
          enemy.x = clamp(enemy.x, enemy.min, enemy.max);
          enemy.vx *= -1;
        }
        if (enemy.kind === "bee" || (water && enemy.kind === "croc"))
          enemy.y = enemy.originY + Math.sin(enemy.timer * 2) * 0.6;
      }
      const boss = enemy.kind === "boss",
        height = ENEMY_DESIGNS[enemy.kind].height,
        width = ENEMY_DESIGNS[enemy.kind].width;
      let hit = false;
      for (const barrel of this.thrown) {
        if (
          barrel.active &&
          Math.abs(barrel.x - enemy.x) < width + 0.6 &&
          Math.abs(barrel.y - enemy.y - height / 2) < height / 2 + 0.5 &&
          (!boss || enemy.vulnerable)
        ) {
          hit = true;
          barrel.active = false;
        }
      }
      if (
        Math.abs(p.x - enemy.x) < width + (this.mount ? ANIMAL_DESIGNS[this.mount.kind].width : 0.3) &&
        p.y < enemy.y + height &&
        p.y + 1.4 + (this.mount ? ANIMAL_DESIGNS[this.mount.kind].seat : 0) > enemy.y
      ) {
        const mount = this.mount;
        const mountHit = !!mount && !boss && (
          (mount.kind === "rambi" && enemy.kind !== "bee" && (p.facing * (enemy.x - p.x) > -0.2)) ||
          (mount.kind === "enguarde" && p.mountAttack > 0 && p.facing * (enemy.x - p.x) > -0.2) ||
          (mount.kind === "winky" && p.vy < -0.5 && oldY >= enemy.y + height - 0.4)
        );
        const strideOver = mount?.kind === "expresso" && enemy.kind === "beetle" && enemy.y <= p.y + 0.1;
        const stomp = !mount && !water && p.vy < -0.5 && oldY >= enemy.y + height - 0.35;
        const roll =
          p.roll > 0 &&
          enemy.kind !== "bee" &&
          !boss;
        if (mountHit) {
          hit = true;
          if (mount?.kind === "winky") p.vy = 13.5;
        } else if (strideOver) { /* Expresso steps over small ground enemies. */ }
        else if (
          stomp &&
          enemy.kind !== "bee" &&
          (enemy.kind !== "armored" || p.active === 0) &&
          (!boss || enemy.vulnerable)
        ) {
          hit = true;
          p.vy = rawSpeed(ROM.bounce[p.active]);
          this.onEvent("bounce");
        } else if (roll) {
          hit = true;
          p.rollChain++;
          p.rollSpeed = Math.min(BUDDY_PHYSICS.chainCap, p.rollSpeed + BUDDY_PHYSICS.chainIncrement);
          p.roll = Math.max(p.roll, 0.32);
        }
        else if (enemy.hurt <= 0) this.damage();
      }
      if (hit && enemy.hurt <= 0) {
        enemy.hp--;
        enemy.hurt = 1;
        this.onEvent("stomp");
        this.pop(enemy.x, enemy.y + height, boss ? `${5 - enemy.hp} / 5` : "★");
        if (enemy.hp <= 0) {
          enemy.alive = false;
          if (boss) this.finish();
        }
      }
    }
    if (this.levelId !== LEVELS.length - 1 && p.x >= this.level.length - 2)
      this.finish();
    input.pressed.clear();
  }
}
