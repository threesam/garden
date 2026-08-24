// Bakes the OG card for the slime-moulds piece (static/og/physarum.png,
// 1200x630). Unlike the other OG images, this is NOT an ASCII treatment of a
// photo: physarum is generative art, and ASCII-ifying the plate would throw
// away exactly what makes it worth sharing. So we capture a real rendered
// frame of the running simulation, let it grow a network toward food, and
// compose that onto a branded card in the house mono type.
//
// Requires the preview server running: `pnpm preview --port 4173` in one
// shell, then `node scripts/generate-physarum-og.mjs`.

import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const BASE = process.env.OG_BASE ?? "http://localhost:4173";
const OUT = "static/og/physarum.png";
const W = 1200;
const H = 630;
const PLATE = 560; // rendered plate size on the card

// Deterministic-ish network: seed a ring of food sources around the centre and
// let the colony wire them together. Grid is 512; these are grid coordinates.
const FOOD = [
  [256, 120],
  [150, 200],
  [360, 200],
  [180, 330],
  [330, 330],
  [256, 256],
];

async function capturePlate() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
  await page.goto(`${BASE}/anything-but-analog/physarum`, {
    waitUntil: "domcontentloaded",
  });

  // Map grid coords onto the on-screen canvas and drop food, then let the
  // network form and thicken along the routes between sources.
  const box = await page.locator("canvas").boundingBox();
  if (!box) throw new Error("no canvas on the page");
  for (const [gx, gy] of FOOD) {
    await page.mouse.click(box.x + (gx / 512) * box.width, box.y + (gy / 512) * box.height);
  }
  await page.waitForTimeout(9000);

  const png = await page.locator("canvas").screenshot();
  await browser.close();
  return png;
}

async function render() {
  const plate = await sharp(await capturePlate())
    .resize(PLATE, PLATE, { fit: "cover" })
    .toBuffer();

  const plateLeft = W - PLATE - 60;
  const plateTop = Math.round((H - PLATE) / 2);

  // Left column: the same typographic treatment as og/default.png — mono, the
  // amber accent, a near-white title on true black to match the plate itself.
  const label = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#000000"/>
    <text x="72" y="250" font-family="ui-monospace, Menlo, monospace" font-size="88" font-weight="700" fill="#f5f4f0" letter-spacing="-3">slime</text>
    <text x="72" y="340" font-family="ui-monospace, Menlo, monospace" font-size="88" font-weight="700" fill="#f5f4f0" letter-spacing="-3">moulds</text>
    <text x="76" y="410" font-family="ui-monospace, Menlo, monospace" font-size="26" fill="#e8a317" letter-spacing="3">PHYSARUM · DICTYOSTELIUM</text>
    <text x="76" y="452" font-family="ui-monospace, Menlo, monospace" font-size="20" fill="#8a8a8f">rust · wasm · off the main thread</text>
    <text x="76" y="560" font-family="ui-monospace, Menlo, monospace" font-size="20" fill="#5a5a5f" letter-spacing="2">threesam.com</text>
  </svg>`;

  const png = await sharp(Buffer.from(label))
    .composite([{ input: plate, left: plateLeft, top: plateTop }])
    .png()
    .toBuffer();

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, png);
  console.log(`${OUT} — ${png.length} bytes`);
}

await render();
