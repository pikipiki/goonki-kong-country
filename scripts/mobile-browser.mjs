import { chromium } from "playwright";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
const output = fileURLToPath(new URL("../reference", import.meta.url));
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.BROWSER_EXECUTABLE ||
    (process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : undefined),
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
});
const page = await context.newPage(),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
await page.goto(process.env.GAME_URL || "http://127.0.0.1:5174/");
  await page.locator('.lang-select-input').selectOption('fr');
  await page.waitForFunction(()=>document.documentElement.lang==='fr');
await page.waitForTimeout(1700);
await page.screenshot({ path: output + "/mobile-title.png" });
await page.getByRole("button", { name: "Commencer l’aventure" }).click();
await page.waitForTimeout(600);
const client = await context.newCDPSession(page),
  center = async (selector) => {
    const r = await page.locator(selector).boundingBox();
    assert(r);
    return {
      x: r.x + r.width / 2,
      y: r.y + r.height / 2,
      radiusX: 5,
      radiusY: 5,
      force: 1,
    };
  };
const right = await center(".direction-button.right"),
  jump = await center(".jump-button");
const start = await page.evaluate(() => window.goonk.player.x);
await client.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [{ ...right, id: 1 }],
});
await page.waitForTimeout(270);
await client.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [
    { ...right, id: 1 },
    { ...jump, id: 2 },
  ],
});
await page.waitForTimeout(190);
const airborne = await page.evaluate(() => ({
  x: window.goonk.player.x,
  y: window.goonk.player.y,
}));
assert(airborne.x > start + 0.8);
assert(airborne.y > 0.5);
await client.send("Input.dispatchTouchEvent", {
  type: "touchEnd",
  touchPoints: [],
});
await page.waitForTimeout(600);
await page.waitForFunction(() => window.goonk.player.vx === 0, null, {timeout:2000});
const scene = await page.locator(".scene").boundingBox(),
  deck = await page.locator(".controller-deck").boundingBox();
assert(scene.y + scene.height <= deck.y + 1);
for (const selector of [
  ".jump-button",
  ".action-button",
  ".swap-button",
  ".direction-button.left",
  ".direction-button.right",
]) {
  const r = await page.locator(selector).boundingBox();
  assert(r.width >= 44 && r.height >= 44, selector);
}
await page.screenshot({ path: output + "/mobile-portrait.png" });
await page.setViewportSize({ width: 844, height: 390 });
await page.waitForTimeout(700);
assert.equal(await page.evaluate(() => window.goonk.phase), "playing");
assert(await page.locator(".jump-button").isVisible());
await page.getByRole("button", { name: "Mode tactile" }).click();
const before = await page.evaluate(() => window.goonk.player.x);
await page.getByRole("button", { name: "Aller à droite" }).click();
await page.waitForTimeout(500);
assert((await page.evaluate(() => window.goonk.player.x)) > before + 1);
await page.getByRole("button", { name: "Arrêter le déplacement" }).click();
await page.waitForTimeout(250);
await page.waitForFunction(() => window.goonk.player.vx === 0, null, {timeout:2000});
await page.getByRole("button", { name: "Sauter", exact: true }).click();
await page.waitForTimeout(160);
assert((await page.evaluate(() => window.goonk.player.y)) > 0.4);
await page.waitForTimeout(600);
await page.screenshot({ path: output + "/mobile-landscape.png" });
await page.getByRole("button", { name: "Mettre en pause" }).click();
const paused = await page.evaluate(() => window.goonk.time);
await page.waitForTimeout(350);
assert.equal(await page.evaluate(() => window.goonk.time), paused);
await page.getByRole("button", { name: "Reprendre", exact: true }).click();
for (const size of [
  { width: 320, height: 568 },
  { width: 430, height: 932 },
  { width: 932, height: 430 },
  { width: 768, height: 1024 },
]) {
  await page.setViewportSize(size);
  await page.waitForTimeout(250);
  const metrics = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
    button: document
      .querySelector(".jump-button")
      .getBoundingClientRect()
      .toJSON(),
  }));
  assert(metrics.scroll <= metrics.width);
  assert(metrics.button.x >= 0 && metrics.button.right <= metrics.width + 1, JSON.stringify({size, metrics}));
  assert(metrics.button.y >= 0 && metrics.button.bottom <= size.height + 1);
}
await page.setViewportSize({ width: 844, height: 390 });
for (const id of [1, 2, 3, 4, 5, 6, 0]) {
  await page.evaluate((id) => window.goonk.load(id), id);
  await page.waitForTimeout(380);
}
await page.waitForFunction(() => window.goonkDiagnostics?.sceneRevision === window.goonk.sceneRevision, null, {timeout:5000});
const diagnostics = await page.evaluate(() => window.goonkDiagnostics);
assert(diagnostics.drawCalls < 300, JSON.stringify(diagnostics));
assert(diagnostics.dpr <= 1.35);
await page.evaluate(() => window.goonk.load(0, "title"));
await page.waitForTimeout(300);
await page.screenshot({ path: output + "/mobile-title-landscape.png" });
assert.deepEqual(errors, []);
console.log(
  JSON.stringify({
    multitouch: true,
    clickOnly: true,
    orientationRotation: true,
    phoneSizes: 6,
    pause: true,
    stageTransitions: 7,
    errors,
    diagnostics,
  }),
);
await browser.close();
