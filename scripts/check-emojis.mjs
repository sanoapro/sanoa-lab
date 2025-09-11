import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { emojiTheme } from "../config/emojiTheme.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SCAN_DIRS = ["app", "components", "lib"];
const IGNORE = /(^|\/)(\.next|node_modules|logs|public|\.git)(\/|$)/;

const used = new Set();
const tokenProp = /token\s*=\s*["'`](.*?)["'`]/g;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (IGNORE.test(p)) continue;
    const s = statSync(p);
    if (s.isDirectory()) {
      walk(p);
    } else if (/\.(tsx?|jsx?)$/.test(p)) {
      const src = readFileSync(p, "utf8");
      let m;
      while ((m = tokenProp.exec(src))) used.add(m[1]);
    }
  }
}

for (const d of SCAN_DIRS) walk(join(ROOT, d));

const defined = new Set(Object.keys(emojiTheme));
const unknown = [...used].filter((t) => !defined.has(t));

if (unknown.length) {
  console.log("⚠️  Tokens USADOS pero NO definidos en config/emojiTheme.ts:");
  for (const t of unknown) console.log("   -", t);
  process.exitCode = 1;
} else {
  console.log("✅ Todos los tokens usados están definidos en config/emojiTheme.ts");
}
