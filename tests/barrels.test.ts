import { describe, expect, it } from "vitest";
import { Game, emptyInput } from "../src/game/engine";

describe("cannon travel and thrown barrels", () => {
  it("keeps its flight momentum and can enter another cannon immediately", () => {
    const g = new Game(); g.start(1); g.enemies = []; g.animals = [];
    const source = g.level.barrels.findIndex(b => b.kind === "cannon");
    const b = g.level.barrels[source];
    Object.assign(g.player, {x:b.x, y:b.y, cannon:source, grounded:false});
    const input=emptyInput(); input.pressed.add("jump"); g.update(input);
    const vx = g.player.vx;
    g.update(emptyInput());
    expect(g.player.cannon).toBe(-1);
    expect(g.player.vx).toBe(vx);
    expect(g.player.launched).toBeGreaterThan(0);
    // Another existing barrel is temporarily made a cannon, then restored.
    const targetIndex = g.level.barrels.findIndex((_,i)=>i!==source);
    const target = g.level.barrels[targetIndex], saved={...target};
    try {
      Object.assign(target,{kind:"cannon", x:g.player.x+vx/60, y:g.player.y});
      g.update(emptyInput());
      expect(g.player.cannon).toBe(targetIndex);
    } finally { Object.assign(target,saved); }
  });
  it("the rotating cannon's visual and firing direction share one angle", () => {
    const g=new Game();g.start(1);
    const i=g.level.barrels.findIndex(b=>b.rotationSpeed);
    const a=g.cannonAngle(i);g.time=0.8;
    expect(g.cannonAngle(i)).not.toBe(a);
  });
  it("fires an automatic cannon without a button press", () => {
    const g=new Game();g.start(1);g.enemies=[];
    const i=g.level.barrels.findIndex(b=>b.kind==="cannon"), b=g.level.barrels[i];
    const saved=b.autoFire;
    try {
      b.autoFire=true; Object.assign(g.player,{x:b.x,y:b.y,cannon:i,grounded:false});
      for(let n=0;n<12;n++)g.update(emptyInput());
      expect(g.player.cannon).toBe(-1); expect(g.player.launched).toBeGreaterThan(0);
    } finally {b.autoFire=saved;}
  });
  it("wooden projectiles roll over a platform without falling through it", () => {
    const g=new Game();g.start();g.enemies=[];
    g.thrown.push({x:4,y:1,vx:5,vy:-2,active:true});
    for(let n=0;n<25;n++)g.update(emptyInput());
    expect(g.thrown[0].y).toBe(0.5);
    expect(g.thrown[0].x).toBeGreaterThan(5);
  });
});
