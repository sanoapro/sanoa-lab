"use client";
import { useState } from "react";

const items = [
  "Poco interés o placer en hacer cosas",
  "Se ha sentido desanimado, deprimido o sin esperanza",
  "Dificultad para dormir o dormir demasiado",
  "Cansancio o poca energía",
  "Poco apetito o comer en exceso",
  "Sentirse mal consigo mismo o que es un fracaso",
  "Dificultad para concentrarse",
  "Moverse o hablar tan lento que otros lo notan, o lo contrario: muy inquieto",
  "Pensamientos de que estaría mejor muerto o de hacerse daño",
];

const opts = [
  { v: 0, t: "Nunca (0)" },
  { v: 1, t: "Varios días (1)" },
  { v: 2, t: "Más de la mitad (2)" },
  { v: 3, t: "Casi todos los días (3)" },
];

export default function PHQ9Form({
  onScore,
}: {
  onScore: (res: any, answers: Record<string, number>) => void;
}) {
  const [ans, setAns] = useState<Record<string, number>>({});

  function setQ(i: number, v: number) {
    setAns((a: any) => ({ ...a, [`q${i + 1}`]: v }));
  }

  async function calc() {
    const r = await fetch("/api/modules/mente/assessments/score", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tool: "phq9", answers: ans }),
    });
    const j = await r.json();
    if (j?.ok) onScore(j.data, ans);
  }

  return (
    <div className="space-y-3">
      {items.map((text: any, i: any) => (
        <div key={i} className="grid md:grid-cols-2 gap-2 items-center">
          <label className="text-sm">{text}</label>
          <select
            className="border rounded px-3 py-2"
            value={ans[`q${i + 1}`] ?? ""}
            onChange={(e: any) => setQ(i, Number(e.target.value))}
          >
            <option value="">Selecciona…</option>
            {opts.map((o: any) => (
              <option key={o.v} value={o.v}>
                {o.t}
              </option>
            ))}
          </select>
        </div>
      ))}
      <button className="border rounded px-3 py-2" onClick={calc}>
        Calcular PHQ-9
      </button>
    </div>
  );
}
