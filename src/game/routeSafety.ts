import { terrainSolidSpans } from './terrainSolids';
import type { EnemySpec } from './levels';

export interface GroundBody { radius:number; height:number }
/** Presentation adaptation: source sprite coordinates are not actor feet.
 * Find a nearby physical support with room for the imported actor's whole body.
 * Null means no grounded placement exists at this X; do not invent a floor.
 */
export function normalizeLandEnemyFeet(kind:string,x:number,preferredY:number,body:GroundBody):number|null {
  const samples=[x-body.radius,x-body.radius/2,x,x+body.radius/2,x+body.radius];
  const spans=samples.map(sample=>terrainSolidSpans(kind,sample));
  const candidates=[...new Set(spans.flatMap(column=>column.map(span=>span.top)))];
  const clear=(y:number)=>spans.every(column=>column.every(span=>
    y+body.height<=span.bottom+.015 || y>=span.top-.015));
  const supported=(y:number)=>terrainSolidSpans(kind,x).some(s=>s.top<=y+.015&&s.top>=y-.45);
  return candidates.filter(y=>clear(y)&&supported(y))
    .sort((a,b)=>Math.abs(a-preferredY)-Math.abs(b-preferredY)||a-b)[0]??null;
}

/** The imported table gives spawn anchors, not patrols across the whole level.
 * Keep real Zingers in short non-overlapping sectors so their encounter order
 * and the time available to recover between jumps remain stable.
 * Stacked source hazards share a sector; Neckys already have fixed source X.
 */
export function mineBeePatrolBounds(enemy:EnemySpec,enemies:readonly EnemySpec[],length:number) {
  const anchors=enemies.filter(e=>e.kind==='bee'&&e.pattern!=='necky'&&Math.abs(e.x-enemy.x)>.01).map(e=>e.x);
  const before=Math.max(0,...anchors.filter(x=>x<enemy.x));
  const after=Math.min(length,...anchors.filter(x=>x>enemy.x));
  return {min:Math.max(0,enemy.x-.6,(before+enemy.x)/2+.15),max:Math.min(length,enemy.x+.6,(after+enemy.x)/2-.15)};
}

/** Keep the impulse through the source counter gates and the subsequent fall.
 * This extends momentum retention only; source direction and speed are intact.
 */
export function cannonMomentumDuration(spec:{cannonGravityDelay?:number;cannonControlDelay?:number}) {
  return Math.max(1.6,(Math.max(spec.cannonGravityDelay??16,spec.cannonControlDelay??16)+1)/60+1.2);
}

/** Mobile cart adaptation, applied to runtime copies only. Nearby low/high
 * Keep a low jump obstacle, a clear overhead corridor, and predictable height.
 * Source metadata and intentional same-column stacks remain unchanged.
 */
export function mineEncounterClearance(enemies:readonly EnemySpec[]):EnemySpec[] {
  const result=enemies.map(enemy=>({...enemy}));
  const bees=enemies.map((enemy,index)=>({enemy,index})).filter(({enemy})=>enemy.kind==='bee'&&enemy.pattern!=='necky').sort((a,b)=>a.enemy.x-b.enemy.x);
  const clustered=new Set<number>(),upper=new Set<number>();
  for(let i=1;i<bees.length;i++) {
    const enemy=bees[i].enemy,previous=bees[i-1].enemy;
    const dx=enemy.x-previous.x,dy=enemy.y-previous.y;
    if(dx>.01&&dx<6.5&&dy>0&&dy<3.5) {
      clustered.add(bees[i-1].index);clustered.add(bees[i].index);upper.add(bees[i].index);
    }
  }
  for(const index of clustered) {
    const enemy=enemies[index];
    const floor=terrainSolidSpans('mineCart',enemy.x).map(s=>s.top).filter(y=>y<=enemy.y+.5).sort((a,b)=>b-a)[0];
    if(floor===undefined)continue;
    let y=upper.has(index)?Math.max(enemy.y,floor+5.2):Math.max(floor+.1,enemy.y-.4);
    // A raised hazard remains a real visible actor outside the physical track.
    // Leave margin around its body when clearing physical source tiles.
    for(let attempt=0;upper.has(index)&&attempt<16;attempt++) {
      const overlapping=[enemy.x-.45,enemy.x,enemy.x+.45].flatMap(x=>terrainSolidSpans('mineCart',x)).filter(s=>y-.6<s.top&&y+1.32>s.bottom);
      if(!overlapping.length)break;
      y=Math.max(...overlapping.map(s=>s.top))+.62;
    }
    result[index].y=y;
    result[index].hoverAmplitude=0;
  }
  return result;
}
