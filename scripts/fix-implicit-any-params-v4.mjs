// scripts/fix-implicit-any-params-v4.mjs
// Reanota TS7006 en TODO el repo (sin depender de include/exclude del tsconfig).
// Requiere: pnpm add -D ts-morph

import { Project, SyntaxKind } from "ts-morph";
import path from "node:path";

const project = new Project({
  // No dependemos de tsconfig para agregar archivos
  skipFileDependencyResolution: true,
  compilerOptions: {
    allowJs: false,
    jsx: 1, // React
  },
});

// Agrega TODOS los TS/TSX (excluye node_modules)
project.addSourceFilesAtPaths(["**/*.ts", "**/*.tsx", "!node_modules/**"]);

const files = project.getSourceFiles();

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
  const jsxAttrNode =
    fn.getFirstAncestorByKind(SyntaxKind.JsxAttribute) ||
    fn.getFirstAncestorByKind(SyntaxKind.JsxSpreadAttribute) ||
    null;

  if (!jsxAttrNode || jsxAttrNode.getKind() !== SyntaxKind.JsxAttribute) return null;

  const attrName = jsxAttrNode.getName?.();
  if (!attrName) return null;

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
    if (p.getTypeNode()) continue;

    let typeText = "any";

    const inferred = inferJsxHandlerParamType(fn);
    if (inferred) {
      typeText = inferred;
      if (typeText.startsWith("React.")) usedReactType = true;
    }

    try {
      p.setType(typeText);
      mutated = true;
    } catch {
      try {
        p.setType("any");
        mutated = true;
      } catch {}
    }
  }

  return { mutated, usedReactType };
}

let changedFiles = 0;

for (const sf of files) {
  let mutated = false;
  let needsReactTypeImport = false;

  for (const fn of sf.getDescendantsOfKind(SyntaxKind.ArrowFunction)) {
    const res = annotateParamsInFunction(fn);
    mutated ||= res.mutated;
    needsReactTypeImport ||= res.usedReactType;
  }
  for (const fn of sf.getDescendantsOfKind(SyntaxKind.FunctionExpression)) {
    const res = annotateParamsInFunction(fn);
    mutated ||= res.mutated;
    needsReactTypeImport ||= res.usedReactType;
  }
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
