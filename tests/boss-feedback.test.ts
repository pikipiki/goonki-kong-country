import {describe,it,expect} from 'vitest';
import {Game,STEP,emptyInput} from '../src/game/engine';
import {bossArenaBounds,BOSS_CARRY,BOSS_BARREL_HEIGHT} from '../src/game/bossArena';
import {BOSS_MAX_HITS,createBossBattle,updateBossBattle,type BossActor,type BossProjectile} from '../src/game/bossBattle';
import {ENEMY_DESIGNS} from '../src/game/enemies';
import {resolveAudioEffectId} from '../src/game/audio';

describe('boss arena objects and visible limits',()=>{
  for(const carrying of [false,true]) it(`crosses the entire deck in both directions, carrying=${carrying}`,()=>{
    const g=new Game();g.start(6);g.enemies=[]; // Isolate deck geometry, not a boss playthrough.
    const bounds=bossArenaBounds(g.level.length),input=emptyInput();
    g.player.x=bounds.playerMin;if(carrying){g.player.carry=1;g.usedBarrels.add(1);}
    input.held.add('right');input.held.add('run');let last=g.player.x;
    for(let f=0;f<600&&g.player.x<bounds.playerMax;f++){g.update(input);expect(g.player.x).toBeGreaterThan(last);last=g.player.x;}
    expect(g.player.x).toBe(bounds.playerMax);expect(g.player.vx).toBe(0);
    input.held.delete('right');input.held.add('left');last=g.player.x;
    for(let f=0;f<600&&g.player.x>bounds.playerMin;f++){g.update(input);expect(g.player.x).toBeLessThan(last);last=g.player.x;}
    expect(g.player.x).toBe(bounds.playerMin);expect(g.player.vx).toBe(0);
    expect(g.player.y).toBe(0);expect(g.player.hp).toBe(2);
  });
  it('throws from the carried centre, settles on the visible deck and breaks beyond its edge',()=>{
    const g=new Game();g.start(6);g.enemies=[];g.player.x=10;g.player.facing=1;
    const input=emptyInput();input.tapAction=true;input.pressed.add('action');g.update(input);
    expect(g.player.carry).toBe(1);expect(g.usedBarrels.has(1)).toBe(true);
    let spawn:{x:number;y:number}|undefined;const events:string[]=[];
    g.onEvent=e=>{events.push(e);if(e==='throw')spawn={...g.thrown[0]};};
    input.pressed.add('action');g.update(input);
    expect(spawn?.x).toBeCloseTo(10+BOSS_CARRY.x);expect(spawn?.y).toBeCloseTo(BOSS_CARRY.y);
    let grounded=false;
    for(let f=0;f<180&&g.thrown.length;f++){
      g.update(input);const b=g.thrown[0];
      if(b&&b.vy===0){grounded=true;expect(b.y).toBeCloseTo(BOSS_BARREL_HEIGHT/2);}
    }
    expect(grounded).toBe(true);expect(g.thrown).toHaveLength(0);expect(events).toContain('barrel-break');
  });
  it('damages the boss with a barrel thrown through the real pickup/throw controls',()=>{
    const g=new Game();g.start(6);g.player.x=10;const input=emptyInput();input.tapAction=true;
    input.pressed.add('action');g.update(input);expect(g.player.carry).toBe(1);
    input.pressed.add('action');g.update(input);
    for(let f=0;f<100&&g.enemies[0].hp===BOSS_MAX_HITS;f++)g.update(input);
    expect(g.enemies[0].hp).toBe(BOSS_MAX_HITS-1);expect(g.player.hp).toBe(2);
  });
  it('contains authored barrels without invisible procedural letters or bananas',()=>{
    const g=new Game();g.start(6);expect(g.level.pickups).toEqual([]);
    expect(g.level.barrels.map(b=>b.kind)).toEqual(['rescue','throw','checkpoint']);
  });
});

describe('boss ROM hurt sound',()=>{
  for(const previousHits of [0,9]) it(`plays sound 0x53 once six frames after head landing ${previousHits+1}`,()=>{
    const g=new Game();g.start(6);const boss=g.enemies[0],events:string[]=[];g.onEvent=e=>events.push(e);
    boss.hp=BOSS_MAX_HITS-previousHits;
    Object.assign(g.bossBattle!,{phase:'catch',phaseTime:0,crowned:false,hits:previousHits});
    g.bossProjectiles.push({kind:'crown',x:5,y:1.35,vx:-6,vy:0,active:true,width:.38,height:.34,age:0,warning:0,returning:false,rotation:0});
    Object.assign(g.player,{x:boss.x,y:ENEMY_DESIGNS.boss.height+.03,vy:-7,invincible:0});
    g.update(emptyInput());expect(boss.hp).toBe(BOSS_MAX_HITS-previousHits-1);expect(g.player.hp).toBe(2);
    for(let i=0;i<5;i++)g.update(emptyInput());expect(events).not.toContain('boss-hurt');
    g.update(emptyInput());expect(events.filter(e=>e==='boss-hurt')).toHaveLength(1);
    for(let i=0;i<20;i++)g.update(emptyInput());expect(events.filter(e=>e==='boss-hurt')).toHaveLength(1);
    expect(resolveAudioEffectId('boss-hurt')).toBe(0x53);
  });
  it('does not groan when the protected crown merely bounces the plush',()=>{
    const g=new Game();g.start(6);const boss=g.enemies[0],events:string[]=[];g.onEvent=e=>events.push(e);
    Object.assign(g.bossBattle!,{phase:'throw',phaseTime:0,crowned:true});
    Object.assign(g.player,{x:boss.x,y:ENEMY_DESIGNS.boss.height+.03,vy:-7,invincible:0});
    for(let i=0;i<15;i++)g.update(emptyInput());
    expect(boss.hp).toBe(BOSS_MAX_HITS);expect(events).not.toContain('boss-hurt');
  });
});

describe('cannonball poses, deck impact and rebound',()=>{
  it('holds each falling pose, marks one impact, rebounds and leaves on the second landing',()=>{
    const b:BossActor={x:17,y:0,vx:0,vy:0,min:4,max:18,hp:6,vulnerable:false};
    const s=createBossBattle(b);Object.assign(s,{phase:'rain',rainCount:0});
    const p:BossProjectile={kind:'cannonball',x:6,y:8.2,vx:0,vy:0,active:true,width:.34,height:.68,age:0,warning:0,returning:false,rotation:0};
    const events:string[]=[],tick=()=>updateBossBattle(s,b,[p],STEP,e=>events.push(e));
    tick();expect(p.y).toBe(8.2);tick();expect(p.y).toBeLessThan(8.2);
    for(let f=0;f<120&&!p.bounces;f++)tick();
    expect(p.bounces).toBe(1);expect(p.y).toBe(p.height/2);expect(p.impact).toBeGreaterThan(0);
    tick();expect(p.y).toBe(p.height/2);
    let peak=p.y;
    for(let f=0;f<120&&p.active;f++){tick();peak=Math.max(peak,p.y);}
    expect(peak).toBeGreaterThan(1);expect(p.active).toBe(false);
    expect(events.filter(e=>e==='boss-ball-impact')).toHaveLength(1);
    expect(resolveAudioEffectId('boss-ball-impact')).toBe(0x1e);
  });
});
