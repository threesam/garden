// SCRATCH: banana traced (by eye) from the photo — diagonal lie, fat middle,
// tapered tip, cylinder shading. deana ramp + words pop. coin bg.
import sharp from "sharp";
import { writeFileSync } from "node:fs";
const OUT = "/Users/salvatoredangelo/.claude/jobs/69c81f6d/tmp/banana.html";
const PNG = "/Users/salvatoredangelo/.claude/jobs/69c81f6d/tmp/banana.png";
const COIN = [232, 163, 23], SHADE_DARK = [92, 58, 14];
const RAMP = " `.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@";
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lumToTone = (lum) => { const s = clamp((lum - 0.1) / 0.65, 0, 1); const s2 = s*s*(3-2*s); return 1 - s2*s2*(3-2*s2); };
const CHEMS = ["natural flavors","isoamyl acetate","ethyl butyrate","ethyl acetate","ethyl propionate","ethyl hexanoate","ethyl maltol","ethyl vanillin","amyl acetate","benzyl acetate","methyl anthranilate","methyl salicylate","methyl butyrate","methyl cinnamate","propyl acetate","butyl butyrate","hexyl acetate","octyl acetate","geranyl acetate","linalyl acetate","citronellyl acetate","allyl hexanoate","ethyl cinnamate","benzaldehyde","vanillin","cinnamaldehyde","citral","hexanal","trans-2-hexenal","decanal","octanal","nonanal","anisaldehyde","furfural","phenylacetaldehyde","heptanal","diacetyl","acetoin","2,3-pentanedione","raspberry ketone","maltol","beta-ionone","alpha-ionone","menthone","carvone","beta-damascenone","limonene","linalool","geraniol","citronellol","nerol","alpha-terpineol","myrcene","alpha-pinene","beta-pinene","camphene","ocimene","beta-caryophyllene","menthol","eucalyptol","terpinolene","humulene","alpha-bisabolol","nerolidol","valencene","hexanol","cis-3-hexen-1-ol","benzyl alcohol","phenethyl alcohol","furfuryl alcohol","1-octen-3-ol","octanol","acetic acid","butyric acid","hexanoic acid","octanoic acid","propionic acid","isovaleric acid","lactic acid","citric acid","malic acid","benzoic acid","sorbic acid","gamma-decalactone","gamma-undecalactone","delta-decalactone","gamma-nonalactone","gamma-octalactone","gamma-dodecalactone","2-acetylpyrazine","2,3-dimethylpyrazine","eugenol","isoeugenol","guaiacol","thymol","carvacrol","creosol","propylene glycol","glycerol","triacetin","triethyl citrate","benzyl benzoate","polysorbate 80","dipropylene glycol","gum arabic","modified food starch","BHA","BHT","sodium benzoate","potassium sorbate","ethyl alcohol","dimethyl sulfide","furaneol","sotolon","ethyl lactate","isobutyl acetate","isoamyl butyrate","ethyl heptanoate","ethyl octanoate","ethyl decanoate","methyl hexanoate","cis-3-hexenyl acetate"];

const COLS = 178, ROWS = 104, RATIO = 1.8;
// centerline (col,row), quadratic bezier: stem upper-left -> belly down-left -> tip lower-right
const P0 = [54, 16], P1 = [40, 92], P2 = [150, 74];
const TMAX = 15.5, AMB = 0.18;
const bez = (t) => { const u = 1 - t;
  return [u*u*P0[0] + 2*u*t*P1[0] + t*t*P2[0], u*u*P0[1] + 2*u*t*P1[1] + t*t*P2[1]]; };
