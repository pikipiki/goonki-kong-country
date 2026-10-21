import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const output=fileURLToPath(new URL('../reference/',import.meta.url));
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:1000,height:900},hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:5174/');
  await page.waitForFunction(()=>!!window.goonk);
  await page.evaluate(()=>{window.goonk.save.unlocked=0;});
  await page.getByRole('button',{name:/Explorer l’île|Explorer la carte|Carte de l’île/}).click();
  await page.locator('.island-map canvas').waitFor();
  await page.locator('.level-card').nth(3).click();
  await page.waitForTimeout(2300);
  assert.equal(await page.locator('.level-card').nth(3).getAttribute('aria-pressed'),'true');
  for(let i=0;i<7;i++) assert(await page.locator('.level-card').nth(i).isEnabled());
  await page.locator('.island-map').screenshot({path:output+'island-map-landscape.png'});
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);
  await page.locator('.island-map').screenshot({path:output+'island-map-portrait.png'});
  await page.locator('.map-enter').click();
  await page.waitForFunction(()=>window.goonk.phase==='playing'&&window.goonk.levelId===3);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({mapCanvas:true,selection:true,allStagesAccessible:true,enterSelectedLevel:true,formats:2,errors}));
}finally{await browser.close();}
