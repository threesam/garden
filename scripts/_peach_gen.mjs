// SCRATCH (not committed): chemical-word sphere. Clean circle, procedurally
// lit (light from top), deana tone-ramp shading + words popping in black.
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const OUT = "/Users/salvatoredangelo/.claude/jobs/69c81f6d/tmp/peach2.html";
const COIN = [232, 163, 23];
const SHADE_DARK = [92, 58, 14];

const RAMP = " `.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@";
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function lumToTone(lum) {
  const stretched = clamp((lum - 0.1) / 0.65, 0, 1);
  const s2 = stretched * stretched * (3 - 2 * stretched);
  return 1 - s2 * s2 * (3 - 2 * s2);
}

const CHEMS = ["natural flavors","ethyl butyrate","ethyl acetate","ethyl propionate","ethyl hexanoate","ethyl maltol","ethyl vanillin","isoamyl acetate","amyl acetate","benzyl acetate","methyl anthranilate","methyl salicylate","methyl butyrate","methyl cinnamate","propyl acetate","butyl butyrate","hexyl acetate","octyl acetate","geranyl acetate","linalyl acetate","citronellyl acetate","allyl hexanoate","ethyl cinnamate","benzaldehyde","vanillin","cinnamaldehyde","citral","hexanal","trans-2-hexenal","decanal","octanal","nonanal","anisaldehyde","furfural","phenylacetaldehyde","heptanal","diacetyl","acetoin","2,3-pentanedione","raspberry ketone","maltol","beta-ionone","alpha-ionone","menthone","carvone","beta-damascenone","limonene","linalool","geraniol","citronellol","nerol","alpha-terpineol","myrcene","alpha-pinene","beta-pinene","camphene","ocimene","beta-caryophyllene","menthol","eucalyptol","terpinolene","humulene","alpha-bisabolol","nerolidol","valencene","hexanol","cis-3-hexen-1-ol","benzyl alcohol","phenethyl alcohol","furfuryl alcohol","1-octen-3-ol","octanol","acetic acid","butyric acid","hexanoic acid","octanoic acid","propionic acid","isovaleric acid","lactic acid","citric acid","malic acid","benzoic acid","sorbic acid","gamma-decalactone","gamma-undecalactone","delta-decalactone","gamma-nonalactone","gamma-octalactone","gamma-dodecalactone","2-acetylpyrazine","2,3-dimethylpyrazine","eugenol","isoeugenol","guaiacol","thymol","carvacrol","creosol","propylene glycol","glycerol","triacetin","triethyl citrate","benzyl benzoate","polysorbate 80","dipropylene glycol","gum arabic","modified food starch","BHA","BHT","sodium benzoate","potassium sorbate","ethyl alcohol","dimethyl sulfide","furaneol","sotolon","ethyl lactate","isobutyl acetate","isoamyl butyrate","ethyl heptanoate","ethyl octanoate","ethyl decanoate","methyl hexanoate","cis-3-hexenyl acetate"];

const COLS = 150, ROWS = 84, HEIGHT_RATIO = 1.8;
const cx = (COLS - 1) / 2, cy = (ROWS - 1) / 2;
const Rcol = 71;                 // sphere radius in columns
// light from top, slightly right, toward viewer (echoes the photo)
const L = (() => { const v = [0.30, -0.62, 0.73]; const m = Math.hypot(...v); return v.map((c) => c / m); })();
const AMBIENT = 0.16;

// per-cell sphere shading -> tone
const shade = (x, y) => {
  const vx = (x - cx) / Rcol;
  const vy = ((y - cy) * HEIGHT_RATIO) / Rcol;
  const r2 = vx * vx + vy * vy;
  if (r2 > 1) return null;            // outside circle
  const nz = Math.sqrt(1 - r2);
  const diff = Math.max(0, vx * L[0] + vy * L[1] + nz * L[2]);
  const lum = clamp(AMBIENT + (1 - AMBIENT) * diff, 0, 1);
  return lumToTone(lum);
};

let wi = 0, word = "", wp = 0, gap = 0;
const nextWord = () => { word = CHEMS[wi % CHEMS.length].replace(/ /g, "·"); wi++; wp = 0; };
nextWord();
const grid = [];
for (let y = 0; y < ROWS; y++) {
  const row = [];
  for (let x = 0; x < COLS; x++) {
    const tone = shade(x, y);
    if (tone == null) { row.push(null); continue; }
    if (gap > 0) { gap--; const glyph = RAMP[Math.floor(tone * (RAMP.length - 1))] ?? " ";
      row.push({ ch: glyph === " " ? "·" : glyph, tone, isWord: false });
    } else { const ch = word[wp++] ?? "·";
      row.push({ ch, tone, isWord: true });
      if (wp >= word.length) { nextWord(); gap = 2 + Math.round(tone * 9); }
    }
  }
  grid.push(row);
}
console.log(grid.map((r) => r.map((c) => (c ? c.ch : " ")).join("").replace(/\s+$/, "")).join("\n"));

const CELLPX = 7, cw = CELLPX, ch = CELLPX * HEIGHT_RATIO, W = COLS * cw, H = ROWS * ch;
const fs = Math.max(4, Math.floor(ch * 0.92));
const esc = (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&apos;", '"': "&quot;" }[c] ?? c);
const lerp = (a, b, t) => Math.round(a + (b - a) * t);
const shadeFill = (tone) => { const t = Math.min(1, tone * 0.85);
  return `rgb(${lerp(COIN[0], SHADE_DARK[0], t)},${lerp(COIN[1], SHADE_DARK[1], t)},${lerp(COIN[2], SHADE_DARK[2], t)})`; };
const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
  `<rect width="${W}" height="${H}" fill="rgb(${COIN[0]},${COIN[1]},${COIN[2]})"/>`,
  `<g font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${fs}" dominant-baseline="text-before-edge">`];
for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const c = grid[y][x]; if (!c) continue;
  const fill = c.isWord ? "#120d02" : shadeFill(c.tone);
  parts.push(`<text x="${(x * cw).toFixed(1)}" y="${(y * ch).toFixed(1)}" fill="${fill}">${esc(c.ch)}</text>`);
}
parts.push("</g></svg>");
const svg = parts.join("");
const html = `<!doctype html><meta charset=utf-8><title>peach</title><style>html,body{margin:0;background:#e8a317}.w{min-height:100vh;display:grid;place-items:center;padding:3vh 1vw}svg{width:min(94vw,920px);height:auto}</style><div class=w>${svg}</div>`;
writeFileSync(OUT, html);
writeFileSync("/Users/salvatoredangelo/.claude/jobs/69c81f6d/tmp/peach2.svg", svg);
await sharp(Buffer.from(svg), { density: 200 }).png().toFile("/Users/salvatoredangelo/.claude/jobs/69c81f6d/tmp/peach2.png");
console.log("\n--- sphere rendered ---");
