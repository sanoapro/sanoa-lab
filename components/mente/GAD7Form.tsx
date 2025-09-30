"use client";
import { useState } from "react";

const items = [
  "Sentirse nervioso, ansioso o al límite",
  "No poder parar o controlar la preocupación",
  "Preocuparse demasiado por diferentes cosas",
  "Dificultad para relajarse",
  "Tan inquieto que es difícil estar quieto",
  "Irritable o fácilmente molesto",
  "Sentir miedo como si algo terrible fuera a pasar",
];

const opts = [
  { v: 0, t: "Nunca (0)" },
  { v: 1, t: "Varios días (1)" },
  { v: 2, t: "Más de la mitad (2)" },
  { v: 3, t: "Casi todos los días (3)" },
];

export default function GAD7Form({
  onScore,
}: {
  onScore: (res: any, answers: Record<string, number>) => void;
}) {
  const [ans, setAns] = useState<Record<string, number>>({});

  function setQ(i: number, v: number) {
    setAns((a) => ({ ...a, [`q${i + 1}`]: v }));
  }

  async function calc() {
    const r = await fetch("/api/modules/mente/assessments/score", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tool: "gad7", answers: ans }),
    });
    const j = await r.json();
    if (j?.ok) onScore(j.data, ans);
  }

  return (
    <div className="space-y-3">
      {items.map((text, i) => (
        <div key={i} className="grid md:grid-cols-2 gap-2 items-center">
          <label className="text-sm">{text}</label>
          <select
            className="border rounded px-3 py-2"
            value={ans[`q${i + 1}`] ?? ""}
            onChange={(e) => setQ(i, Number(e.target.value))}
          >
            <option value="">Selecciona…</option>
            {opts.map((o) => (
              <option key={o.v} value={o.v}>
                {o.t}
              </option>
            ))}
          </select>
        </div>
      ))}
      <button className="border rounded px-3 py-2" onClick={calc}>
        Calcular GAD-7
      </button>
    </div>
  );
}
