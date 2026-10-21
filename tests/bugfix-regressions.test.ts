import { describe, expect, it } from 'vitest';
import { Game, emptyInput, enemyRenderVisible } from '../src/game/engine';
import { ENEMY_DESIGNS } from '../src/game/enemies';
import { SWIM_BODY, terrainSolidSpans, resolveLandMotion, resolveCoralMotion, coralBodyBlocked } from '../src/game/terrainSolids';

const inputs = (...keys: Parameters<Set<'left'|'right'|'up'|'down'|'jump'>['add']>[0][]) => {
  const input = emptyInput(); keys.forEach(k => input.held.add(k)); return input;
};

describe('reported stage regressions', () => {
  it('never flashes a killed enemy back into view', () => {
    const game = new Game(); game.start();
    const enemy = game.enemies[0]; enemy.alive = false; enemy.hurt = 1;
    for(let t=0;t<2;t+=0.01) expect(enemyRenderVisible(enemy,t,game)).toBe(false);
  });
  it('replaces actor identities on every restart, including the same stage', () => {
    const game = new Game(); game.start(0,true);
    const revision = game.sceneRevision, enemy = game.enemies[0]; enemy.alive = false;
    game.load(0);
    expect(game.sceneRevision).toBeGreaterThan(revision);
    expect(game.enemies[0]).not.toBe(enemy);
    expect(game.enemies[0].alive).toBe(true);
  });
  for(const original of [false,true]) for(const id of [0,1,2,4,5]) {
    it(`keeps grounded enemy patrols on terrain: stage ${id}, ROM ${original}`, () => {
      const game = new Game(); game.start(id,original);
      game.player.invincible = 100;
      game.level.barrels.forEach((_,i)=>game.usedBarrels.add(i));
      const enemies = game.enemies.filter(e=>e.kind!=='bee' && e.kind!=='boss' && e.pattern!=='necky');
      for(const enemy of enemies) {
        // Activate each actual spawn and let it patrol for several seconds.
        game.player.x = enemy.x; game.player.y = 30;
        for(let frame=0; frame<180; frame++) {
          game.phase="playing"; game.player.x=enemy.x;game.player.y=enemy.y+4;
          game.player.vy=0;game.player.invincible=100;
          game.update(emptyInput());
        }
        if(!enemy.alive) continue;
        const floor = game.supportAt(enemy.x,enemy.y);
        if(enemy.vy === 0) { expect(floor,JSON.stringify({enemy,phase:game.phase,current:game.enemies.includes(enemy),player:game.player})).not.toBeNull(); expect(enemy.y).toBeCloseTo(floor!,4); }
        else expect(enemy.vy).toBeLessThan(0);
        expect(Number.isFinite(enemy.y)).toBe(true);
      }
    });
  }
  for(const y of [0.8,1.8,2.8]) {
    it(`swims horizontally both ways at depth ${y} without phantom walls`, () => {
      const game = new Game(); game.start(3,true); game.enemies=[]; game.animals=[];
      game.player.x=20;game.player.y=y;
      for(let i=0;i<90;i++) game.update(inputs('right'));
      expect(game.player.x).toBeGreaterThan(24);
      const rightEnd = game.player.x;
      for(let i=0;i<90;i++) game.update(inputs('left'));
      expect(game.player.x).toBeLessThan(rightEnd-3.5);
      expect(game.lives).toBe(5);
    });
  }
  it('can swim left of the entry and dive/rise with four-direction input', () => {
    const game = new Game(); game.start(3,true);game.enemies=[];game.animals=[];
    game.player.y=2;
    for(let i=0;i<60;i++) game.update(inputs('left'));
    expect(game.player.x).toBeLessThan(game.level.start!.x-1);
    const before=game.player.y;
    for(let i=0;i<20;i++) game.update(inputs('up'));
    expect(game.player.y).toBeGreaterThan(before+0.4);
    for(let i=0;i<30;i++) game.update(inputs('down'));
    expect(game.player.y).toBeLessThan(before);
    expect(game.player.grounded).toBe(false);
  });
  it('blocks swimming only at a rendered reef and permits sliding/escape', () => {
    let checked = 0;
    for(let x=2;x<62;x+=.25) {
      const spans=terrainSolidSpans('coral',x);
      for(const span of spans) {
        const y=span.bottom-SWIM_BODY.height-.05;
        if(coralBodyBlocked(x,y)) continue;
        const hit=resolveCoralMotion(x,y,x,y+.4);
        expect(hit.y).toBeLessThan(y+.4);
        expect(coralBodyBlocked(hit.x,hit.y)).toBe(false);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(10);
  });
  it('lands on visible jungle shelves and collides with their underside', () => {
    const x=6;
    const spans=terrainSolidSpans('jungle',x);
    expect(spans.length).toBeGreaterThan(1);
    const lower=spans[0],upper=spans[1];
    const landing=resolveLandMotion('jungle',x,lower.top+.2,x,lower.top-.2,false,-5);
    expect(landing.y).toBeCloseTo(lower.top);
    expect(landing.grounded).toBe(true);
    const head=upper.bottom;
    const roof=resolveLandMotion('jungle',x,head-1.4,x,head-1.2,false,5);
    expect(roof.y+1.35).toBeCloseTo(head);
    expect(roof.blockedY).toBe(true);
  });
  it('bounces safely on the protected boss head and damages it when exposed', () => {
    const game=new Game();game.start(6);
    const boss=game.enemies[0], height=ENEMY_DESIGNS.boss.height;
    for(const timer of [0.1,2.8]) {
      boss.timer=timer;boss.y=0;boss.hurt=0;
      game.player.x=boss.x;game.player.y=height+.03;game.player.vy=-7;
      game.player.hp=2;game.player.invincible=0;
      const hp=boss.hp;
      game.update(emptyInput());
      expect(game.player.hp).toBe(2);
      expect(game.player.vy).toBeGreaterThan(0);
      expect(game.player.y).toBeGreaterThanOrEqual(boss.y+height);
      expect(boss.hp).toBe(timer>2.55 ? hp-1 : hp);
    }
  });
  it('can defeat an exposed boss with an ordinary held jump from the deck', () => {
    const game=new Game();game.start(6);
    const boss=game.enemies[0]; boss.timer=2.6;game.player.x=boss.x-4;
    const input=inputs('jump','right');input.held.add('run');input.pressed.add('jump');
    for(let frame=0;frame<85 && boss.hp===5;frame++) {
      if(game.player.x>=boss.x-.3) input.held.delete('right');
      game.update(input);
    }
    expect(boss.hp).toBe(4);expect(game.player.hp).toBe(2);
  });
  it('enters Coral in clear water and dives away without being trapped', () => {
    const game=new Game();game.start(3,true); game.enemies=[];game.animals=[];
    expect(coralBodyBlocked(game.player.x,game.player.y)).toBe(false);
    for(let i=0;i<90;i++) game.update(inputs('down'));
    expect(game.player.y).toBeCloseTo(-.9);
    expect(game.lives).toBe(5);
  });
  it('still damages side contact with the boss', () => {
    const game=new Game();game.start(6);
    const boss=game.enemies[0];boss.timer=2.8;
    game.player.x=boss.x;game.player.y=0;
    game.update(emptyInput());expect(game.player.hp).toBe(1);
  });
});

import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { createOriginalGroundGeometry } from '../src/game3d/OriginalGround';
import { createCaveGroundGeometry } from '../src/game3d/OriginalCaveGround';
import { createMineCartGroundGeometry } from '../src/game3d/OriginalMineCartGround';
import { createCoralGroundGeometry } from '../src/game3d/OriginalCoralGround';
import { ORIGINAL_JUNGLE_ORIGIN } from '../src/game/originalJungle';
import { ORIGINAL_REVERB_ORIGIN } from '../src/game/originalReverb';
import { ORIGINAL_MINE_CART_ORIGIN } from '../src/game/originalMineCart';

for(const [id, origin, geometryFactory] of [
  [0, ORIGINAL_JUNGLE_ORIGIN, createOriginalGroundGeometry],
  [1, ORIGINAL_REVERB_ORIGIN, createCaveGroundGeometry],
  [2, ORIGINAL_MINE_CART_ORIGIN, createMineCartGroundGeometry],
] as const) {
  it(`renders the solid surfaces used for landing in ROM stage ${id}`, () => {
    const game=new Game();game.start(id,true);
    let checked=0;
    for(let x=1.14;x<game.level.length-2;x+=7) {
      const floor=game.supportAt(x,6,0);
      if(floor===null) continue;
      const geometry=geometryFactory(Math.floor((x*32+origin.x)/32),1);
      const material=new MeshBasicMaterial(), mesh=new Mesh(geometry,material);
      mesh.updateMatrixWorld();
      const ray=new Raycaster(new Vector3(x,floor+.1,0),new Vector3(0,-1,0),0,.2);
      const hit=ray.intersectObject(mesh)[0];
      expect(hit,`stage ${id}, x=${x}, floor=${floor}`).toBeDefined();
      expect(hit.point.y).toBeCloseTo(floor,4);
      geometry.dispose();material.dispose();checked++;
    }
    expect(checked).toBeGreaterThan(5);
  });
}
it('renders front-facing coral instead of hiding reefs by inverted normals', () => {
  const geometry=createCoralGroundGeometry(0,16);
  const normals=geometry.getAttribute('normal');let front=0,top=0;
  for(let i=0;i<normals.count;i++) {
    if(normals.getZ(i)>.9)front++;
    if(normals.getY(i)>.9)top++;
  }
  expect(front).toBeGreaterThan(100);expect(top).toBeGreaterThan(100);
  geometry.dispose();
});
it('rolls barrels on the visible ROM floor without catching invisible presentation platforms', () => {
  const game=new Game();game.start(0,true);game.enemies=[];game.animals=[];
  game.thrown.push({x:6,y:.55,vx:3,vy:0,active:true});
  for(let i=0;i<25;i++)game.update(emptyInput());
  expect(game.thrown).toHaveLength(1);
  expect(game.thrown[0].x).toBeGreaterThan(7);
  expect(game.thrown[0].y).toBeCloseTo(.5);
});
it('lets a dismounted land animal settle rather than remaining suspended', () => {
  const game=new Game();game.start(0,true);game.enemies=[];
  const animal=game.animals[0];animal.state='idle';animal.x=6;animal.y=3;
  game.player.x=6;game.player.y=0;
  for(let i=0;i<90;i++)game.update(emptyInput());
  expect(animal.y).toBeCloseTo(game.supportAt(animal.x,animal.y)!);
  expect(animal.vy).toBe(0);
});
