// scripts/fix-input-imports-split.mjs
// Reescribe imports que traen Input desde "@/components/ui/field"
// y los separa en dos imports, moviendo Input a "@/components/ui/input".
// - Soporta múltiples líneas, espacios variados y default import.
// - NO toca `import type` (se asume que Input es un valor, no un tipo).

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const files = execSync("git ls-files", { encoding: "utf8" })
  .split("\n")
  .filter((f) => f && /\.(ts|tsx|js|jsx)$/.test(f));

// Captura imports como:
// import { Field, Input, Textarea } from "@/components/ui/field";
// import Default, { Field, Input } from "@/components/ui/field";
// (Soporta multilínea). Evita `import type`.
const IMPORT_RE =
  /import\s+(?!type)(?:(?<default>[A-Za-z_$][\w$]*)\s*,\s*)?\{\s*(?<named>[\s\S]*?)\s*\}\s*from\s*['"]@\/components\/ui\/field['"]\s*;?/gm;

const INPUT_SPEC_RE = /^Input(\s+as\s+[A-Za-z_$][\w$]*)?$/;

let changedCount = 0;
let touchedFiles = [];

for (const rel of files) {
  const abs = path.join(repoRoot, rel);
  let src = fs.readFileSync(abs, "utf8");
  const original = src;

  src = src.replace(IMPORT_RE, (full, _default, _named, groups) => {
    const def = groups?.default?.trim() || "";
    const namedRaw = groups?.named || "";

    // Divide por comas de nivel superior
    const specs = namedRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const inputSpecs = specs.filter((s) => INPUT_SPEC_RE.test(s));
    if (inputSpecs.length === 0) {
      // No había Input en ese import, no tocamos
      return full;
    }

    const others = specs.filter((s) => !INPUT_SPEC_RE.test(s));

    // Construye el/los imports de reemplazo
    const parts = [];

    // Import residual desde field (default + otros named SIN Input).
    // Si no queda nada en named y no hay default, eliminamos ese import.
    if (def && others.length > 0) {
      parts.push(
        `import ${def}, { ${others.join(", ")} } from "@/components/ui/field";`,
      );
    } else if (def && others.length === 0) {
      // Pocos casos: si había default import desde field (inusual),
      // y no quedan named, mantenemos sólo el default
      parts.push(`import ${def} from "@/components/ui/field";`);
    } else if (!def && others.length > 0) {
      parts.push(`import { ${others.join(", ")} } from "@/components/ui/field";`);
    } // else: ni default ni named -> eliminar import original

    // Nuevo import para Input desde input.tsx (con alias si existía)
    parts.push(`import { ${inputSpecs.join(", ")} } from "@/components/ui/input";`);

    return parts.join("\n");
  });

  if (src !== original) {
    fs.writeFileSync(abs, src, "utf8");
    changedCount++;
    touchedFiles.push(rel);
    console.log(`✔ Reescrito: ${rel}`);
  }
}

console.log(`\nHecho. Archivos modificados: ${changedCount}`);
if (touchedFiles.length) {
  console.log("Archivos tocados:");
  for (const f of touchedFiles) console.log(" -", f);
}
