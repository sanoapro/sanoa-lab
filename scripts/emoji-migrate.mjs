/**
 * Reemplaza tokens antiguos por los nuevos en props JSX: token="…"
 * No toca strings arbitrarios, solo la forma token="…"/'…'/`…`.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SCAN_DIRS = ["app", "components", "lib"];
const IGNORE = /(^|\/)(\.next|node_modules|logs|public|\.git)(\/|$)/;

// Mapa de migración (puedes ajustar/añadir)
const RENAME = {
  dashboard: "tablero",
  Dashboard: "tablero",
  upload: "cargas",
  Upload: "cargas",
  profile: "perfil",
  Profile: "perfil",
  lock: "candado",
  key: "llave",
  back: "atras",
  next: "siguiente",
};

const tokenProp = /(\btoken\s*=\s*)(["'`])([^"'`]+)\2/g;

let filesTouched = 0;
let changes = 0;

function migrateFile(p) {
  const src = readFileSync(p, "utf8");
  const out = src.replace(tokenProp, (full, pre, q, val) => {
    const newVal = RENAME[val] || val;
    if (newVal !== val) {
      changes++;
      return `${pre}${q}${newVal}${q}`;
    }
    return full;
  });
  if (out !== src) {
    writeFileSync(p, out);
    filesTouched++;
    console.log(`• Actualizado: ${p}`);
  }
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (IGNORE.test(p)) continue;
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?)$/.test(p)) migrateFile(p);
  }
}

for (const d of SCAN_DIRS) walk(join(ROOT, d));

console.log(`\nResumen migración: ${changes} reemplazos en ${filesTouched} archivos.`);
