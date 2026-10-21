"""Generate supported Coral Capers placements from verified Rev2 metadata."""
import collections, json, math
from pathlib import Path

base = Path(__file__).resolve().parents[1]
r = json.loads((base / "reference/level-tables.json").read_text())
vectors = json.loads((base / "reference/player-states.json").read_text())["cannonBaseTemplateVectors"]
records = r["levels"]["CoralCapers"]["spawnList"]["records"]
Y_MIN, Y_MAX = 17960, 19632
Y_SPAN = Y_MAX - Y_MIN
EXIT_X = 2024


def scale_y(y: int) -> float:
    t = (y - Y_MIN) / Y_SPAN
    return 5.5 - t * 5


def point(x: int, y: int) -> dict:
    return {"x": x / 32, "y": scale_y(y)}


def cannon_angle(ra):
    q = (ra.get("$14C5", 0) + 0x0AAA) & 0xF000
    idx = (q // 0x1000) % 16
    v = vectors[idx]
    return math.atan2(-v["velocityYRaw"], v["velocityXRaw"])


def cannon_delays(ra):
    fc1 = ra.get("$0FC1", 0x1010)
    return (fc1 >> 8) & 0xFF, fc1 & 0xFF


enemies, pickups, barrels, animals, decors, omissions, imported = [], [], [], [], [], [], []
SIGN_TEXT = {1566: "Enguarde peut briser les blocs.", 1914: "Cherche les bonus sous l'eau."}
length_units = EXIT_X / 32 + 2

for row in records:
    if row.get("spawnCommand") != 15:
        continue
    script = row.get("script", {})
    sid = script.get("spriteId")
    pt = point(row["x"], row["y"])
    typ = None
    if sid in (83, 84, 85, 87):
        enemies.append({**pt, "min": max(0, pt["x"] - 10), "max": min(length_units, pt["x"] + 10), "kind": "croc"})
        typ = "enemy"
    elif sid == 97:
        enemies.append({**pt, "min": max(0, pt["x"] - 8), "max": min(length_units, pt["x"] + 8), "kind": "bee"})
        typ = "enemy"
    elif sid == 22:
        animation = next((a for a in script["animationIds"] if 261 <= a <= 264), None)
        if animation is not None:
            pickups.append({**pt, "kind": "letter", "letter": "KONG"[animation - 261]})
            typ = "letter"
    elif sid == 21:
        pickups.append({**pt, "kind": "banana", "amount": 10})
        typ = "banana-bunch"
    elif sid == 52:
        pickups.append({**pt, "kind": "balloon", "amount": 1})
        typ = "balloon"
    elif sid == 38:
        barrels.append({**pt, "kind": "rescue"})
        typ = "barrel"
    elif sid == 74:
        barrels.append({**pt, "kind": "checkpoint"})
        typ = "barrel"
    elif sid == 24 and script.get("ramAssignments", {}).get("$1375") == 3:
        animals.append({**pt, "kind": "enguarde"})
        typ = "enguarde-crate"
    elif sid == 69:
        decors.append({**pt, "kind": "token"})
        typ = "decor"
    elif sid == 115:
        decors.append(
            {**pt, "kind": "sign", "text": SIGN_TEXT.get(row["x"], "KONG")}
        )
        typ = "decor"
    elif sid == 56:
        ra = script.get("ramAssignments", {})
        g_delay, c_delay = cannon_delays(ra)
        barrels.append(
            {
                **pt,
                "kind": "cannon",
                "angle": cannon_angle(ra),
                "launchMultiplier": ra.get("$0FF5", 40),
                "cannonGravityDelay": g_delay,
                "cannonControlDelay": c_delay,
            }
        )
        typ = "cannon"
    if typ:
        imported.append(
            {
                "offset": row["offset"],
                "spriteId": sid,
                "kind": typ,
                "originalX": row["x"],
                "originalY": row["y"],
            }
        )
    else:
        omissions.append(
            {
                "offset": row["offset"],
                "spriteId": sid,
                "name": script.get("spriteName"),
                "originalX": row["x"],
                "originalY": row["y"],
            }
        )

for formation in r["levels"]["CoralCapers"]["bananaFormations"]["records"]:
    for banana in formation["expandedBananas"]:
        y_rom = banana["ySpriteWorldCenter"]
        if not Y_MIN <= y_rom <= Y_MAX:
            continue
        pickups.append(point(banana["xCenter"], y_rom) | {"kind": "banana", "amount": 1})

platforms = []

compact = lambda x: json.dumps(x, separators=(",", ":"), ensure_ascii=False)
s = """import type { Level, Pickup, Platform, LevelDecor } from "./levels";

export const ORIGINAL_CORAL_ORIGIN = Object.freeze({ x: 0, y: Y_ANCHOR });
export const ORIGINAL_CORAL_EXIT = Object.freeze({ x: EXIT_X / 32, y: @@EXIT_Y_WEB@@ });

type OriginalPickup = Pickup & { amount?: number };

const originalPickups: OriginalPickup[] = PICKUPS;
const decors: LevelDecor[] = DECORS;

export const ROM_CORAL: Level & {
  originalTerrain: "coral";
  start: { x: number; y: number };
  letterWord: "KONG";
} = {
  id: 3,
  name: "Coral Capers",
  subtitle: "KONGO JUNGLE · AQUATIC REV 2",
  biome: "lagoon",
  originalTerrain: "coral",
  start: { x: START_X, y: START_Y },
  letterWord: "KONG",
  length: LENGTH,
  platforms: PLATFORMS as Platform[],
  pickups: originalPickups,
  enemies: ENEMIES,
  barrels: BARRELS,
  animals: ANIMALS,
  decors: DECORS,
  tip: "Placements issus du ROM. Nage avec Espace, Action pour le rostre d'Enguarde. Les fonds utilisent encore la physique adaptée du prototype.",
};

export const ORIGINAL_CORAL_PROVENANCE = __PROVENANCE__ as const;

"""

start_x, start_y = 416 / 32, scale_y(17976)
replacements = {
    "Y_ANCHOR": str(Y_MIN),
    "Y_MIN": str(Y_MIN),
    "Y_SPAN": str(Y_SPAN),
    "EXIT_X": str(EXIT_X),
    "@@EXIT_Y_WEB@@": str(scale_y(19632)),
    "START_X": str(start_x),
    "START_Y": str(start_y),
    "LENGTH": str(length_units),
    "PICKUPS": compact(pickups),
    "ENEMIES": compact(enemies),
    "BARRELS": compact(barrels),
    "ANIMALS": compact(animals),
    "DECORS": compact(decors),
    "PLATFORMS": compact(platforms),
    "__PROVENANCE__": compact(
        {
            "romSha256": r["romSha256"],
            "imported": imported,
            "omitted": omissions,
            "yMapping": "Linear map from verified spawn Y 17960..19632 to web depth 5.5..0.5; not full marine collision decode.",
            "platforms": "Collision via originalCoralTerrain ROM metatiles; marine origin Y 17960.",
        }
    ),
}
for key, value in replacements.items():
    s = s.replace(key, value)

(base / "src/game/originalCoral.ts").write_text(s)
print(
    "Coral Capers supported:",
    len(imported),
    "omitted:",
    len(omissions),
    collections.Counter(x["kind"] for x in imported),
)
