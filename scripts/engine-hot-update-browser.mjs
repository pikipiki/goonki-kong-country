// Regression for retained Game instances after a Vite development hot update.
// Requires the canonical development server at GAME_URL (default :5174).
// Temporarily appends a harmless prototype marker, then restores engine.ts.
import { chromium } from 'playwright';
import {fileURLToPath} from 'node:url';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=root+'reference/';
const token=String(Date.now());
const file=root+'src/game/engine.ts',original=readFileSync(file,'utf8'),changed=original+`\nObject.defineProperty(Game.prototype, 'hotReloadRegressionProbe', {value: '${token}'});\n`;
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:700,height:963}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5174/');await page.waitForFunction(()=>!!window.goonkScene);
 console.log(await page.evaluate(async()=>({sync:(await(await fetch('/src/App.tsx')).text()).includes('Object.setPrototypeOf'), terrain:(await(await fetch('/src/game/canyonTerrain.ts')).text()).includes('26304')})));
 await page.evaluate(()=>{const g=window.goonk;g.start(1,true);const b=g.level.barrels[2];Object.assign(g.player,{x:b.x,y:b.y,cannon:2,grounded:false});window.hmrRetainedGame=g;window.hmrOldPrototype=Object.getPrototypeOf(g);});
 writeFileSync(file,changed);
 await page.waitForFunction(token=>window.goonk.hotReloadRegressionProbe===token,token,{timeout:12000});
 const retained=await page.evaluate(()=>({identity:window.goonk===window.hmrRetainedGame,updated:Object.getPrototypeOf(window.goonk)!==window.hmrOldPrototype,x:window.goonk.player.x,cannon:window.goonk.player.cannon}));
 console.log(JSON.stringify({retained}));assert.equal(retained.identity,true);assert.equal(retained.updated,true);assert.equal(retained.cannon,2);assert.equal(retained.x,18.75);
 await page.screenshot({path:out+'canyon-live-collision-fixed.png'});
 await page.keyboard.press('Space');await page.waitForFunction(()=>window.goonk.player.x>29,null,{timeout:5000});
 const shot=await page.evaluate(()=>({x:window.goonk.player.x,y:window.goonk.player.y,hp:window.goonk.player.hp,lives:window.goonk.lives}));
 assert.equal(shot.hp,2);assert.equal(shot.lives,5);assert.deepEqual(errors,[]);
 const result={retained,shot,errors};writeFileSync(out+'canyon-hmr-regression.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
} finally {
 if(readFileSync(file,'utf8')===changed)writeFileSync(file,original);
 await browser.close();
}
