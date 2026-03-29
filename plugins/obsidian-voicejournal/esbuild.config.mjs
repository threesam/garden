import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import { mkdirSync, copyFileSync, readFileSync, existsSync, statSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Find the actual git repo root using only Node.js fs — works in both the main
 * checkout and a detached worktree (where .git is a file, not a directory).
 */
function findRepoRoot(startDir) {
  let dir = startDir;
  while (true) {
    const gitPath = join(dir, ".git");
    if (existsSync(gitPath)) {
      if (statSync(gitPath).isDirectory()) {
        return dir; // main checkout
      }
      // Worktree: .git is a file containing "gitdir: /main/.git/worktrees/name"
      const content = readFileSync(gitPath, "utf8").trim();
      const match = content.match(/^gitdir:\s*(.+)$/);
      if (match) {
        // Resolve relative gitdir path, then go up 3 levels: worktrees/name -> .git -> repo
        return resolve(dir, match[1], "../../..");
      }
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) return startDir; // reached filesystem root
    dir = parent;
  }
}

const repoRoot = findRepoRoot(__dirname);
const outDir = join(repoRoot, "content/.obsidian/plugins/voice-journal");

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
  await context.dispose();
  process.exit(0);
} else {
  await context.watch();
}
