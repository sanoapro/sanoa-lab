// scripts/fix-implicit-any-params-v3.mjs
// Corrige TS7006: anota parámetros sin tipo. Heurística para handlers JSX.
// Requiere: pnpm add -D ts-morph

import { Project, SyntaxKind } from "ts-morph";
import path from "node:path";

const project = new Project({
  tsConfigFilePath: path.join(process.cwd(), "tsconfig.json"),
  skipFileDependencyResolution: true,
  addFilesFromTsConfig: true,
});

const files = project.getSourceFiles(["**/*.ts", "**/*.tsx"]);

function ensureReactTypeImport(sf) {
  if (!sf.getFilePath().endsWith(".tsx")) return;
  const hasReactImport = sf.getImportDeclarations().some(
    (d) => d.getModuleSpecifierValue() === "react",
  );
  if (!hasReactImport) {
    sf.insertStatements(0, `import type * as React from "react";`);
  }
}

function inferJsxHandlerParamType(fn) {
  // Encuentra el atributo JSX más cercano
  const jsxAttrNode =
    fn.getFirstAncestorByKind(SyntaxKind.JsxAttribute) ||
    fn.getFirstAncestorByKind(SyntaxKind.JsxSpreadAttribute) ||
    null;

  // Si no es JsxAttribute “normal” abortamos (no inferimos)
  if (!jsxAttrNode || jsxAttrNode.getKind() !== SyntaxKind.JsxAttribute) return null;

  // Ya sabemos que es JsxAttribute
  const attrName = jsxAttrNode.getName?.();
  if (!attrName) return null;

  // Busca el elemento donde vive el atributo
  const jsxOpen =
    jsxAttrNode.getFirstAncestorByKind(SyntaxKind.JsxOpeningElement) ||
    jsxAttrNode.getFirstAncestorByKind(SyntaxKind.JsxSelfClosingElement) ||
    null;

  const tag = jsxOpen?.getTagNameNode?.()?.getText?.() ?? "";

  if (attrName === "onChange") {
    if (tag === "input") return "React.ChangeEvent<HTMLInputElement>";
    if (tag === "textarea") return "React.ChangeEvent<HTMLTextAreaElement>";
    if (tag === "select") return "React.ChangeEvent<HTMLSelectElement>";
    return "React.ChangeEvent<any>";
  }

  if (attrName === "onSubmit") {
    if (tag === "form") return "React.FormEvent<HTMLFormElement>";
    return "React.FormEvent<any>";
  }

  if (attrName === "onClick") {
    return "React.MouseEvent<any>";
  }

  return null;
}

function annotateParamsInFunction(fn) {
  let mutated = false;
  let usedReactType = false;

  for (const p of fn.getParameters()) {
    // Ya tiene tipo → ignora
    if (p.getTypeNode()) continue;

    let typeText = "any";

    // Intenta inferir tipo de evento si está en JSX
    const inferred = inferJsxHandlerParamType(fn);
    if (inferred) {
      typeText = inferred;
      if (typeText.startsWith("React.")) usedReactType = true;
    }

    // Aplica tipo con fallback robusto
    try {
      p.setType(typeText);
      mutated = true;
    } catch {
      // Algunos patrones complejos pueden fallar; intenta de nuevo con 'any'
      try {
        p.setType("any");
        mutated = true;
      } catch {
        // último recurso: lo dejamos sin tocar
      }
    }
  }

  return { mutated, usedReactType };
}

let changedFiles = 0;

for (const sf of files) {
  let mutated = false;
  let needsReactTypeImport = false;

  // Arrow functions
  for (const fn of sf.getDescendantsOfKind(SyntaxKind.ArrowFunction)) {
    const res = annotateParamsInFunction(fn);
    mutated ||= res.mutated;
    needsReactTypeImport ||= res.usedReactType;
  }

  // Function expressions
  for (const fn of sf.getDescendantsOfKind(SyntaxKind.FunctionExpression)) {
    const res = annotateParamsInFunction(fn);
    mutated ||= res.mutated;
    needsReactTypeImport ||= res.usedReactType;
  }

  // Function declarations
  for (const fn of sf.getDescendantsOfKind(SyntaxKind.FunctionDeclaration)) {
    const res = annotateParamsInFunction(fn);
    mutated ||= res.mutated;
    needsReactTypeImport ||= res.usedReactType;
  }

  if (mutated) {
    if (needsReactTypeImport) ensureReactTypeImport(sf);
    changedFiles++;
  }
}

await project.save();
console.log(`Hecho. Archivos modificados: ${changedFiles}`);
