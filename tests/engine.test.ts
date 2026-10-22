import {ENEMY_DESIGNS} from "../src/game/enemies";
import { describe, it, expect } from "vitest";
import { Game, emptyInput, STEP, ROM, readSave } from "../src/game/engine";
import { LEVELS } from "../src/game/levels";
function advance(
  game: Game,
  held: Parameters<Set<string>["add"]>[0][],
  frames: number,
) {
  const input = emptyInput();
  held.forEach((key) => input.held.add(key as never));
  for (let n = 0; n < frames; n++) game.update(input);
}
describe("ROM-backed physics and platform collisions", () => {
  it("uses the constants verified from Rev 2 bytes", () => {
    expect(ROM.gravity).toBe(112);
    expect(ROM.held).toEqual([72, 90]);
    expect(ROM.bounce).toEqual([1824, 2176]);
    expect(ROM.jump).toEqual([1792, 2138]);
    expect(ROM.bananas).toBe(100);
  });
  it("lands without sinking through the terrain at 60Hz", () => {
    const game = new Game();
    game.start();
    advance(game, [], 120);
    expect(game.player.y).toBe(0);
    expect(game.player.grounded).toBe(true);
  });
  it("moves in both directions and accelerates rather than teleporting", () => {
    const game = new Game();
    game.start();
    advance(game, ["right"], 45);
    expect(game.player.x).toBeGreaterThan(5);
    advance(game, ["left"], 100);
    expect(game.player.x).toBeLessThan(3);
  });
  it("keeps the held jump higher than a tapped jump", () => {
    function apex(held: boolean) {
      const game = new Game();
      game.start();
      const input = emptyInput();
      input.pressed.add("jump");
      input.held.add("jump");
      let max = 0;
      for (let n = 0; n < 70; n++) {
        if (n === 3 && !held) input.held.delete("jump");
        game.update(input);
        max = Math.max(max, game.player.y);
      }
      return max;
    }
    expect(apex(true)).toBeGreaterThan(apex(false) + 0.5);
  });
  it("does not jump again in mid-air", () => {
    const game = new Game();
    game.start();
    const input = emptyInput();
    input.pressed.add("jump");
    game.update(input);
    advance(game, [], 8);
    const vy = game.player.vy;
    input.pressed.add("jump");
    game.update(input);
    expect(game.player.vy).toBeLessThan(vy);
  });
  it("gives Violette the faster horizontal speed", () => {
    const game = new Game();
    game.start();
    advance(game, ["right", "run"], 30);
    const pink = game.player.vx;
    game.player.active = 1;
    advance(game, ["right", "run"], 30);
    expect(game.player.vx).toBeGreaterThan(pink);
  });
  it("supports swimming across gaps and clamps the surface", () => {
    const game = new Game();
    game.start(3);
    advance(game, ["jump"], 300);
    expect(game.player.y).toBeLessThanOrEqual(6);
    expect(game.player.y).toBeGreaterThan(4);
    expect(game.lives).toBe(5);
  });
  it("automatically advances the minecart", () => {
    const game = new Game();
    game.start(2);
    const x = game.player.x;
    advance(game, [], 45);
    expect(game.player.x).toBeGreaterThan(x + 5);
    expect(game.player.vx).toBe(8.5);
  });
});
describe("team, barrels, collectibles, progression", () => {
  it("switches characters only while both are available", () => {
    const game = new Game();
    game.start();
    const input = emptyInput();
    input.pressed.add("swap");
    game.update(input);
    expect(game.player.active).toBe(1);
    expect(game.swap).not.toBeNull();
    for (let i = 0; i < 30; i++) game.update(emptyInput());
    expect(game.swap).toBeNull();
    game.player.hp = 1;
    input.pressed.add("swap");
    game.update(input);
    expect(game.player.active).toBe(1);
  });
  it("loses one partner before a life and ignores repeated contact while invincible", () => {
    const game = new Game();
    game.start();
    game.damage();
    expect(game.player.hp).toBe(1);
    expect(game.lives).toBe(5);
    game.damage();
    expect(game.lives).toBe(5);
    game.player.invincible = 0;
    game.damage();
    expect(game.lives).toBe(4);
  });
  it("respawns a falling player at the checkpoint", () => {
    const game = new Game();
    game.start();
    game.checkpoint = { x: 53, y: 0 };
    game.player.x = 62;
    game.player.y = -9;
    game.update(emptyInput());
    expect(game.player.x).toBe(53);
    expect(game.lives).toBe(4);
  });
  it("collects a banana once and grants a life at 100", () => {
    const game = new Game();
    game.start();
    const index = game.level.pickups.findIndex((p) => p.kind === "banana"),
      item = game.level.pickups[index];
    game.bananas = 99;
    game.player.x = item.x;
    game.player.y = item.y - 0.85;
    game.update(emptyInput());
    expect(game.bananas).toBe(0);
    expect(game.lives).toBe(6);
    advance(game, [], 2);
    expect(game.total).toBe(1);
  });
  it("restores the missing partner from a rescue barrel", () => {
    const game = new Game();
    game.start();
    game.player.hp = 1;
    game.player.x = 6;
    game.update(emptyInput());
    expect(game.player.hp).toBe(2);
    expect(game.usedBarrels.has(0)).toBe(true);
  });
  it("throws a carried barrel on action tap in click mode", () => {
    const game = new Game();
    game.start();
    game.player.x = 19;
    const input = emptyInput();
    input.clickMode = true;
    input.held.add("action");
    input.pressed.add("action");
    game.update(input);
    expect(game.player.carry).toBe(1);
    input.pressed.clear();
    input.held.delete("action");
    input.pressed.add("action");
    input.held.add("action");
    game.update(input);
    expect(game.player.carry).toBe(-1);
    expect(game.thrown).toHaveLength(1);
  });
  it("picks up and throws a nearby barrel", () => {
    const game = new Game();
    game.start();
    game.player.x = 19;
    const pickup = emptyInput();
    pickup.pressed.add("action");
    pickup.held.add("action");
    game.update(pickup);
    expect(game.player.carry).toBe(1);
    const release = emptyInput();
    release.released.add("action");
    game.update(release);
    expect(game.player.carry).toBe(-1);
    expect(game.thrown).toHaveLength(1);
    expect(game.thrown[0].vx).toBeGreaterThan(0);
    const initial = game.thrown[0].vx;
    let slowed = initial;
    for (let i = 0; i < 8; i++) {
      game.update(emptyInput());
      if (game.thrown[0]?.active) slowed = game.thrown[0].vx;
    }
    expect(slowed).toBeLessThan(initial);
    expect(slowed).toBeGreaterThan(0);
  });
  it("picks up a barrel while holding action in range (ROM hold path)", () => {
    const game = new Game();
    game.start();
    game.player.x = 19;
    const input = emptyInput();
    input.held.add("action");
    game.update(input);
    expect(game.player.carry).toBe(1);
  });
  it("launches from cannon and permits a subsequent landing", () => {
    const game = new Game();
    game.start(1);
    const cannon = game.level.barrels.findIndex((b) => b.kind === "cannon");
    game.player.cannon = cannon;
    const input = emptyInput();
    input.pressed.add("jump");
    game.update(input);
    expect(game.player.cannon).toBe(-1);
    expect(game.player.vy).toBeGreaterThan(10);
  });
  it("clears a level, unlocks the next and preserves the best time", () => {
    const game = new Game();
    game.start();
    let saved = false;
    game.onSave = () => {
      saved = true;
    };
    game.time = 40;
    game.finish();
    expect(game.phase).toBe("clear");
    expect(game.save.unlocked).toBe(1);
    expect(saved).toBe(true);
    game.load(0);
    game.time = 50;
    game.finish();
    expect(game.save.best[0].time).toBe(40);
  });
  it("does not clear the boss level by reaching its edge", () => {
    const game = new Game();
    game.start(6);
    game.player.x = 45;
    game.update(emptyInput());
    expect(game.phase).toBe("playing");
  });
  it("allows ten vulnerable boss hits to complete the campaign", () => {
    const game = new Game();
    game.start(6);
    const boss = game.enemies[0];
    for (let n = 0; n < 10; n++) {
      Object.assign(game.bossBattle!,{phase:"catch",phaseTime:.05,crowned:false});
      boss.timer = 2.8;
      boss.hurt = 0;
      boss.y = 0;
      game.player.x = boss.x;
      game.player.y = ENEMY_DESIGNS.boss.height - .09;
      game.player.vy = -1;
      game.update(emptyInput());
    }
    expect(boss.hp).toBe(0);
    game.player.x=1;
    for(let n=0;n<100;n++)game.update(emptyInput());
    expect(game.phase).toBe("victory");
    expect(game.save.unlocked).toBe(6);
  });
  it("protects the boss outside its recovery window", () => {
    const game = new Game();
    game.start(6);
    const boss = game.enemies[0];
    game.player.x = boss.x;
    game.player.y = ENEMY_DESIGNS.boss.height - .09;
    game.player.vy = -1;
    game.update(emptyInput());
    expect(boss.hp).toBe(10);
  });
  it("pauses the simulation including timers and movement", () => {
    const game = new Game();
    game.start();
    game.pause();
    advance(game, ["right"], 60);
    expect(game.time).toBe(0);
    expect(game.player.x).toBe(3);
    game.pause();
    expect(game.phase).toBe("playing");
  });
  it("rejects malformed save records", () => {
    expect(readSave("{")).toEqual({ unlocked: 0, best: {} });
    expect(readSave('{"unlocked":99,"best":{}}').unlocked).toBe(6);
    expect(readSave('{"unlocked":2,"best":{"0":{"time":null}}}').best).toEqual(
      {},
    );
  });
  it("contains seven complete routes with reachable letters", () => {
    expect(LEVELS).toHaveLength(7);
    for (const level of LEVELS) {
      expect(
        level.pickups
          .filter((p) => p.kind === "letter")
          .map((p) => p.letter)
          .join(""),
      ).toBe("GOONK");
      expect(level.platforms.some((p) => p.x + p.w / 2 >= level.length)).toBe(
        true,
      );
    }
  });
  it("ends the run after the final life", () => {
    const game = new Game();
    game.start();
    game.lives = 1;
    game.damage(true);
    expect(game.phase).toBe("gameover");
  });
});
