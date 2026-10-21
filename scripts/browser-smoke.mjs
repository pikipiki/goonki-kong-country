// Controlled scene setup checks rendering; physics route traversal is tested separately in tests/routes.test.ts.
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
const base = fileURLToPath(new URL("../reference", import.meta.url));
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.BROWSER_EXECUTABLE ||
    (process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : undefined),
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
await page.goto(process.env.GAME_URL || "http://127.0.0.1:5174/");
  await page.locator('.lang-select-input').selectOption('fr');
  await page.waitForFunction(()=>document.documentElement.lang==='fr');
await page.waitForTimeout(1200);
await page.screenshot({ path: base + "/title-desktop.png" });
await page.getByRole("button", { name: "Commencer l’aventure" }).click();
await page.keyboard.down("Space");
await page.waitForTimeout(180);
assert((await page.evaluate(() => window.goonk.player.y)) > 0.5);
await page.keyboard.up("Space");
await page.waitForTimeout(1000);
await page.keyboard.press("KeyC");
await page.waitForTimeout(180);
assert.equal(await page.evaluate(() => window.goonk.player.active), 1);
for (const [id, name] of [
  [1, "canopy"],
  [2, "mine"],
  [3, "lagoon"],
  [4, "snow"],
  [5, "temple"],
  [6, "boss"],
]) {
  await page.evaluate((id) => window.goonk.load(id), id);
  await page.waitForTimeout(900);
  await page.screenshot({ path: base + `/stage-${name}.png` });
  assert.equal(await page.evaluate(() => window.goonk.phase), "playing");
}
await page.evaluate(() => window.goonk.load(0));
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(500);
const before = await page.evaluate(() => window.goonk.player.x);
const button = page.getByRole("button", {
  name: "Aller à droite",
  exact: true,
});
const rect = await button.boundingBox();
await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
await page.mouse.down();
await page.waitForTimeout(450);
await page.mouse.up();
const after = await page.evaluate(() => window.goonk.player.x);
assert(after > before + 0.7);
await page.screenshot({ path: base + "/game-mobile.png" });
await page.evaluate(() => window.goonk.load(0, "title"));
await page.waitForTimeout(500);
await page.screenshot({ path: base + "/title-mobile.png" });
assert.deepEqual(errors, []);
console.log(
  JSON.stringify({
    jump: true,
    swap: true,
    touchMovement: { before, after },
    stageRenders: 6,
    errors,
  }),
);
await browser.close();
