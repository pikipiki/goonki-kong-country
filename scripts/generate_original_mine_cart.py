"""Generate ROM Mine Cart Carnage level subset from verified metadata."""
import collections, json, math, sys
from pathlib import Path

base = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(base / "scripts"))
r = json.loads((base / "reference/level-tables.json").read_text())
vectors = json.loads((base / "reference/player-states.json").read_text())[
    "cannonBaseTemplateVectors"
]
records = r["levels"]["MineCartCarnage"]["spawnList"]["records"]
CART_COLUMNS = len(r["mineCartMetatiles"]["columns"])
from mine_cart_start_floor import main as mine_cart_start_meta

_start = mine_cart_start_meta()
START_Y_WORLD = _start["startYWorld"]
ROM_WORLD_X = _start["romWorldX"]
Y_ANCHOR = _start["yAnchor"]
EXIT_X = _start["exitRomX"]
LEVEL_LENGTH_WORLD = (EXIT_X - ROM_WORLD_X) / 32 + 2


def cannon_angle(ra):
    q = (ra.get("$14C5", 0) + 0x0AAA) & 0xF000
    idx = (q // 0x1000) % 16
    v = vectors[idx]
    return math.atan2(-v["velocityYRaw"], v["velocityXRaw"])


def cannon_delays(ra):
    fc1 = ra.get("$0FC1", 0x1010)
    return (fc1 >> 8) & 0xFF, fc1 & 0xFF


def scale(x, y):
    return {"x": (x - ROM_WORLD_X) / 32, "y": (y - Y_ANCHOR) / 32}


def scale_banana(x, y):
    if x < ROM_WORLD_X // 2:
        x += ROM_WORLD_X
    return scale(x, y)


enemies, pickups, barrels, animals, moving = [], [], [], [], []
decors = []
omissions, imported = [], []

for row in records:
    cmd = row.get("spawnCommand")
    script = row.get("script", {})
    sid = script.get("spriteId")
    point = scale(row["x"], row["y"])
    typ = None

    if cmd in (1, 15):
        if sid in (25,):
            enemies.append(
                dict(point, min=0, max=LEVEL_LENGTH_WORLD, kind="bee")
            )
            typ = "enemy"
        elif sid in (79, 14):
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
        elif sid == 77:
            enemies.append(
                dict(point, min=0, max=LEVEL_LENGTH_WORLD, kind="beetle")
            )
            typ = "enemy"
        elif sid in (27, 31):
            typ = "hazard-omitted"
        elif sid == 81:
            typ = "minecart-scenery"
        elif sid == 22:
            animation = next(
                (a for a in script.get("animationIds", []) if 261 <= a <= 264), None
            )
            if animation is not None:
                pickups.append(
                    dict(point, kind="letter", letter="KONG"[animation - 261])
                )
                typ = "letter"
        elif sid == 21:
            pickups.append(dict(point, kind="banana", amount=10))
            typ = "banana-bunch"
        elif sid in (35, 38, 74):
            barrels.append(
                dict(point, kind={35: "throw", 38: "rescue", 74: "checkpoint"}[sid])
            )
            typ = "barrel"
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
        elif sid == 115:
            decors.append(dict(point, kind="sign", text="KONG"))
            typ = "decor"
        elif sid == 69:
            decors.append(dict(point, kind="token"))
            typ = "decor"

    if typ in ("minecart-scenery", "hazard-omitted"):
        omissions.append(
            dict(
                offset=row["offset"],
                spriteId=sid,
                name=script.get("spriteName"),
                spawnCommand=cmd,
                originalX=row["x"],
                originalY=row["y"],
                reason="Scenery or tire hazard not yet simulated; omitted without substitute.",
            )
        )
    elif typ:
        imported.append(
            dict(
                offset=row["offset"],
                spriteId=sid,
                kind=typ,
                originalX=row["x"],
                originalY=row["y"],
            )
        )
    elif cmd == 2 and sid == 106:
        omissions.append(
            dict(
                offset=row["offset"],
                spriteId=sid,
                name="ExitDoor",
                spawnCommand=cmd,
                originalX=row["x"],
                originalY=row["y"],
                reason="ExitDoor coordinate is the completion trigger metadata, no actor required.",
            )
        )
    else:
        omissions.append(
            dict(
                offset=row["offset"],
                spriteId=sid,
                name=script.get("spriteName"),
                spawnCommand=cmd,
                originalX=row["x"],
                originalY=row["y"],
                reason="Not yet represented by the web engine; omitted without substituting a different object.",
            )
        )

finish_zone = None
for row in records:
    if row.get("spawnCommand") == 2 and row.get("script", {}).get("spriteId") == 106:
        door = scale(row["x"], row["y"])
        finish_zone = dict(x=door["x"], y=door["y"], w=3.2, h=4.5)
        break

for formation in r["levels"]["MineCartCarnage"]["bananaFormations"]["records"]:
    for banana in formation["expandedBananas"]:
        pickups.append(
            dict(
                scale_banana(banana["xCenter"], banana["ySpriteWorldCenter"]),
                kind="banana",
                amount=1,
            )
        )

compact = lambda x: json.dumps(x, separators=(",", ":"), ensure_ascii=False)
s = '''import type { Level, Pickup, Platform, LevelDecor } from "./levels";
import { terrainCellSNES as cartTerrainCellSNES } from "./originalMineCartTerrain";
/** Coordinates proven against USA Rev2 metadata; see reference/mine-cart-notes.md.
 * Terrain uses exact ROM mine-cart profiles in physics; presentation platforms are debug-only.
 */
const ROM_WORLD_X = @@ROM_X@@;
const CART_COLUMNS = CART_COLUMN_COUNT;
export const ORIGINAL_MINE_CART_ORIGIN = Object.freeze({ x: ROM_WORLD_X, y: @@Y_ANCHOR@@ });
export const ORIGINAL_MINE_CART_EXIT = Object.freeze({ x: (@@EXIT_X@@ - ROM_WORLD_X) / 32, y: (@@EXIT_Y@@ - @@Y_ANCHOR@@) / 32 });
function presentationPlatforms(): Platform[] {
  const platforms: Platform[] = [];
  for (let column = 0; column < CART_COLUMNS; column++) {
    const x = column * 32 + 16;
    let span: {bottom:number;top:number} | null = null;
    const spans: {bottom:number;top:number}[] = [];
    for (let row = 15; row >= 0; row--) {
      const cell = cartTerrainCellSNES(x, row);
      if (!cell) continue;
      const bottom = (15 - row) * 32;
      if (span && bottom <= span.top + 1) span.top = Math.max(span.top, cell.floorY);
      else { span = {bottom,top:cell.floorY}; spans.push(span); }
    }
    for (const item of spans) platforms.push({x:(x-ROM_WORLD_X)/32,y:(item.top-@@Y_ANCHOR@@)/32,w:1,h:Math.max(0.1,(item.top-item.bottom)/32),kind:"stone"});
  }
  return platforms;
}
type OriginalPickup = Pickup & { amount?: number };
const originalPickups: OriginalPickup[] = PICKUPS;
const decors: LevelDecor[] = DECORS;
const finishZone = FINISH_ZONE;
export const ROM_MINE_CART: Level & {
  originalTerrain: "mineCart"; start: {x:number;y:number}; letterWord: "KONG";
} = {
  id: 2,
  name: "Mine Cart Carnage",
  subtitle: "MONKEY MINES · CART · USA REV 2",
  biome: "mine",
  originalTerrain: "mineCart",
  start: {x:0,y:@@START_Y@@},
  letterWord: "KONG",
  length: ORIGINAL_MINE_CART_EXIT.x + 2,
  platforms: presentationPlatforms(),
  pickups: originalPickups,
  enemies: ENEMIES,
  barrels: BARRELS,
  animals: ANIMALS,
  decors,
  finishZone,
  tip: "Tracé wagon issu du ROM. Maintiens la direction pour rester sur les rails. Les quatre lettres sont K O N G.",
};
export const ORIGINAL_MINE_CART_PROVENANCE = __PROVENANCE__ as const;
'''
for key, value in [
    ("PICKUPS", pickups),
    ("ENEMIES", enemies),
    ("BARRELS", barrels),
    ("ANIMALS", animals),
    ("DECORS", decors),
    ("FINISH_ZONE", finish_zone),
    (
        "__PROVENANCE__",
        dict(
            romSha256=r["romSha256"],
            imported=imported,
            omitted=omissions,
        ),
    ),
]:
    s = s.replace(key, compact(value))
s = (
    s.replace("CART_COLUMN_COUNT", str(CART_COLUMNS))
    .replace("@@START_Y@@", str(START_Y_WORLD))
    .replace("@@ROM_X@@", str(ROM_WORLD_X))
    .replace("@@Y_ANCHOR@@", str(Y_ANCHOR))
    .replace("@@EXIT_X@@", str(EXIT_X))
    .replace("@@EXIT_Y@@", str(_start["exitRomY"]))
)
(base / "src/game/originalMineCart.ts").write_text(s)
(base / "reference/mine-cart-start.json").write_text(
    json.dumps(_start, indent=2) + "\n"
)
print(
    "Mine cart:",
    len(imported),
    "imported,",
    len(omissions),
    "omitted",
    collections.Counter(x["kind"] for x in imported),
)
