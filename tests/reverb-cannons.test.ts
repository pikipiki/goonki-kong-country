import { describe, expect, it } from "vitest";
import { ROM_REVERB, ORIGINAL_REVERB_PROVENANCE } from "../src/game/originalReverb";
import { Game, emptyInput } from '../src/game/engine';
import tables from '../reference/level-tables.json';

describe("Barrel Cannon Canyon grouped spawns", () => {
  it("imports the 36 direct cannons and 14 cannons from six child lists", () => {
    const imported = ORIGINAL_REVERB_PROVENANCE.imported.filter(r => r.spriteId === 56 && r.kind === "cannon");
    expect(imported).toHaveLength(50);
    expect(imported.filter(r => 'parentGroupOffset' in r)).toHaveLength(14);
    expect(ROM_REVERB.barrels.filter(b => b.kind === "cannon")).toHaveLength(50);
    expect(ROM_REVERB.barrels[0].cannonGravityDelay).toBeTypeOf("number");
    expect(ROM_REVERB.barrels[0].angle).toBeTypeOf("number");
  });
  it('preserves all 18 decoded child actors and their parent provenance',()=>{
    const groups=tables.levels.ReverbCave.spawnList.records.filter(r=>'groupedSpawnList' in r);
    expect(groups).toHaveLength(6);
    let childCount=0;
    for(const group of groups)for(const child of group.groupedSpawnList!.records){
      childCount++;expect(child.script.partial).toBe(false);
      const actor=ORIGINAL_REVERB_PROVENANCE.imported.find(a=>a.offset===child.offset);
      expect(actor,child.offset).toBeDefined();
      expect(actor&&'parentGroupOffset' in actor&&actor.parentGroupOffset).toBe(group.offset);
    }
    expect(childCount).toBe(18);
    expect(ORIGINAL_REVERB_PROVENANCE.omitted.some(r=>Number(r.spawnCommand)===5)).toBe(false);
  });
  it('reaches the previously missing receiver at x260 from direct cannon31',()=>{
    const g=new Game();g.start(1,true);g.enemies=[];g.animals=[];
    const receiver=g.level.barrels.findIndex(b=>b.kind==='cannon'&&b.x===260&&b.y===-1.84375);
    expect(receiver).toBeGreaterThanOrEqual(0);
    const b=g.level.barrels[31];Object.assign(g.player,{x:b.x,y:b.y,cannon:31,grounded:false});
    const input=emptyInput();input.pressed.add('action');g.update(input);
    for(let f=0;f<90&&g.player.cannon<0;f++)g.update(emptyInput());
    expect(g.player.cannon).toBe(receiver);expect(g.lives).toBe(5);
  });
});
