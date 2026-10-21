"""Generate the supported Original Jungle level subset from verified metadata."""
import collections,json,math
from pathlib import Path
base=Path(__file__).resolve().parents[1]
r=json.loads((base/'reference/level-tables.json').read_text())
vectors=json.loads((base/'reference/player-states.json').read_text())['cannonBaseTemplateVectors']
def cannon_angle(ra):
    q=(ra.get('$14C5',0)+0x0AAA)&0xF000
    idx=(q//0x1000)%16
    v=vectors[idx]
    return math.atan2(-v['velocityYRaw'],v['velocityXRaw'])
def cannon_delays(ra):
    fc1=ra.get('$0FC1',0x1010)
    return (fc1>>8)&0xFF, fc1&0xFF
records=r['levels']['JungleHijinxs']['spawnList']['records']
enemies=[];pickups=[];barrels=[];animals=[];omissions=[];imported=[]
scale=lambda x,y:{'x':x/32,'y':(y-175)/32}
for row in records:
    script=row.get('script',{});sid=script.get('spriteId');point=scale(row['x'],row['y']);typ=None
    if sid in (5,6,25,77):
        enemies.append(dict(point,min=0,max=167.5,kind={5:'croc',6:'armored',25:'bee',77:'beetle'}[sid]));typ='enemy'
    elif sid==22:
        animation=next((a for a in script['animationIds'] if 261<=a<=264),None)
        if animation is not None:pickups.append(dict(point,kind='letter',letter='KONG'[animation-261]));typ='letter'
    elif sid==21:pickups.append(dict(point,kind='banana',amount=10));typ='banana-bunch'
    elif sid==52:pickups.append(dict(point,kind='balloon',amount=1));typ='balloon'
    elif sid in (35,38,74):
        barrels.append(dict(point,kind={35:'throw',38:'rescue',74:'checkpoint'}[sid]));typ='barrel'
    elif sid==24 and script['ramAssignments'].get('$1375')==0:
        animals.append(dict(point,kind='rambi'));typ='rambi-crate'
    elif sid==56:
        ra=script.get('ramAssignments',{})
        g_delay,c_delay=cannon_delays(ra)
        barrels.append(dict(point,kind='cannon',angle=cannon_angle(ra),launchMultiplier=ra.get('$0FF5',40),
            cannonGravityDelay=g_delay,cannonControlDelay=c_delay));typ='cannon'
    if typ:imported.append(dict(offset=row['offset'],spriteId=sid,kind=typ,originalX=row['x'],originalY=row['y']))
    else:
        reason='Not yet represented by the web engine; omitted without substituting a different object.'
        if sid==44:reason='Hidden ItemCache requires reveal/slap rules; do not expose as free pickup.'
        if sid==20:reason='BreakableWall/bonus entrance requires original exit linkage, not imported.'
        if sid==106:reason='ExitDoor coordinate is the completion trigger metadata, no actor required.'
        omissions.append(dict(offset=row['offset'],spriteId=sid,name=script.get('spriteName'),originalX=row['x'],originalY=row['y'],reason=reason))
for formation in r['levels']['JungleHijinxs']['bananaFormations']['records']:
    for banana in formation['expandedBananas']:
        pickups.append(dict(scale(banana['xCenter'],banana['ySpriteWorldCenter']),kind='banana',amount=1))
compact=lambda x:json.dumps(x,separators=(',',':'),ensure_ascii=False)
s='''import type { Level, Pickup, Platform } from "./levels";
import { terrainCellSNES } from "./originalTerrain";
/** Coordinates proven against USA Rev2 metadata; see reference/level-tables.md.
 * Terrain uses exact ROM profiles in physics; these small rectangles support
 * shadows/debug tools only. They must NOT replace originalTerrain probing.
 */
export const ORIGINAL_JUNGLE_ORIGIN = Object.freeze({ x: 0, y: 175 });
export const ORIGINAL_JUNGLE_EXIT = Object.freeze({ x: 5296 / 32, y: (63 - 175) / 32 });
function presentationPlatforms(): Platform[] {
  const platforms: Platform[] = [];
  for (let column = 0; column < 169; column++) {
    const x = column * 32 + 16;
    let span: {bottom:number;top:number} | null = null;
    const spans: {bottom:number;top:number}[] = [];
    for (let row = 15; row >= 0; row--) {
      const cell = terrainCellSNES(x, row);
      if (!cell) continue;
      const bottom = (15 - row) * 32;
      if (span && bottom <= span.top + 1) span.top = Math.max(span.top, cell.floorY);
      else { span = {bottom,top:cell.floorY}; spans.push(span); }
    }
    for (const item of spans) platforms.push({x:x/32,y:(item.top-175)/32,w:1,h:Math.max(0.1,(item.top-item.bottom)/32),kind:"stone"});
  }
  return platforms;
}
type OriginalPickup = Pickup & { amount?: number };
const originalPickups: OriginalPickup[] = PICKUPS;
export const ROM_JUNGLE: Level & {
  originalTerrain: "jungle"; start: {x:number;y:number}; letterWord: "KONG";
} = {
  id: 0,
  name: "Jungle Hijinxs",
  subtitle: "KONGO JUNGLE · USA REV 2",
  biome: "jungle",
  originalTerrain: "jungle",
  start: {x:156/32,y:0},
  letterWord: "KONG",
  // Existing completion threshold is length-2: align it with the verified door X.
  length: ORIGINAL_JUNGLE_EXIT.x + 2,
  platforms: presentationPlatforms(),
  pickups: originalPickups,
  enemies: ENEMIES,
  barrels: BARRELS,
  animals: ANIMALS,
  tip: "Tracé et placements issus du ROM. Les quatre lettres originales sont K O N G. Rambi t’attend dans sa caisse.",
};
export const ORIGINAL_JUNGLE_PROVENANCE = __PROVENANCE__ as const;
'''
for key,value in [('PICKUPS',pickups),('ENEMIES',enemies),('BARRELS',barrels),('ANIMALS',animals),('__PROVENANCE__',dict(romSha256=r['romSha256'],imported=imported,omitted=omissions,regularBananaFormations='34 bananas expanded from10 actualbitmaps,8pxboxes with top-downY converted and4pxcenter offset;possible1pxgraphiccenteringpendingruntime.',enemyBehavior='Original spawn coordinates; existing adapted movement/AI, full-level bounds.'))]:s=s.replace(key,compact(value))
(base/'src/game/originalJungle.ts').write_text(s)
print('Original Jungle supported placements:',len(imported),'omitted:',len(omissions),collections.Counter(x['kind'] for x in imported))
