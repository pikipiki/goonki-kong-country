import { describe, expect, it } from "vitest";
import { Game, emptyInput } from "../src/game/engine";
import { ROM_JUNGLE, ORIGINAL_JUNGLE_PROVENANCE } from "../src/game/originalJungle";

function march(game: Game, frames: number, keys: ("left" | "right" | "jump")[] = ["right"]) {
  const input = emptyInput();
  keys.forEach((k) => input.held.add(k));
  for (let i = 0; i < frames; i++) game.update(input);
}

describe("ROM Jungle Hijinxs route", () => {
  it("imports additional Necky-family enemies from verified spawns", () => {
    const necky = ORIGINAL_JUNGLE_PROVENANCE.imported.filter(
      (r) => r.kind === "enemy" && [14, 75, 79].includes(r.spriteId as number),
    );
    expect(necky.length).toBeGreaterThan(0);
    expect(ROM_JUNGLE.enemies.some((e) => e.kind === "bee")).toBe(true);
  });

  it("advances toward the verified exit door with sustained movement", () => {
    const game = new Game();
    game.start(0, true);
    const startX = game.player.x;
    march(game, 120, ["right"]);
    expect(game.player.x).toBeGreaterThan(startX + 4);
    march(game, 4800, ["right"]);
    expect(game.player.x).toBeGreaterThan(50);
    expect(game.player.x).toBeLessThan(ROM_JUNGLE.length);
  });

  it("keeps ROM spawn X coordinates inside the level length", () => {
    for (const row of ORIGINAL_JUNGLE_PROVENANCE.imported) {
      expect(row.originalX / 32).toBeLessThanOrEqual(ROM_JUNGLE.length + 1);
    }
  });
});
