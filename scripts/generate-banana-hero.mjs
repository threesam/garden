// Bakes the /thoughts/certainly-uncertain hero: an ASCII banana whose glyphs
// are the chemical names that legally hide under "natural flavors" (isoamyl
// acetate IS artificial banana flavor — the list is the banana). Same deana
// tone-ramp shading as the gallery prints; chemical words drawn full-black so
// they pop out of the warm shading. Silhouette is pixel-traced from the source
// photo (yellow mask, largest blob, interior-hole fill — no convex fill so the
// crescent survives).
//
// Run: pnpm bake:banana   (outputs static/assets/certainly-uncertain-hero.webp)

import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "static/assets/banana-natural-flavors-src.webp";
const OUT = "static/assets/certainly-uncertain-hero.webp";
const COIN = [232, 163, 23], SHADE_DARK = [92, 58, 14];

// RAMP + lumToTone copied from src/lib/ascii/ascii-utils.ts so the glyph
// selection matches the deana prints.
const RAMP = " `.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@";
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lumToTone = (lum) => { const s = clamp((lum - 0.1) / 0.65, 0, 1); const s2 = s*s*(3-2*s); return 1 - s2*s2*(3-2*s2); };

const CHEMS = ["natural flavors","isoamyl acetate","ethyl butyrate","ethyl acetate","ethyl propionate","ethyl hexanoate","ethyl maltol","ethyl vanillin","amyl acetate","benzyl acetate","methyl anthranilate","methyl salicylate","methyl butyrate","methyl cinnamate","propyl acetate","butyl butyrate","hexyl acetate","octyl acetate","geranyl acetate","linalyl acetate","citronellyl acetate","allyl hexanoate","ethyl cinnamate","benzaldehyde","vanillin","cinnamaldehyde","citral","hexanal","trans-2-hexenal","decanal","octanal","nonanal","anisaldehyde","furfural","phenylacetaldehyde","heptanal","diacetyl","acetoin","2,3-pentanedione","raspberry ketone","maltol","beta-ionone","alpha-ionone","menthone","carvone","beta-damascenone","limonene","linalool","geraniol","citronellol","nerol","alpha-terpineol","myrcene","alpha-pinene","beta-pinene","camphene","ocimene","beta-caryophyllene","menthol","eucalyptol","terpinolene","humulene","alpha-bisabolol","nerolidol","valencene","hexanol","cis-3-hexen-1-ol","benzyl alcohol","phenethyl alcohol","furfuryl alcohol","1-octen-3-ol","octanol","acetic acid","butyric acid","hexanoic acid","octanoic acid","propionic acid","isovaleric acid","lactic acid","citric acid","malic acid","benzoic acid","sorbic acid","gamma-decalactone","gamma-undecalactone","delta-decalactone","gamma-nonalactone","gamma-octalactone","gamma-dodecalactone","2-acetylpyrazine","2,3-dimethylpyrazine","eugenol","isoeugenol","guaiacol","thymol","carvacrol","creosol","propylene glycol","glycerol","triacetin","triethyl citrate","benzyl benzoate","polysorbate 80","dipropylene glycol","gum arabic","modified food starch","BHA","BHT","sodium benzoate","potassium sorbate","ethyl alcohol","dimethyl sulfide","furaneol","sotolon","ethyl lactate","isobutyl acetate","isoamyl butyrate","ethyl heptanoate","ethyl octanoate","ethyl decanoate","methyl hexanoate","cis-3-hexenyl acetate"];

const RATIO = 1.8, COLS = 184;
const yellow = (r, g, b) => (g - b) > 55 && (r - b) > 60 && (0.2126*r+0.7152*g+0.0722*b)/255 > 0.42;

const meta = await sharp(SRC).metadata();
const PW = 300, PH = Math.round(PW * meta.height / meta.width);
const probe = await sharp(SRC).resize(PW, PH, { fit: "fill" }).removeAlpha().raw().toBuffer();
let minx = PW, miny = PH, maxx = 0, maxy = 0;
for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) { const o = (y*PW+x)*3;
  if (yellow(probe[o], probe[o+1], probe[o+2])) { if(x<minx)minx=x; if(x>maxx)maxx=x; if(y<miny)miny=y; if(y>maxy)maxy=y; } }
const pad = 0.04;
const bx = Math.max(0, (minx/PW - pad)) * meta.width, by = Math.max(0, (miny/PH - pad)) * meta.height;
const bw = Math.min(meta.width, (maxx/PW + pad) * meta.width) - bx, bh = Math.min(meta.height, (maxy/PH + pad) * meta.height) - by;
const ROWS = Math.max(8, Math.round(COLS * (bh / bw) / RATIO));

const { data } = await sharp(SRC).extract({ left: Math.round(bx), top: Math.round(by), width: Math.round(bw), height: Math.round(bh) })
  .resize(COLS, ROWS, { fit: "fill" }).toColourspace("srgb").removeAlpha().raw().toBuffer({ resolveWithObject: true });
