/**
 * Bit masks and sizes shared by Rev2 SNES metatile collision probes
 * (horizontal levels: CODE_81800D / CODE_8180FF; marine grid: CODE_818168 / CODE_81828A).
 * Values match `scripts/analyze_level_tables.py` and `scripts/analyze_coral_terrain.py`.
 */

/** Map word bits 0–13: index into the environment collision attribute table. */
export const SNES_METATILE_ID_MASK = 0x3fff

/** Map word bit 14: horizontal flip; XORs local X with 31 before attribute lookup. */
export const SNES_METATILE_MAP_HFLIP_BIT = 0x4000

/** Attribute byte bit 7: vertical flip within the 16×16 collision half-tile. */
export const SNES_COLLISION_ATTR_VFLIP_BIT = 0x80

/** Attribute byte bits 6–7: preserved high flags (not fully decoded in static probe). */
export const SNES_COLLISION_ATTR_PROFILE_FLAG_MASK = 0xc0

/** Attribute byte bits 0–5: collision shape profile id into the shape sample table. */
export const SNES_COLLISION_PROFILE_ID_MASK = 0x3f

/**
 * Marine-only profile id bit 5: ceiling solids (height inverted within the 32px cell).
 * Jungle/cave/mine-cart probes treat profiles as floors only.
 */
export const SNES_MARINE_COLLISION_PROFILE_CEILING_BIT = 0x20

export const SNES_METATILE_SIZE_PX = 32

/** Inclusive local X offset within a metatile column (0…31). */
export const SNES_METATILE_LOCAL_X_MASK = 31

/** Bit 4 of local X: selects left vs right collision attribute byte in the pair. */
export const SNES_METATILE_RIGHT_HALF_BIT = 16

/** Local Y sample index within a collision half-tile (0…15). */
export const SNES_METATILE_LOCAL_Y_MASK = 15

/** Solid column height span inside one metatile (0…31 inclusive). */
export const SNES_METATILE_SOLID_HEIGHT_MAX = 31

/**
 * Vertical ROM addressing band for the underwater grid: 16 metatile rows × 32px
 * (see marine addressing at ROM $018187 in `coral-terrain-v2.json` evidence).
 */
export const SNES_MARINE_ROM_Y_BAND_HEIGHT_PX = SNES_METATILE_SIZE_PX * 16

/** Metatile rows in a horizontal level slice (512px tall). */
export const SNES_HORIZONTAL_METATILE_ROW_COUNT = 16

export const SNES_HORIZONTAL_LEVEL_HEIGHT_PX =
  SNES_HORIZONTAL_METATILE_ROW_COUNT * SNES_METATILE_SIZE_PX

/** Inclusive max SNES Y inside the 512px horizontal floor band. */
export const SNES_HORIZONTAL_LEVEL_MAX_Y_PX =
  SNES_HORIZONTAL_LEVEL_HEIGHT_PX - 1

export const SNES_HORIZONTAL_LAST_ROW_FROM_TOP =
  SNES_HORIZONTAL_METATILE_ROW_COUNT - 1
