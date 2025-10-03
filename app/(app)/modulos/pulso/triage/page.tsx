"use client";

import { useMemo, useState } from "react";
import ColorEmoji from "@/components/ColorEmoji";
import AccentHeader from "@/components/ui/AccentHeader";

export default function TriagePulso() {
  const [fc, setFc] = useState<string>("90"); // lpm
  const [pas, setPas] = useState<string>("120"); // mmHg
  const [sat, setSat] = useState<string>("97"); // %
  const [temp, setTemp] = useState<string>("37.0");
  const [fr, setFr] = useState<string>("16");

  const score = useMemo(() => {
    const n = (x: any) => Number(x);
    let s = 0;
    if (n(fc) >= 130) s += 3;
    else if (n(fc) >= 110) s += 2;
    else if (n(fc) <= 40) s += 3;
    if (n(pas) < 90) s += 3;
    else if (n(pas) < 100) s += 2;
    if (n(sat) < 90) s += 3;
    else if (n(sat) < 94) s += 2;
    if (n(temp) >= 40 || n(temp) < 35) s += 2;
    if (n(fr) >= 30) s += 3;
    else if (n(fr) >= 22) s += 2;
    else if (n(fr) <= 8) s += 3;
    return s;
  }, [fc, pas, sat, temp, fr]);

  const nivel = useMemo(() => {
    if (score >= 6) return { label: "Rojo", desc: "Atención inmediata", color: "bg-rose-600" };
    if (score >= 3) return { label: "Amarillo", desc: "Alta prioridad", color: "bg-amber-500" };
    return { label: "Verde", desc: "Prioridad estándar", color: "bg-emerald-600" };
  }, [score]);

  const box =
    "rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-6";

  return (
    <main className="p-6 md:p-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3">
          <ColorEmoji token="agenda" size={32} />
          Pulso · Triaje
        </h1>
        <p className="text-sm text-[var(--color-brand-text)]/80">
          Clasificación simple por signos vitales (heurística). No sustituye protocolos
          institucionales.
        </p>
      </header>

      <section className={box}>
        <AccentHeader emoji="🩺">Signos vitales</AccentHeader>
        <div className="grid md:grid-cols-5 gap-3 mt-4">
          <L label="FC (lpm)">
            <I v={fc} set={setFc} />
          </L>
          <L label="PAS (mmHg)">
            <I v={pas} set={setPas} />
          </L>
          <L label="SatO₂ (%)">
            <I v={sat} set={setSat} />
          </L>
          <L label="Temp (°C)">
            <I v={temp} set={setTemp} />
          </L>
          <L label="FR (rpm)">
            <I v={fr} set={setFr} />
          </L>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <div className={box}>
          <div className="text-sm text-[var(--color-brand-bluegray)]">Puntaje</div>
          <div className="text-3xl font-semibold">{score}</div>
        </div>
        <div className={box}>
          <div className="text-sm text-[var(--color-brand-bluegray)]">Nivel</div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-block h-3 w-3 rounded-full ${nivel.color}`} />
            <div className="text-lg font-semibold">{nivel.label}</div>
          </div>
          <div className="text-sm text-[var(--color-brand-text)]/70">{nivel.desc}</div>
        </div>
        <div className={box}>
          <div className="text-sm text-[var(--color-brand-bluegray)] mb-1">Sugerencias</div>
          <ul className="list-disc pl-5 text-sm text-[var(--color-brand-text)]/80">
            <li>Confirmar mediciones y repetir si es necesario.</li>
            <li>Revisar antecedentes y síntomas de alarma.</li>
            <li>Si “Rojo”: activar ruta de alta prioridad según protocolo local.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
function I({ v, set }: { v: string; set: (x: string) => void }) {
  return (
    <input
      value={v}
      onChange={(e: any) => set(e.target.value)}
      className="border rounded-xl p-2 w-full"
    />
  );
}
