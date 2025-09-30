"use client";
import { useState } from "react";

const items = [
  "¿Con qué frecuencia consume bebidas alcohólicas?",
  "¿Cuántas bebidas en un día típico cuando bebe?",
  "¿Con qué frecuencia toma 6 o más bebidas en una ocasión?",
];

const opts = [
  { v: 0, t: "0" },
  { v: 1, t: "1" },
  { v: 2, t: "2" },
  { v: 3, t: "3" },
  { v: 4, t: "4" },
];

export default function AUDITCForm({
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
      body: JSON.stringify({ tool: "auditc", answers: ans }),
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
        Calcular AUDIT-C
      </button>
    </div>
  );
}
