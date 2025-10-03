// scripts/fix-implicit-any-params.mjs
// Anota parámetros sin tipo (TS7006). Usa heurística para eventos de React.
// Requiere: pnpm add -D ts-morph

import { Project, SyntaxKind, Node } from "ts-morph";
import path from "node:path";
import fs from "node:fs";

const project = new Project({
  tsConfigFilePath: path.join(process.cwd(), "tsconfig.json"),
  skipFileDependencyResolution: true,
  addFilesFromTsConfig: true,
});

const files = project.getSourceFiles(["**/*.ts", "**/*.tsx"]);
let changedFiles = 0;

function ensureReactTypeImport(sf) {
  // Sólo TSX y si no existe ya un import de React (type o valor)
  if (!sf.getFilePath().endsWith(".tsx")) return;
  const hasReactImport = sf.getImportDeclarations().some((d) => d.getModuleSpecifierValue() === "react");
  if (!hasReactImport) {
    sf.insertStatements(0, `import type * as React from "react";`);
  } else {
    // Si hay import de valor, está bien también.
    // Si sólo hay import default tipo `import React from "react"`, nos sirve igual.
    // No hacemos nada.
  }
}

function typeForJsxAttr(attrName) {
  switch (attrName) {
    case "onChange":
      return "React.ChangeEvent<any>";
    case "onSubmit":
      return "React.FormEvent<any>";
    case "onClick":
      return "React.MouseEvent<any>";
    default:
      return null;
  }
}

function annotateParamsInFunction(fn) {
  let mutated = false;

  for (const p of fn.getParameters()) {
    // ya tipado → skip
    if (p.getTypeNode()) continue;

    // default: any
    let typeText = "any";

    // Heurística JSX: si este arrow function está como valor de un atributo JSX
    const parent = fn.getParent();

    if (Node.isJsxExpression(parent)) {
      const maybeAttr = parent.getParent();
      if (maybeAttr && Node.isJsxAttribute(maybeAttr)) {
        const attrName = maybeAttr.getName();
        const jsxType = typeForJsxAttr(attrName);
        if (jsxType) {
          typeText = jsxType;
        }
      }
    }

    // Asigna tipo
    p.setType(typeText);
    mutated = true;
  }

  return mutated;
}

for (const sf of files) {
  let mutated = false;

  // Arrow functions
  for (const fn of sf.getDescendantsOfKind(SyntaxKind.ArrowFunction)) {
    mutated = annotateParamsInFunction(fn) || mutated;
  }

  // Function expressions (const x = function(e) {...})
  for (const fn of sf.getDescendantsOfKind(SyntaxKind.FunctionExpression)) {
    mutated = annotateParamsInFunction(fn) || mutated;
  }

  // Function declarations (function f(e) {...})
  for (const fn of sf.getDescendantsOfKind(SyntaxKind.FunctionDeclaration)) {
    mutated = annotateParamsInFunction(fn) || mutated;
  }

  if (mutated) {
    // Si usamos tipos React en TSX, asegura import type React
    ensureReactTypeImport(sf);
    changedFiles++;
  }
}

await project.save();

console.log(`Hecho. Archivos modificados: ${changedFiles}`);
