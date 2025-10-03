import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const files = execSync("git ls-files", { encoding: "utf8" })
  .split("\n")
  .filter((f) => f && /\.(tsx?|jsx?)$/.test(f));

const importRe = /import\s*\{\s*([^}]+)\s*\}\s*from\s*["']@\/components\/ui\/field["'];?/g;

let changed = 0;

for (const f of files) {
  const abs = path.join(repoRoot, f);
  let src = fs.readFileSync(abs, "utf8");
  const original = src;

  src = src.replace(importRe, (full, specList) => {
    const names = specList
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const hasInput = names.some((n) => n === "Input" || n.startsWith("Input as "));
    if (!hasInput) return full;

    // Quita Input del import original
    const remaining = names.filter((n) => !/^Input(\s+as\s+\w+)?$/.test(n));

    let result = "";
    if (remaining.length > 0) {
      result += `import { ${remaining.join(", ")} } from "@/components/ui/field";\n`;
    }
    // Añade import de Input desde input.tsx
    result += `import { Input } from "@/components/ui/input";`;
    return result;
  });

  if (src !== original) {
    fs.writeFileSync(abs, src, "utf8");
    changed++;
    console.log(`✔ Reescrito: ${f}`);
  }
}

console.log(`\nHecho. Archivos modificados: ${changed}`);