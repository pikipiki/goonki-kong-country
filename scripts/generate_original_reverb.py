"""Generate ROM Reverb Cave level subset from verified metadata."""
import collections, json, math, sys
from pathlib import Path

base = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(base / "scripts"))
r = json.loads((base / "reference/level-tables.json").read_text())
bonus_meta = []
vectors = json.loads((base / "reference/player-states.json").read_text())[
    "cannonBaseTemplateVectors"
]
records = r["levels"]["ReverbCave"]["spawnList"]["records"]
CAVE_COLUMNS = len(r["caveMetatiles"]["columns"])
from reverb_start_floor import main as reverb_start_meta

_start = reverb_start_meta()
START_Y_WORLD = _start["startYWorld"]
FLAT_WALK_WORLD_X = _start["flatWalkWorldX"] or 6.0


def cannon_angle(ra):
    q = (ra.get("$14C5", 0) + 0x0AAA) & 0xF000
    idx = (q // 0x1000) % 16
    v = vectors[idx]
    return math.atan2(-v["velocityYRaw"], v["velocityXRaw"])


def cannon_delays(ra):
    fc1 = ra.get("$0FC1", 0x1010)
    return (fc1 >> 8) & 0xFF, fc1 & 0xFF


ROM_WORLD_X = 25472
EXIT_X = 36112
LEVEL_LENGTH_WORLD = (EXIT_X - ROM_WORLD_X) / 32 + 2


def scale(x, y):
    return {"x": (x - ROM_WORLD_X) / 32, "y": (y - 175) / 32}


def scale_banana(x, y):
    """Formation bitmaps use low local X; object spawns use high absolute X."""
    if x < ROM_WORLD_X // 2:
        x += ROM_WORLD_X
    return scale(x, y)
enemies, pickups, barrels, animals, moving = [], [], [], [], []
item_caches, breakable_walls, decors = [], [], []
omissions, imported = [], []

SIGN_TEXT = {
    4825: "Cherche les caches cachées.",
    5224: "La sortie est tout droit.",
}


def import_row(row, typ, extra=None):
    imported.append(
        {
            "offset": row["offset"],
            "spriteId": row.get("script", {}).get("spriteId"),
            "kind": typ,
            "originalX": row["x"],
            "originalY": row["y"],
            **(extra or {}),
        }
    )


for row in records:
    cmd = row.get("spawnCommand")
    script = row.get("script", {})
    sid = script.get("spriteId")
    point = scale(row["x"], row["y"])
    typ = None

    if sid == 20 and cmd in (1, 2):
        wall_index = len(breakable_walls)
        breakable_walls.append(
            dict(x=point["x"], y=point["y"], w=1.6, h=max(2.5, (row["y"] - 175) / 32 + 1.2))
        )
        ra = script.get("ramAssignments", {})
        if ra.get("$1375") is not None or ra.get("$13E9") is not None:
            bonus_meta.append(
                {
                    "ram1375": ra.get("$1375"),
                    "ram13E9": ra.get("$13E9"),
                    "wallIndex": wall_index,
                }
            )
        typ = "breakable-wall"
    elif cmd == 1 and sid == 44:
        reward = (
            {"kind": "banana", "amount": 10}
            if row["y"] % 2
            else {"kind": "banana", "amount": 1}
        )
        item_caches.append(dict(point, reward=reward))
        typ = "item-cache"
    elif cmd == 1 and sid == 67:
        decors.append(dict(point, kind="butterfly"))
        typ = "decor"
    elif cmd == 1 and sid == 69:
        decors.append(dict(point, kind="token"))
        typ = "decor"
    elif cmd == 1 and sid == 115:
        decors.append(
            dict(point, kind="sign", text=SIGN_TEXT.get(row["x"], "KONG"))
        )
        typ = "decor"
    elif cmd == 1 and sid in (111, 16):
        decors.append(dict(point, kind="sparkle"))
        typ = "decor"
    elif cmd in (1, 15):
        if sid in (5, 6, 25, 77):
            enemies.append(
                dict(
                    point,
                    min=0,
                    max=LEVEL_LENGTH_WORLD,
                    kind={5: "croc", 6: "armored", 25: "bee", 77: "beetle"}[sid],
                )
            )
            typ = "enemy"
        elif sid in (14, 75, 79):
            enemies.append(
                dict(
                    point,
                    min=point["x"],
                    max=point["x"],
                    kind="bee",
                    pattern="necky",
                    throwsNuts=sid == 14,
                )
            )
            typ = "enemy"
        elif sid == 22:
            animation = next(
                (a for a in script["animationIds"] if 261 <= a <= 264), None
            )
            if animation is not None:
                pickups.append(
                    dict(point, kind="letter", letter="KONG"[animation - 261])
                )
                typ = "letter"
        elif sid == 21:
            pickups.append(dict(point, kind="banana", amount=10))
            typ = "banana-bunch"
        elif sid == 52:
            pickups.append(dict(point, kind="balloon", amount=1))
            typ = "balloon"
        elif sid in (35, 38, 74):
            barrels.append(
                dict(point, kind={35: "throw", 38: "rescue", 74: "checkpoint"}[sid])
            )
            typ = "barrel"
        elif sid == 31:
            moving.append(
                dict(x=point["x"], y=point["y"], w=2.4, h=0.55, kind="moving", travel=1.6)
            )
            typ = "moving-platform"
        elif sid == 24 and script["ramAssignments"].get("$1375") == 0:
            animals.append(dict(point, kind="rambi"))
            typ = "rambi-crate"
        elif sid == 56:
            ra = script.get("ramAssignments", {})
            g_delay, c_delay = cannon_delays(ra)
            barrels.append(
                dict(
                    point,
                    kind="cannon",
                    angle=cannon_angle(ra),
                    launchMultiplier=ra.get("$0FF5", 40),
                    cannonGravityDelay=g_delay,
                    cannonControlDelay=c_delay,
                )
            )
            typ = "cannon"

    if typ:
        import_row(row, typ)
    else:
        reason = "Not yet represented by the web engine; omitted without substituting a different object."
        if sid == 106:
            reason = "ExitDoor coordinate is the completion trigger metadata, no actor required."
        omissions.append(
            dict(
                offset=row["offset"],
                spriteId=sid,
                name=script.get("spriteName"),
                spawnCommand=cmd,
                originalX=row["x"],
                originalY=row["y"],
                reason=reason,
            )
        )

finish_zone = None
for row in records:
    if row.get("spawnCommand") == 2 and row.get("script", {}).get("spriteId") == 106:
        door = scale(row["x"], row["y"])
        finish_zone = dict(x=door["x"], y=door["y"], w=3.2, h=4.5)
        break

bonus_rooms = []
for i, wall in enumerate(breakable_walls):
    wx, wy = wall["x"], wall["y"]
    bx = wx - 3.8 if i % 2 == 0 else wx + 1.2
    meta = next((m for m in bonus_meta if m.get("wallIndex") == i), {})
    room = {
            "wallIndex": i,
            "label": "Salle bonus",
            "bounds": {"x": bx, "y": wy - 0.35, "w": 4.8, "h": 3.1},
            "pickups": [
                {"x": bx + 1.4, "y": wy + 0.85, "kind": "banana", "amount": 10},
                {"x": bx + 2.6, "y": wy + 0.45, "kind": "banana", "amount": 1},
                {"x": bx + 3.5, "y": wy + 1.05, "kind": "balloon", "amount": 1},
            ],
        }
    if meta.get("ram1375") is not None:
        room["romRam1375"] = meta["ram1375"]
    if meta.get("ram13E9") is not None:
        room["romRam13E9"] = meta["ram13E9"]
    bonus_rooms.append(room)

for formation in r["levels"]["ReverbCave"]["bananaFormations"]["records"]:
    for banana in formation["expandedBananas"]:
        pickups.append(
            dict(
                scale_banana(banana["xCenter"], banana["ySpriteWorldCenter"]),
                kind="banana",
                amount=1,
            )
        )

compact = lambda x: json.dumps(x, separators=(",", ":"), ensure_ascii=False)
s = '''import type { Level, Pickup, Platform, ItemCacheSpec, BreakableWallSpec, BonusRoomSpec, LevelDecor } from "./levels";
import { terrainCellSNES as caveTerrainCellSNES } from "./originalCaveTerrain";
/** Coordinates proven against USA Rev2 metadata; see reference/reverb-cave-notes.md.
 * Terrain uses exact ROM cave profiles in physics; presentation platforms are debug-only.
 */
const ROM_WORLD_X = 25472;
const CAVE_COLUMNS = CAVE_COLUMN_COUNT;
export const ORIGINAL_REVERB_ORIGIN = Object.freeze({ x: ROM_WORLD_X, y: 175 });
export const ORIGINAL_REVERB_EXIT = Object.freeze({ x: (36112 - ROM_WORLD_X) / 32, y: (255 - 175) / 32 });
function presentationPlatforms(): Platform[] {
  const platforms: Platform[] = [];
  for (let column = 0; column < CAVE_COLUMNS; column++) {
    const x = column * 32 + 16;
    let span: {bottom:number;top:number} | null = null;
    const spans: {bottom:number;top:number}[] = [];
    for (let row = 15; row >= 0; row--) {
      const cell = caveTerrainCellSNES(x, row);
      if (!cell) continue;
      const bottom = (15 - row) * 32;
      if (span && bottom <= span.top + 1) span.top = Math.max(span.top, cell.floorY);
      else { span = {bottom,top:cell.floorY}; spans.push(span); }
    }
    for (const item of spans) platforms.push({x:(x-ROM_WORLD_X)/32,y:(item.top-175)/32,w:1,h:Math.max(0.1,(item.top-item.bottom)/32),kind:"stone"});
  }
  return platforms;
}
type OriginalPickup = Pickup & { amount?: number };
const originalPickups: OriginalPickup[] = PICKUPS;
const itemCaches: ItemCacheSpec[] = ITEM_CACHES;
const breakableWalls: BreakableWallSpec[] = BREAKABLE_WALLS;
const decors: LevelDecor[] = DECORS;
const bonusRooms: BonusRoomSpec[] = BONUS_ROOMS;
const movingPlatforms: Platform[] = MOVING_PLATFORMS;
const finishZone = FINISH_ZONE;
export const ROM_REVERB: Level & {
  originalTerrain: "cave"; start: {x:number;y:number}; letterWord: "KONG";
} = {
  id: 1,
  name: "Barrel Cannon Canyon",
  subtitle: "KONGO JUNGLE · CANYON",
  biome: "jungle",
  originalTerrain: "cave",
  start: {x:0,y:@@START_Y@@},
  letterWord: "KONG",
  length: ORIGINAL_REVERB_EXIT.x + 2,
  platforms: [...presentationPlatforms(), ...movingPlatforms],
  pickups: originalPickups,
  enemies: ENEMIES,
  barrels: BARRELS,
  animals: ANIMALS,
  itemCaches,
  breakableWalls,
  bonusRooms,
  decors,
  finishZone,
  tip: "Saute dans les tonneaux-canons, puis appuie sur Sauter pour décoller.",
};
export const ORIGINAL_REVERB_PROVENANCE = __PROVENANCE__ as const;
'''
for key, value in [
    ("PICKUPS", pickups),
    ("ENEMIES", enemies),
    ("BARRELS", barrels),
    ("ANIMALS", animals),
    ("MOVING_PLATFORMS", moving),
    ("ITEM_CACHES", item_caches),
    ("BREAKABLE_WALLS", breakable_walls),
    ("DECORS", decors),
    ("BONUS_ROOMS", bonus_rooms),
    ("FINISH_ZONE", finish_zone),
    (
        "__PROVENANCE__",
        dict(
            romSha256=r["romSha256"],
            imported=imported,
            omitted=omissions,
            itemCaches="Revealed by roll contact or ground slap near the verified coordinates.",
            breakableWalls="Broken by roll or thrown barrel; opens bonus-route gaps.",
        ),
    ),
]:
    s = s.replace(key, compact(value))
s = s.replace("CAVE_COLUMN_COUNT", str(CAVE_COLUMNS))
s = s.replace("@@START_Y@@", str(START_Y_WORLD))
(base / "src/game/originalReverb.ts").write_text(s)
(base / "reference/reverb-start.json").write_text(
    json.dumps(
        {
            **_start,
            "note": "World x=0 aligns SNES x=25472 (first spawn band). startYWorld from caveCollisionSurfaceSamples, not DK intro y=175.",
            "flatWalkWorldX": FLAT_WALK_WORLD_X,
        },
        indent=2,
    )
    + "\n"
)
print(
    "Original Jungle supported:",
    len(imported),
    "omitted:",
    len(omissions),
    collections.Counter(x["kind"] for x in imported),
)
