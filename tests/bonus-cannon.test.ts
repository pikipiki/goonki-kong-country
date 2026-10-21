import { describe, expect, it } from "vitest";
import { Game, emptyInput, STEP } from "../src/game/engine";
import { ROM_JUNGLE } from "../src/game/originalJungle";

describe("bonus rooms and cannon fidelity", () => {
  it("exposes four jungle bonus chambers tied to breakable walls", () => {
    expect(ROM_JUNGLE.bonusRooms).toHaveLength(4);
    expect(ROM_JUNGLE.bonusRooms?.every((r) => r.pickups.length >= 3)).toBe(true);
    expect(ROM_JUNGLE.bonusRooms?.[0].romRam1375).toBe(92);
  });

  it("collects bonus loot after the linked wall is broken", () => {
    const game = new Game();
    game.start(0, true);
    const room = game.level.bonusRooms![1];
    game.brokenWalls.add(room.wallIndex);
    const banana = room.pickups[0];
    game.player.x = banana.x;
    game.player.y = banana.y - 0.85;
    game.player.vy = 0;
    game.player.grounded = true;
    const before = game.bananas;
    game.update(emptyInput());
    expect(game.collectedBonus.size).toBeGreaterThan(0);
    expect(game.bananas).toBeGreaterThan(before);
  });

  it("exposes ROM ExitDoor finish volume on jungle", () => {
    expect(ROM_JUNGLE.finishZone).toBeDefined();
    expect(ROM_JUNGLE.finishZone!.x).toBeCloseTo(5296 / 32, 3);
  });

  it("NutThrowingNecky throws nuts toward the player", () => {
    const game = new Game();
    game.start(0, true);
    const necky = game.enemies.find((e) => e.throwsNuts);
    expect(necky).toBeDefined();
    expect(necky!.throwsNuts).toBe(true);
    let sawShot = false;
    for (let i = 0; i < 120; i++) {
      game.player.x = necky!.x + 10;
      game.player.y = necky!.y - 1.4;
      game.player.vy = 0;
      game.player.grounded = true;
      necky!.shootCooldown = Math.min(necky!.shootCooldown, 0.05);
      game.update(emptyInput());
      if (game.enemyShots.length > 0) sawShot = true;
    }
    expect(sawShot).toBe(true);
  });

  it("keeps Necky-family enemies on a fixed column", () => {
    const game = new Game();
    game.start(0, true);
    const necky = game.enemies.find((e) => e.pattern === "necky");
    expect(necky).toBeDefined();
    const startX = necky!.x;
    const input = emptyInput();
    input.held.add("right");
    for (let i = 0; i < 90; i++) game.update(input);
    expect(necky!.x).toBeCloseTo(startX, 5);
  });

  it("counts cannon gravity and control delays in simulation steps", () => {
    const game = new Game();
    game.start(0, true);
    const index = game.level.barrels.findIndex((b) => b.kind === "cannon");
    expect(index).toBeGreaterThanOrEqual(0);
    const barrel = game.level.barrels[index];
    game.player.x = barrel.x;
    game.player.y = barrel.y;
    game.update(emptyInput());
    expect(game.player.cannon).toBe(index);
    const launch = emptyInput();
    launch.pressed.add("jump");
    game.update(launch);
    const g0 = game.player.cannonGravityDelay;
    const c0 = game.player.cannonControlDelay;
    expect(g0).toBe(barrel.cannonGravityDelay ?? 16);
    expect(c0).toBe(barrel.cannonControlDelay ?? 16);
    game.update(emptyInput());
    expect(game.player.cannonGravityDelay).toBe(Math.max(0, g0 - 1));
    expect(game.player.cannonControlDelay).toBe(Math.max(0, c0 - 1));
    expect(STEP).toBeCloseTo(1 / 60, 8);
  });
});
