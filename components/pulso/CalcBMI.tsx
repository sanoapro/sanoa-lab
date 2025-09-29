// components/pulso/CalcBMI.tsx
"use client";
import { useMemo, useState } from "react";

export default function CalcBMI({ onEmit }: { onEmit?: (bmi: number) => void }) {
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>(""); // cm

  const bmi = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h) return null;
    const m = h / 100;
    const val = w / (m * m);
    return Math.round(val * 10) / 10;
  }, [weight, height]);

  return (
    <div className="border rounded-xl p-3 space-y-2">
      <div className="text-sm font-medium">Calculadora IMC</div>
      <div className="grid grid-cols-2 gap-2">
        <input className="border rounded px-3 py-2" placeholder="Peso (kg)" inputMode="decimal" value={weight} onChange={(e)=>setWeight(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Talla (cm)" inputMode="decimal" value={height} onChange={(e)=>setHeight(e.target.value)} />
      </div>
      <div className="text-sm">IMC: <strong>{bmi ?? "—"}</strong></div>
      <div>
        <button className="border rounded px-3 py-1" disabled={bmi === null} onClick={()=> bmi !== null && onEmit?.(bmi)}>Usar IMC</button>
      </div>
    </div>
  );
}
