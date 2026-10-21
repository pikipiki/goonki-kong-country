import { describe, expect, it } from "vitest";
import { Game, emptyInput, type Key } from "../src/game/engine";
import { ANIMAL_DESIGNS, BUDDY_PHYSICS } from "../src/game/animals";

function step(g: Game, frames: number, held: Key[] = []) {
  const input = emptyInput(); held.forEach(k => input.held.add(k));
  for (let n = 0; n < frames; n++) g.update(input);
}
function mounted(level: number, index = 0) {
  const g = new Game(); g.start(level); g.enemies = [];
  const a = g.animals[index]; a.state = "idle";
  Object.assign(g.player, { x: a.x, y: a.y + ANIMAL_DESIGNS[a.kind].seat + 0.03, vy: -5, grounded: false });
  g.update(emptyInput());
  expect(g.player.mount).toBe(index);
  return g;
}
function press(g: Game, key: Key, held: Key[] = []) {
  const input = emptyInput(); input.pressed.add(key);
  held.forEach(k => input.held.add(k)); g.update(input);
}
describe("animal crates, riding, recovery and original abilities", () => {
  it("opens a crate with action and mounts only by landing on its back", () => {
    const g = new Game(); g.start(); g.player.x = 11;
    press(g, "action");
    expect(g.animals[0].state).toBe("idle");
    expect(g.player.mount).toBe(-1);
    Object.assign(g.player, { y: 1.28, vy: -5, grounded: false });
    g.update(emptyInput());
    expect(g.mount?.kind).toBe("rambi");
    expect(g.player.roll).toBe(0);
  });
  it("uses verified raw walk/run/jump values for the three land mounts", () => {
    expect(ANIMAL_DESIGNS.rambi.walk).toBe(3.75);
    expect(ANIMAL_DESIGNS.rambi.run).toBe(6.5625);
    expect(ANIMAL_DESIGNS.winky.run).toBe(5.625);
    expect(ANIMAL_DESIGNS.expresso.run).toBe(7.5);
    expect(ANIMAL_DESIGNS.winky.jump).toBe(15);
    expect(ANIMAL_DESIGNS.rambi.jump).toBe(13.125);
    expect(BUDDY_PHYSICS.stabSpeed).toBe(7.5);
  });
  it("dismounts with one remaining plush and does not immediately remount", () => {
    const g = mounted(0); g.player.hp = 1;
    press(g, "swap");
    expect(g.player.mount).toBe(-1);
    expect(g.animals[0].state).toBe("idle");
    expect(g.player.vy).toBeGreaterThan(0);
    expect(g.player.active).toBe(0);
    step(g, 5);
    expect(g.player.mount).toBe(-1);
  });
  it("a mounted hit releases the animal without consuming a plush or life", () => {
    const g = mounted(0); const hp = g.player.hp;
    g.damage();
    expect(g.player.mount).toBe(-1);
    expect(g.player.hp).toBe(hp);
    expect(g.lives).toBe(5);
    expect(g.animals[0].state).toBe("fleeing");
    const x = g.animals[0].x; step(g, 10);
    expect(g.animals[0].x).toBeGreaterThan(x);
    expect(g.player.invincible).toBeGreaterThan(0);
  });
  it("Rambi horn defeats a grounded crocodile ahead", () => {
    const g = mounted(0);
    const original = new Game(); original.start();
    const e = { ...original.enemies.find(e => e.kind === "croc")!, x: g.player.x + 0.8, y: 0, min: 0, max: 100, vx: 0 };
    g.enemies = [e]; g.update(emptyInput());
    expect(e.alive).toBe(false); expect(g.player.mount).toBe(0);
  });
  it("Winky jumps higher than the same plush on foot", () => {
    function apex(riding: boolean) {
      const g = mounted(1);
      if (!riding) { g.player.mount = -1; g.animals = []; }
      const input = emptyInput(); input.pressed.add("jump"); input.held.add("jump");
      let top = g.player.y;
      for (let n = 0; n < 80; n++) { g.update(input); top = Math.max(top, g.player.y); }
      return top;
    }
    expect(apex(true)).toBeGreaterThan(apex(false) + 0.5);
  });
  it("Expresso slows descent while flutter is held", () => {
    const g = mounted(4); Object.assign(g.player, { y: 5, vy: -8, grounded: false });
    step(g, 12, ["jump"]);
    expect(g.player.vy).toBeGreaterThanOrEqual(-1.8);
    expect(g.player.y).toBeGreaterThan(4);
    step(g, 12);
    expect(g.player.vy).toBeLessThan(-1.8);
  });
  it("Enguarde steers both vertically and horizontally, attacks, then dismounts", () => {
    const g = new Game(); g.start(3); g.enemies = [];
    g.animals[0].state = "idle";
    Object.assign(g.player, { x: 10, y: 1.8, vy: 0 });
    g.update(emptyInput()); expect(g.mount?.kind).toBe("enguarde");
    const y = g.player.y; step(g, 15, ["up", "right"]);
    expect(g.player.y).toBeGreaterThan(y); expect(g.player.x).toBeGreaterThan(10);
    press(g, "action"); step(g, 1);
    expect(g.player.vx).toBe(BUDDY_PHYSICS.stabSpeed);
    expect(g.player.mountAttack).toBeGreaterThan(0);
    press(g, "swap"); expect(g.player.mount).toBe(-1);
  });
});
describe("roll/cartwheel momentum and edge jump", () => {
  it("can jump after leaving a ledge during the roll, once", () => {
    const g = new Game(); g.start(); g.enemies = []; g.animals = [];
    Object.assign(g.player, { x: 46.25, y: 0, grounded: true });
    press(g, "action", ["right", "run"]); step(g, 11, ["right"]);
    expect(g.player.grounded).toBe(false); expect(g.player.coyote).toBe(0);
    expect(g.player.rollJump).toBe(true);
    press(g, "jump", ["jump", "right"]);
    expect(g.player.vy).toBeGreaterThan(0);
    expect(g.player.rollJump).toBe(false); expect(g.player.roll).toBe(0);
    step(g, 5); const vy = g.player.vy;
    press(g, "jump"); expect(g.player.vy).toBeLessThan(vy);
  });
  it("does not start an attack roll in midair", () => {
    const g = new Game(); g.start(); Object.assign(g.player, { x: 40, y: 4, grounded: false });
    press(g, "action"); expect(g.player.roll).toBe(0);
  });
  it("a chained cartwheel accelerates, defeats Klump and stays below the ROM cap", () => {
    const g = new Game(); g.start(); g.animals = [];
    Object.assign(g.player, { x: 40, active: 1, grounded: true });
    const armor = g.enemies.find(e => e.kind === "armored")!;
    Object.assign(armor, { x: 40.7, y: 0, min: 0, max: 100, vx: 0 });
    g.enemies = [armor];
    press(g, "action", ["right", "run"]);
    expect(armor.alive).toBe(false);
    expect(g.player.rollChain).toBe(1);
    expect(g.player.rollSpeed).toBe(BUDDY_PHYSICS.rollRunning * 1.125 + BUDDY_PHYSICS.chainIncrement);
    expect(g.player.rollSpeed).toBeLessThanOrEqual(BUDDY_PHYSICS.chainCap);
    expect(g.player.hp).toBe(2);
  });
});
