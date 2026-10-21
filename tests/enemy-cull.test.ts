import { describe, expect, it } from "vitest";
import {
  Game,
  enemySimulationActive,
  enemyVisibleToCamera,
} from "../src/game/engine";

describe("enemy camera culling", () => {
  it("hides lagoon enemies outside the viewport depth band", () => {
    const game = new Game();
    game.start(3, true);
    game.player.x = 20;
    game.player.y = 3.2;
    const near = game.enemies[0];
    near.x = 21;
    near.y = 3.1;
    near.alive = true;
    const farDepth = game.enemies[1];
    farDepth.x = 21;
    farDepth.y = 5.45;
    farDepth.alive = true;
    const farX = game.enemies[2];
    farX.x = 40;
    farX.y = 3.1;
    farX.alive = true;
    expect(enemyVisibleToCamera(game, near)).toBe(true);
    expect(enemyVisibleToCamera(game, farDepth)).toBe(false);
    expect(enemyVisibleToCamera(game, farX)).toBe(false);
    expect(enemySimulationActive(game, near)).toBe(true);
    expect(enemySimulationActive(game, farX)).toBe(false);
  });

  it("keeps the coral entry lane sparse for the first few units", () => {
    const game = new Game();
    game.start(3, true);
    const start = game.level.start!;
    game.player.x = start.x;
    game.player.y = start.y;
    const atSpawn = game.enemies.filter((e) => enemyVisibleToCamera(game, e));
    expect(atSpawn.length).toBeLessThanOrEqual(1);
    game.player.x = start.x + 1.5;
    const afterNudge = game.enemies.filter((e) => enemyVisibleToCamera(game, e));
    expect(afterNudge.length).toBeLessThanOrEqual(2);
  });
});
