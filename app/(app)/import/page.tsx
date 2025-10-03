"use client";

import { useState } from "react";
import { createPatient } from "@/lib/patients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/Toaster";

type Row = { nombre: string; edad?: number | null; genero?: "F" | "M" | "O" };

function parseCSV(text: string): Row[] {
  const lines = text
    .split(/\r?\n/)
    .map((l: any) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].split(",").map((h: any) => h.trim().toLowerCase());
  const idxNombre = header.indexOf("nombre");
  const idxEdad = header.indexOf("edad");
  const idxGenero = header.indexOf("genero");
  const out: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c: any) => c.trim());
    const nombre = cols[idxNombre] || "";
    if (!nombre) continue;
    const edad = idxEdad >= 0 ? (cols[idxEdad] ? Number(cols[idxEdad]) : null) : null;
    const genero = (idxGenero >= 0 ? cols[idxGenero] || "O" : "O") as "F" | "M" | "O";
    out.push({ nombre, edad: isNaN(edad as any) ? null : edad, genero });
  }
  return out;
}

export default function ImportPage() {
  const [text, setText] = useState("nombre,edad,genero\nAna Pérez,32,F\nLuis Ríos,41,M\nMar, ,O");
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(0);

  async function doImport() {
    setImporting(true);
    setDone(0);
    try {
      const rows = parseCSV(text);
      for (const r of rows) {
        await createPatient({ nombre: r.nombre, edad: r.edad ?? null, genero: r.genero ?? "O" });
        setDone((x: any) => x + 1);
      }
      showToast({
        title: "Importación completa",
        description: `${rows.length} pacientes creados.`,
      });
    } catch (e: any) {
      showToast({ title: "Error al importar", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Importar pacientes (CSV)</h1>
      <p className="text-sm text-gray-600">
        Pega aquí un CSV con columnas <code>nombre, edad, genero</code>. Cada fila crea un paciente.
        Se asignará a tu <strong>organización activa</strong> si existe.
      </p>
      <textarea
        className="w-full h-64 border rounded-md p-3 font-mono text-sm"
        value={text}
        onChange={(e: any) => setText(e.target.value)}
      />
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Creados: {done}</div>
        <Button onClick={() => void doImport()} disabled={importing}>
          Importar
        </Button>
      </div>
    </div>
  );
}
