import { describe, expect, it } from "vitest";
import { probeSNES } from "../src/game/originalTerrain";

describe("jungle pit collision metadata", () => {
  it("keeps upper walkway floor at SNES y=175 across the flat lip tiles", () => {
    expect(probeSNES(448, 176)?.floorY).toBe(175);
    expect(probeSNES(454, 176)?.floorY).toBe(175);
    expect(probeSNES(462, 176)?.floorY).toBe(175);
  });

  it("documents pit gap: lip tiles y=175 but no lower floor in static probe at x=600", () => {
    expect(probeSNES(454, 176)?.floorY).toBe(175);
    expect(probeSNES(600, 176)?.floorY).toBe(161);
    expect(probeSNES(600, 50)).toBeNull();
  });
});