const der = (t) => [2*(1-t)*(P1[0]-P0[0]) + 2*t*(P2[0]-P1[0]), 2*(1-t)*(P1[1]-P0[1]) + 2*t*(P2[1]-P1[1])];
// thickness profile: blunt-ish stem, fat middle, pointed tip
const prof = (s) => Math.pow(Math.sin(Math.PI * Math.pow(s, 0.9)), 0.62) * (1 - 0.30 * s) + 0.10 * (1 - s);
// sample centerline in visual coords
const N = 160, pts = [];
for (let i = 0; i <= N; i++) { const s = i / N; const [cx, cy] = bez(s); const [dx, dy] = der(s);
  const tlen = Math.hypot(dx, dy * RATIO) || 1;
  pts.push({ x: cx, y: cy * RATIO, s, px: -(dy * RATIO) / tlen, py: dx / tlen, T: TMAX * prof(s) }); }
const Lp = (() => { const v = [-0.45, -0.62]; const m = Math.hypot(...v); return [v[0]/m, v[1]/m]; })();

const shade = (col, row) => {
  const X = col, Y = row * RATIO; let best = null, bd = 1e9;
  for (const p of pts) { const d = (X-p.x)**2 + (Y-p.y)**2; if (d < bd) { bd = d; best = p; } }
  const dist = Math.sqrt(bd); if (dist > best.T) return null;
  const off = (X - best.x) * best.px + (Y - best.y) * best.py; // signed perp offset
  const across = clamp(off / best.T, -1, 1);
  const odir = dist > 0.001 ? [(X-best.x)/dist, (Y-best.y)/dist] : [0, -1];
  const topness = clamp(0.5 + 0.5 * (odir[0]*Lp[0] + odir[1]*Lp[1]), 0, 1);
  const lum = clamp(AMB + (1-AMB) * (0.55*Math.sqrt(1 - across*across) + 0.45*topness), 0, 1);
  return lumToTone(lum);
};

let wi = 0, word = "", wp = 0, gap = 0;
const nextWord = () => { word = CHEMS[wi % CHEMS.length].replace(/ /g, "·"); wi++; wp = 0; };
nextWord();
const grid = [];
for (let y = 0; y < ROWS; y++) { const row = [];
  for (let x = 0; x < COLS; x++) { const tone = shade(x, y);
    if (tone == null) { row.push(null); continue; }
    if (gap > 0) { gap--; const g = RAMP[Math.floor(tone*(RAMP.length-1))] ?? " "; row.push({ ch: g===" "?"·":g, tone, isWord:false }); }
    else { const ch = word[wp++] ?? "·"; row.push({ ch, tone, isWord:true }); if (wp>=word.length){ nextWord(); gap = 2+Math.round(tone*8); } } }
  grid.push(row); }
console.log(grid.map((r)=>r.map((c)=>c?c.ch:" ").join("").replace(/\s+$/,"")).join("\n"));

const CP=7, cw=CP, ch=CP*RATIO, W=COLS*cw, H=ROWS*ch, fs=Math.max(4,Math.floor(ch*0.92));
const esc=(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&apos;",'"':"&quot;"}[c]??c);
const lerp=(a,b,t)=>Math.round(a+(b-a)*t);
const sf=(tone)=>{const t=Math.min(1,tone*0.85);return `rgb(${lerp(COIN[0],SHADE_DARK[0],t)},${lerp(COIN[1],SHADE_DARK[1],t)},${lerp(COIN[2],SHADE_DARK[2],t)})`;};
const parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,`<rect width="${W}" height="${H}" fill="rgb(${COIN[0]},${COIN[1]},${COIN[2]})"/>`,`<g font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${fs}" dominant-baseline="text-before-edge">`];
for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const c=grid[y][x];if(!c)continue;parts.push(`<text x="${(x*cw).toFixed(1)}" y="${(y*ch).toFixed(1)}" fill="${c.isWord?"#120d02":sf(c.tone)}">${esc(c.ch)}</text>`);}
parts.push("</g></svg>");const svg=parts.join("");
writeFileSync(OUT,`<!doctype html><meta charset=utf-8><style>html,body{margin:0;background:#e8a317}.w{min-height:100vh;display:grid;place-items:center;padding:3vh 1vw}svg{width:min(96vw,1050px);height:auto}</style><div class=w>${svg}</div>`);
await sharp(Buffer.from(svg),{density:200}).png().toFile(PNG);
console.log("\n--- banana(traced) rendered ---");