const at = (x, y) => { const o = (y*COLS+x)*3; return [data[o], data[o+1], data[o+2]]; };
const lumAt = (x, y) => { const [r,g,b] = at(x,y); return (0.2126*r+0.7152*g+0.0722*b)/255; };

const raw = Array.from({length:ROWS},(_,y)=>Array.from({length:COLS},(_,x)=>yellow(...at(x,y))));
const seen = Array.from({length:ROWS},()=>new Array(COLS).fill(false)); let best=[];
for (let y=0;y<ROWS;y++) for (let x=0;x<COLS;x++){ if(!raw[y][x]||seen[y][x])continue;
  const comp=[],st=[[y,x]];seen[y][x]=true;
  while(st.length){const [cy,cx]=st.pop();comp.push([cy,cx]);
    for(const[dy,dx]of[[1,0],[-1,0],[0,1],[0,-1]]){const ny=cy+dy,nx=cx+dx;if(ny>=0&&ny<ROWS&&nx>=0&&nx<COLS&&raw[ny][nx]&&!seen[ny][nx]){seen[ny][nx]=true;st.push([ny,nx]);}}}
  if(comp.length>best.length)best=comp; }
const mask = Array.from({length:ROWS},()=>new Array(COLS).fill(false));
for(const[y,x]of best)mask[y][x]=true;
const bg=Array.from({length:ROWS},()=>new Array(COLS).fill(false)); const q=[];
for(let x=0;x<COLS;x++){[[0,x],[ROWS-1,x]].forEach(([y,xx])=>{if(!mask[y][xx]&&!bg[y][xx]){bg[y][xx]=true;q.push([y,xx]);}});}
for(let y=0;y<ROWS;y++){[[y,0],[y,COLS-1]].forEach(([yy,x])=>{if(!mask[yy][x]&&!bg[yy][x]){bg[yy][x]=true;q.push([yy,x]);}});}
while(q.length){const[cy,cx]=q.pop();for(const[dy,dx]of[[1,0],[-1,0],[0,1],[0,-1]]){const ny=cy+dy,nx=cx+dx;if(ny>=0&&ny<ROWS&&nx>=0&&nx<COLS&&!mask[ny][nx]&&!bg[ny][nx]){bg[ny][nx]=true;q.push([ny,nx]);}}}
for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(!mask[y][x]&&!bg[y][x])mask[y][x]=true;

let wi=0,word="",wp=0,gap=0;
const nextWord=()=>{word=CHEMS[wi%CHEMS.length].replace(/ /g,"·");wi++;wp=0;};
nextWord();
const grid=[];
for(let y=0;y<ROWS;y++){const row=[];
  for(let x=0;x<COLS;x++){ if(!mask[y][x]){row.push(null);continue;}
    const tone=lumToTone(lumAt(x,y));
    if(gap>0){gap--;const g=RAMP[Math.floor(tone*(RAMP.length-1))]??" ";row.push({ch:g===" "?"·":g,tone,isWord:false});}
    else{const ch=word[wp++]??"·";row.push({ch,tone,isWord:true});if(wp>=word.length){nextWord();gap=2+Math.round(tone*8);}} }
  grid.push(row); }

const CP=7,cw=CP,ch=CP*RATIO,W=COLS*cw,H=ROWS*ch,fs=Math.max(4,Math.floor(ch*0.92));
const esc=(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&apos;",'"':"&quot;"}[c]??c);
const lerp=(a,b,t)=>Math.round(a+(b-a)*t);
const sf=(tone)=>{const t=Math.min(1,tone*0.85);return `rgb(${lerp(COIN[0],SHADE_DARK[0],t)},${lerp(COIN[1],SHADE_DARK[1],t)},${lerp(COIN[2],SHADE_DARK[2],t)})`;};
const parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,`<rect width="${W}" height="${H}" fill="rgb(${COIN[0]},${COIN[1]},${COIN[2]})"/>`,`<g font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${fs}" dominant-baseline="text-before-edge">`];
for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const c=grid[y][x];if(!c)continue;parts.push(`<text x="${(x*cw).toFixed(1)}" y="${(y*ch).toFixed(1)}" fill="${c.isWord?"#120d02":sf(c.tone)}">${esc(c.ch)}</text>`);}
parts.push("</g></svg>");
const svg = Buffer.from(parts.join(""));
mkdirSync("static/assets", { recursive: true });
const info = await sharp(svg, { density: 200 }).resize(1400).webp({ quality: 72, effort: 6 }).toFile(OUT);
console.log(`${OUT}: ${COLS}x${ROWS} glyph grid -> ${Math.round(info.width)}x${Math.round(info.height)}, ${Math.round(info.size/1024)}KB`);
