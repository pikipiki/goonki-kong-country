import { describe, expect, it } from "vitest";
import { Game, emptyInput } from "../src/game/engine";
import { ROM_REVERB } from "../src/game/originalReverb";

describe("ROM Reverb Cave exit", () => {
  it("clears inside ExitDoor finish volume", () => {
    const game = new Game();
    game.start(1, true);
    game.enemies = [];
    const zone = ROM_REVERB.finishZone!;
    game.player.x = zone.x;
    game.player.y = zone.y;
    game.player.vx = 0;
    game.player.vy = 0;
    game.update(emptyInput());
    expect(game.phase).toBe("clear");
  });
});
