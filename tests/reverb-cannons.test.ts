import { describe, expect, it } from "vitest";
import { ROM_REVERB, ORIGINAL_REVERB_PROVENANCE } from "../src/game/originalReverb";

describe("Reverb Cave BarrelCannons", () => {
  it("imports all 36 ROM sprite 56 placements as cannon barrels", () => {
    const imported = ORIGINAL_REVERB_PROVENANCE.imported.filter(
      (r) => r.spriteId === 56 && r.kind === "cannon",
    );
    expect(imported).toHaveLength(36);
    const cannons = ROM_REVERB.barrels.filter((b) => b.kind === "cannon");
    expect(cannons).toHaveLength(36);
    expect(cannons[0].cannonGravityDelay).toBeTypeOf("number");
    expect(cannons[0].angle).toBeTypeOf("number");
  });
});
