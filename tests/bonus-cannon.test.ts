import { describe, expect, it } from "vitest";
import { Game, emptyInput, STEP } from "../src/game/engine";
import { ROM_JUNGLE } from "../src/game/originalJungle";
import bonusWalls from "../reference/jungle-bonus-walls.json";

describe("bonus rooms and cannon fidelity", () => {
  it("exposes four jungle bonus chambers tied to breakable walls", () => {
    expect(ROM_JUNGLE.bonusRooms).toHaveLength(4);
    expect(ROM_JUNGLE.bonusRooms?.every((r) => r.pickups.length >= 3)).toBe(true);
    expect(ROM_JUNGLE.bonusRooms?.[0].romRam1375).toBe(92);
    expect(bonusWalls.breakableWalls[0].entranceLevelId).toBe(64);
    expect(bonusWalls.breakableWalls[1].entranceLevelId).toBe(45);
  });

  it("enters a separate playable bonus, collects loot and returns without resetting the stage", () => {
    const game = new Game();game.start(0,true);game.enemies=[];
    const room=game.level.bonusRooms![2],wall=game.level.breakableWalls![room.wallIndex];
    const animal=game.animals[0];animal.state="ridden";
    Object.assign(game.player,{x:wall.x-1.25,y:wall.y,vx:0,vy:0,grounded:true,mount:0});
    game.collected.add(0);game.letters.add(1);
    const savedCollected=game.collected,savedLetters=game.letters,revision=game.sceneRevision;
    const strike=emptyInput();strike.pressed.add("action");strike.held.add("right");
    game.update(strike);
    expect(game.brokenWalls.has(room.wallIndex)).toBe(true);
    expect(game.bonus?.index).toBe(2);expect(game.level.originalTerrain).toBeUndefined();
    expect(game.sceneRevision).toBeGreaterThan(revision);expect(game.player.mount).toBe(-1);
    const before=game.bananas,walk=emptyInput();walk.held.add("right");walk.held.add("run");
    for(let i=0;i<220 && game.bonus;i++)game.update(walk);
    expect(game.bonus).toBeNull();expect(game.bananas).toBeGreaterThan(before);
    expect(game.collectedBonus.size).toBe(3);expect(game.collected).toBe(savedCollected);expect(game.letters).toBe(savedLetters);
    expect(game.player.mount).toBe(0);expect(game.brokenWalls.has(room.wallIndex)).toBe(true);
    expect(game.player.x).toBeLessThan(wall.x);expect(game.phase).toBe("playing");
  });

  it("seals the entrance behind the player while leaving the right exit usable", () => {
    const g=new Game();g.start(0,true);g.enemies=[];
    const room=g.level.bonusRooms![2],wall=g.level.breakableWalls![room.wallIndex];
    g.brokenWalls.add(room.wallIndex);Object.assign(g.player,{x:wall.x-1.1,y:wall.y,grounded:true});
    const enter=emptyInput();enter.pressed.add("up");g.update(enter);expect(g.bonus).not.toBeNull();
    const left=emptyInput();left.held.add("left");left.held.add("run");
    for(let i=0;i<90;i++)g.update(left);
    expect(g.bonus).not.toBeNull();expect(g.player.x).toBeGreaterThanOrEqual(1.04);
    const right=emptyInput();right.held.add("right");right.held.add("run");
    for(let i=0;i<240 && g.bonus;i++)g.update(right);
    expect(g.bonus).toBeNull();expect(g.phase).toBe("playing");
  });

  it("permanently plugs a visited entrance for this run, even without collecting loot", () => {
    const g=new Game();g.start(0,true);g.enemies=[];g.animals=[];
    const index=2,room=g.level.bonusRooms![index],wall=g.level.breakableWalls![room.wallIndex];
    const approach=()=>{Object.assign(g.player,{x:wall.x-1.1,y:wall.y,vx:0,vy:0,grounded:true});const input=emptyInput();input.pressed.add("up");g.update(input);};
    g.brokenWalls.add(room.wallIndex);approach();expect(g.bonus?.index).toBe(index);
    g.leaveBonus();expect(g.collectedBonus.size).toBe(0);expect(g.isBonusCompleted(index)).toBe(true);
    g.bonusDoorCooldown=0;approach();expect(g.bonus).toBeNull();
    g.player.invincible=0;g.damage(true);g.bonusDoorCooldown=0;approach();
    expect(g.bonus).toBeNull();expect(g.isBonusCompleted(index)).toBe(true);
    // The bonus plug is a closed doorway behind the main route, not a new
    // barrier across the route. Breaking/throwing at it must not re-enable entry.
    g.player.roll=.4;g.thrown.push({x:wall.x,y:wall.y+1,vx:1,vy:0,active:true});approach();
    expect(g.bonus).toBeNull();expect(g.isBonusCompleted(index)).toBe(true);
    expect(g.isBonusCompleted(1)).toBe(false);
    g.start(0,true);expect(g.isBonusCompleted(index)).toBe(false);
  });

  it("recognizes rewards from a completed visit in a hot-reloaded older game", () => {
    const g=new Game();g.start(0,true);g.collectedBonus.add("2-0");
    expect(g.isBonusCompleted(2)).toBe(true);expect(g.isBonusCompleted(1)).toBe(false);
  });

  it("exposes ROM ExitDoor finish volume on jungle", () => {
    expect(ROM_JUNGLE.finishZone).toBeDefined();
    expect(ROM_JUNGLE.finishZone!.x).toBeCloseTo(5296 / 32, 3);
  });

  it("NutThrowingNecky throws nuts toward the player", () => {
    const game = new Game();
    game.start(0, true);
    const necky = game.enemies.find((e) => e.throwsNuts);
    expect(necky).toBeDefined();
    expect(necky!.throwsNuts).toBe(true);
    let sawShot = false;
    for (let i = 0; i < 120; i++) {
      game.player.x = necky!.x + 10;
      game.player.y = necky!.y - 1.4;
      game.player.vy = 0;
      game.player.grounded = true;
      necky!.shootCooldown = Math.min(necky!.shootCooldown, 0.05);
      game.update(emptyInput());
      if (game.enemyShots.length > 0) sawShot = true;
    }
    expect(sawShot).toBe(true);
  });

  it("keeps Necky-family enemies on a fixed column", () => {
    const game = new Game();
    game.start(0, true);
    const necky = game.enemies.find((e) => e.pattern === "necky");
    expect(necky).toBeDefined();
    const startX = necky!.x;
    const input = emptyInput();
    input.held.add("right");
    for (let i = 0; i < 90; i++) game.update(input);
    expect(necky!.x).toBeCloseTo(startX, 5);
  });

  it("counts cannon gravity and control delays in simulation steps", () => {
    const game = new Game();
    game.start(0, true);
    const index = game.level.barrels.findIndex((b) => b.kind === "cannon");
    expect(index).toBeGreaterThanOrEqual(0);
    const barrel = game.level.barrels[index];
    game.player.x = barrel.x;
    game.player.y = barrel.y;
    game.update(emptyInput());
    expect(game.player.cannon).toBe(index);
    const launch = emptyInput();
    launch.pressed.add("jump");
    game.update(launch);
    const g0 = game.player.cannonGravityDelay;
    const c0 = game.player.cannonControlDelay;
    expect(g0).toBe(barrel.cannonGravityDelay ?? 16);
    expect(c0).toBe(barrel.cannonControlDelay ?? 16);
    game.update(emptyInput());
    expect(game.player.cannonGravityDelay).toBe(Math.max(0, g0 - 1));
    expect(game.player.cannonControlDelay).toBe(Math.max(0, c0 - 1));
    expect(STEP).toBeCloseTo(1 / 60, 8);
  });
});
