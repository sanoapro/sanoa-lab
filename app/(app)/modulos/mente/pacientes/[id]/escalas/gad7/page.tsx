"use client";
import { useState } from "react";
import AccentHeader from "@/components/ui/AccentHeader";
import CTAButton from "@/components/ui/CTAButton";

export default function GAD7Page() {
  const [answers, setAnswers] = useState<number[]>(Array(7).fill(0));
  const [result, setResult] = useState<any>(null);

  async function score() {
    const r = await fetch("/api/modules/mente/evaluaciones/score", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "gad7", answers }),
    });
    setResult(await r.json());
  }

  return (
    <div className="p-6 space-y-4">
      <AccentHeader emoji="🧠">GAD-7</AccentHeader>
      {answers.map((v, i) => (
        <div key={i} className="flex gap-3 items-center">
          <label className="w-6 text-right" htmlFor={`q${i + 1}`}>
            {i + 1}
          </label>
          <select
            id={`q${i + 1}`}
            aria-label={`Pregunta ${i + 1}`}
            value={v}
            onChange={(e) => {
              const a = [...answers];
              a[i] = Number(e.target.value);
              setAnswers(a);
            }}
            className="border p-1 rounded"
          >
            <option value={0}>0</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>
      ))}
      <CTAButton onClick={score}>Calcular</CTAButton>
      {result && (
        <pre className="bg-gray-100 dark:bg-white/10 p-3 rounded text-sm overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
