import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import { mkdirSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../../content/.obsidian/plugins/voice-journal");

// Ensure output directory exists and copy manifest
mkdirSync(outDir, { recursive: true });
copyFileSync(join(__dirname, "manifest.json"), join(outDir, "manifest.json"));

const prod = process.argv[2] === "production";

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtins,
  ],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: join(outDir, "main.js"),
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
