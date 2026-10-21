import { describe, expect, it } from 'vitest';
import { probeSNES, query, nearestCandidateBelowSNES, ceilingWorld } from '../src/game/originalTerrain';
describe('original USA Rev2 Jungle collision metadata', () => {
  it('retains distinct levels at the same X instead of flattening to a maximum', () => {
    expect(probeSNES(192, 176)?.floorY).toBe(175);
    expect(probeSNES(192, 352)?.floorY).toBe(351);
    expect(nearestCandidateBelowSNES(192, 176)?.floorY).toBe(175);
  });
  it('finds verified original early floor and sloped Klump terrain', () => {
    expect(probeSNES(528, 176)?.floorY).toBe(175);
    expect(probeSNES(1824, 220)?.floorY).toBe(208);
    expect(probeSNES(1944, 224)?.floorY).toBe(223);
  });
  it('finds the exact Rambi box support pixel beneath its Y144 spawn', () => {
    expect(probeSNES(2952, 144)?.floorY).toBe(143);
  });
  it('maps coordinates with an explicit world origin and no Y inversion', () => {
    const hit = query(528 / 32, 1 / 32, {x:0, y:175});
    expect(hit?.floorY).toBe(0);
    expect(hit?.originalFloorY).toBe(175);
  });
  it('finds the next surface above the head between stacked floors', () => {
    const underside = ceilingWorld(192 / 32, 5, { x: 0, y: 175 });
    expect(underside).toBeCloseTo((351 - 175) / 32, 5);
  });
  it('rejects nonfinite and out-of-extracted-range coordinates', () => {
    expect(probeSNES(-1, 175)).toBeNull();
    expect(probeSNES(5408, 175)).toBeNull();
    expect(probeSNES(NaN, 175)).toBeNull();
  });
});

import { ROM_JUNGLE, ORIGINAL_JUNGLE_PROVENANCE } from '../src/game/originalJungle';
import { createOriginalGroundGeometry } from '../src/game3d/OriginalGround';
describe('original Jungle level and rendering subset', () => {
  it('uses actual four letters and verified Rambi crate without an invented fifth letter', () => {
    expect(ROM_JUNGLE.pickups.filter(p=>p.kind==='letter').map(p=>p.letter).join('')).toBe('KONG');
    expect(ROM_JUNGLE.animals).toEqual([{kind:'rambi',x:2952/32,y:(144-175)/32}]);
    expect(ROM_JUNGLE.start).toEqual({x:156/32,y:0});
    expect(ORIGINAL_JUNGLE_PROVENANCE.imported.length+ORIGINAL_JUNGLE_PROVENANCE.omitted.length).toBe(66);
    expect(ROM_JUNGLE.barrels.filter(b=>b.kind==='cannon')).toHaveLength(2);
    expect(ROM_JUNGLE.barrels.filter(b=>b.kind==='cannon').every(b=>typeof b.angle==='number')).toBe(true);
  });
  it('builds real finite 3D terrain retaining both stacked surfaces', () => {
    const geometry=createOriginalGroundGeometry(0,16), position=geometry.attributes.position;
    expect(position.count).toBeGreaterThan(0);
    let lower=false,upper=false;
    for(let i=0;i<position.count;i++){
      expect(Number.isFinite(position.getX(i))).toBe(true);
      expect(Number.isFinite(position.getY(i))).toBe(true);
      expect(Number.isFinite(position.getZ(i))).toBe(true);
      if(position.getX(i)===192/32){
        lower ||= Math.abs(position.getY(i))<0.001;
        upper ||= Math.abs(position.getY(i)-(351-175)/32)<0.001;
      }
    }
    expect(lower).toBe(true);expect(upper).toBe(true);geometry.dispose();
  });
});
it('expands original bitmap bananas instead of inventing regular spacing', () => {
  const singles=ROM_JUNGLE.pickups.filter(p=>p.kind==='banana' && (p as {amount?:number}).amount===1);
  expect(singles).toHaveLength(34);
  expect(singles.slice(0,3).map(p=>[p.x,p.y])).toEqual([[228/32,13/32],[252/32,13/32],[276/32,13/32]]);
});
