import { describe, expect, it } from "vitest";
import {
  Game,
  enemySimulationActive,
  enemyVisibleToCamera,
} from "../src/game/engine";

describe("enemy camera culling", () => {
  it("keeps the entire visible water column active and culls only distant enemies", () => {
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
    farX.x = 70;
    farX.y = 3.1;
    farX.alive = true;
    expect(enemyVisibleToCamera(game, near)).toBe(true);
    expect(enemyVisibleToCamera(game, farDepth)).toBe(true);
    expect(enemyVisibleToCamera(game, farX)).toBe(false);
    expect(enemySimulationActive(game, near)).toBe(true);
    expect(enemySimulationActive(game, farX)).toBe(false);
  });

  it("never reveals hidden entry enemies after an arbitrary travel threshold", () => {
    const game = new Game(); game.start(3, true);
    const enemy = game.enemies[0];
    enemy.x = game.player.x + 3; enemy.y = game.player.y - 2;
    expect(enemyVisibleToCamera(game, enemy)).toBe(true);
    expect(enemySimulationActive(game, enemy)).toBe(true);
    game.player.x += 3.5;
    expect(enemyVisibleToCamera(game, enemy)).toBe(true);
  });
  it("uses the actual camera frame with padding in either orientation", () => {
    const game = new Game(); game.start(3,true);
    game.cameraBounds={x:25,y:4,halfX:15,halfY:5};
    const enemy=game.enemies[0]; enemy.x=39;enemy.y=5;
    expect(enemyVisibleToCamera(game,enemy)).toBe(true);
    expect(enemySimulationActive(game,enemy)).toBe(true);
    enemy.x=50;
    expect(enemyVisibleToCamera(game,enemy)).toBe(false);
  });
});
