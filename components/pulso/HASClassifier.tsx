// components/pulso/HASClassifier.tsx
"use client";
import { useMemo, useState } from "react";

function classify(sys?: number, dia?: number): string {
  if (!sys || !dia) return "—";
  if (sys >= 180 || dia >= 120) return "Crisis hipertensiva";
  if (sys >= 160 || dia >= 100) return "HTA Grado 2";
  if (sys >= 140 || dia >= 90) return "HTA Grado 1";
  if (sys >= 130 || dia >= 85) return "Alta normal";
  if (sys >= 120 || dia >= 80) return "Normal alta";
  return "Normal";
}

export default function HASClassifier() {
  const [sys, setSys] = useState<string>("");
  const [dia, setDia] = useState<string>("");

  const cat = useMemo(() => classify(parseFloat(sys), parseFloat(dia)), [sys, dia]);

  return (
    <div className="border rounded-xl p-3 space-y-2">
      <div className="text-sm font-medium">Clasificación HTA</div>
      <div className="grid grid-cols-2 gap-2">
        <input
          className="border rounded px-3 py-2"
          placeholder="Sistólica (mmHg)"
          inputMode="numeric"
          value={sys}
          onChange={(e: any) => setSys(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Diastólica (mmHg)"
          inputMode="numeric"
          value={dia}
          onChange={(e: any) => setDia(e.target.value)}
        />
      </div>
      <div className="text-sm">
        Categoría: <strong>{cat}</strong>
      </div>
    </div>
  );
}
