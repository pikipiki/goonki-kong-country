import { describe, expect, it } from "vitest";
import { ROM_REVERB } from "../src/game/originalReverb";
import { ORIGINAL_CAVE_TERRAIN } from "../src/game/originalCaveTerrain";

describe("ROM Reverb Cave import", () => {
  it("exports placements and cave terrain wide enough for spawn band", () => {
    expect(ROM_REVERB.originalTerrain).toBe("cave");
    expect(ROM_REVERB.enemies.length).toBeGreaterThan(20);
    expect(ROM_REVERB.finishZone?.x).toBeGreaterThan(300);
    expect(ORIGINAL_CAVE_TERRAIN.widthPixels).toBeGreaterThan(25_000);
  });
});
