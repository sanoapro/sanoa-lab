"use client";

import { useMemo, useState } from "react";
import ColorEmoji from "@/components/ColorEmoji";
import AccentHeader from "@/components/ui/AccentHeader";
import FeatureGate from "@/components/FeatureGate";

/** Utilidades */
const num = (v: any) => Number(v);

/** CURB-65: Confusion, Urea>7, RR>=30, BP<90/<=60, Age>=65 (puntaje 0-5) */
function calcCURB({
  confusion,
  ureaHigh,
  rrHigh,
  hypotension,
  age65,
}: {
  confusion: boolean;
  ureaHigh: boolean;
  rrHigh: boolean;
  hypotension: boolean;
  age65: boolean;
}) {
  return [confusion, ureaHigh, rrHigh, hypotension, age65].filter(Boolean).length;
}

/** CHA2DS2-VASc (AFib) */
function calcCHA2DS2VASC({
  ccf,
  htn,
  age75,
  dm,
  strokeTIA,
  vasc,
  age65_74,
  female,
}: {
  ccf: boolean;
  htn: boolean;
  age75: boolean;
  dm: boolean;
  strokeTIA: boolean;
  vasc: boolean;
  age65_74: boolean;
  female: boolean;
}) {
  let s = 0;
  s += ccf ? 1 : 0;
  s += htn ? 1 : 0;
  s += age75 ? 2 : 0;
  s += dm ? 1 : 0;
  s += strokeTIA ? 2 : 0;
  s += vasc ? 1 : 0;
  s += age65_74 ? 1 : 0;
  s += female ? 1 : 0;
  return s;
}

/** HAS-BLED */
function calcHASBLED({
  htn,
  renal,
  liver,
  stroke,
  bleed,
  inrLab,
  age65,
  drugsAlcohol,
}: {
  htn: boolean;
  renal: boolean;
  liver: boolean;
  stroke: boolean;
  bleed: boolean;
  inrLab: boolean;
  age65: boolean;
  drugsAlcohol: boolean;
}) {
  let s = 0;
  [htn, renal, liver, stroke, bleed, inrLab, age65, drugsAlcohol].forEach((b) => (s += b ? 1 : 0));
  return s;
}

/** qSOFA: FR>=22, PAS<=100, Glasgow<15 (0-3) */
function calcQSOFA({ fr, pas, glasgow }: { fr: number; pas: number; glasgow: number }) {
  let s = 0;
  if (fr >= 22) s++;
  if (pas <= 100) s++;
  if (glasgow < 15) s++;
  return s;
}

const box =
  "rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-6";

export default function ScoresPulso() {
  return (
    <main className="p-6 md:p-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3">
          <ColorEmoji token="agenda" size={32} />
          Pulso · Scores clínicos
        </h1>
        <p className="text-sm text-[var(--color-brand-text)]/80">
          Calculadoras rápidas de uso profesional. No sustituyen guías ni juicio clínico.
        </p>
      </header>

      {/* Gating opcional: exige cualquier plan Pro de Pulso en el futuro (ej. "pulso:pro"). 
          Ahora lo dejamos abierto; si quieres activarlo, pon needs="pulso:pro" */}
      <FeatureGate needs={[]}>
        <CURB65 />
        <CHA2DS2VASC />
        <HASBLED />
        <QSOFA />

        <p className="text-xs text-[var(--color-brand-text)]/60">
          Referencias y umbrales simplificados con fines de asistencia. Verifica protocolos locales.
        </p>
      </FeatureGate>
    </main>
  );
}

/* ---------- Secciones ---------- */

function CURB65() {
  const [confusion, setConfusion] = useState(false);
  const [ureaHigh, setUrea] = useState(false);
  const [rrHigh, setRr] = useState(false);
  const [hypo, setHypo] = useState(false);
  const [age65, setAge65] = useState(false);
  const s = calcCURB({ confusion, ureaHigh, rrHigh, hypotension: hypo, age65 });
  const risk =
    s >= 3
      ? "Alta mortalidad / valorar hospitalización"
      : s === 2
        ? "Riesgo intermedio"
        : "Riesgo bajo";
  return (
    <section className={box}>
      <AccentHeader emoji="🫁">CURB-65 (Neumonía)</AccentHeader>
      <div className="grid md:grid-cols-5 gap-3 mt-4">
        <Chk label="Confusión" v={confusion} set={setConfusion} />
        <Chk label="Urea > 7 mmol/L" v={ureaHigh} set={setUrea} />
        <Chk label="FR ≥ 30" v={rrHigh} set={setRr} />
        <Chk label="PAS < 90 o PAD ≤ 60" v={hypo} set={setHypo} />
        <Chk label="Edad ≥ 65" v={age65} set={setAge65} />
      </div>
      <ScoreDisplay value={s} note={risk} />
    </section>
  );
}

function CHA2DS2VASC() {
  const [st, set] = useState({
    ccf: false,
    htn: false,
    age75: false,
    dm: false,
    strokeTIA: false,
    vasc: false,
    age65_74: false,
    female: false,
  });
  const s = calcCHA2DS2VASC(st);
  const risk = s >= 2 ? "Riesgo alto" : s === 1 ? "Riesgo intermedio" : "Riesgo bajo";
  return (
    <section className={box}>
      <AccentHeader emoji="❤️">CHA₂DS₂-VASc (FA)</AccentHeader>
      <div className="grid md:grid-cols-4 gap-3 mt-4">
        <Chk label="Insuf. cardiaca" v={st.ccf} set={(v) => set({ ...st, ccf: v })} />
        <Chk label="Hipertensión" v={st.htn} set={(v) => set({ ...st, htn: v })} />
        <Chk label="Edad ≥ 75" v={st.age75} set={(v) => set({ ...st, age75: v })} />
        <Chk label="Diabetes" v={st.dm} set={(v) => set({ ...st, dm: v })} />
        <Chk label="EVC/AIT prev." v={st.strokeTIA} set={(v) => set({ ...st, strokeTIA: v })} />
        <Chk label="Enf. vascular" v={st.vasc} set={(v) => set({ ...st, vasc: v })} />
        <Chk label="Edad 65–74" v={st.age65_74} set={(v) => set({ ...st, age65_74: v })} />
        <Chk label="Mujer" v={st.female} set={(v) => set({ ...st, female: v })} />
      </div>
      <ScoreDisplay value={s} note={risk} />
    </section>
  );
}

function HASBLED() {
  const [st, set] = useState({
    htn: false,
    renal: false,
    liver: false,
    stroke: false,
    bleed: false,
    inrLab: false,
    age65: false,
    drugsAlcohol: false,
  });
  const s = calcHASBLED(st);
  const risk = s >= 3 ? "Riesgo alto de sangrado" : s === 2 ? "Riesgo moderado" : "Riesgo bajo";
  return (
    <section className={box}>
      <AccentHeader emoji="🩸">HAS-BLED</AccentHeader>
      <div className="grid md:grid-cols-4 gap-3 mt-4">
        <Chk label="HTA" v={st.htn} set={(v) => set({ ...st, htn: v })} />
        <Chk label="Función renal deficiente" v={st.renal} set={(v) => set({ ...st, renal: v })} />
        <Chk
          label="Función hepática deficiente"
          v={st.liver}
          set={(v) => set({ ...st, liver: v })}
        />
        <Chk label="Antecedente de EVC" v={st.stroke} set={(v) => set({ ...st, stroke: v })} />
        <Chk label="Sangrado previo" v={st.bleed} set={(v) => set({ ...st, bleed: v })} />
        <Chk label="INR inestable/lab." v={st.inrLab} set={(v) => set({ ...st, inrLab: v })} />
        <Chk label="Edad > 65" v={st.age65} set={(v) => set({ ...st, age65: v })} />
        <Chk
          label="Drogas/Alcohol"
          v={st.drugsAlcohol}
          set={(v) => set({ ...st, drugsAlcohol: v })}
        />
      </div>
      <ScoreDisplay value={s} note={risk} />
    </section>
  );
}

function QSOFA() {
  const [fr, setFr] = useState("22");
  const [pas, setPas] = useState("100");
  const [gcs, setG] = useState("15");
  const s = useMemo(
    () => calcQSOFA({ fr: num(fr), pas: num(pas), glasgow: num(gcs) }),
    [fr, pas, gcs],
  );
  const risk = s >= 2 ? "Riesgo de mala evolución — evaluar sepsis" : "Riesgo bajo — vigilar";
  return (
    <section className={box}>
      <AccentHeader emoji="🧠">qSOFA</AccentHeader>
      <div className="grid md:grid-cols-3 gap-3 mt-4">
        <L label="FR (rpm)">
          <I v={fr} set={setFr} />
        </L>
        <L label="PAS (mmHg)">
          <I v={pas} set={setPas} />
        </L>
        <L label="Glasgow">
          <I v={gcs} set={setG} />
        </L>
      </div>
      <ScoreDisplay value={s} note={risk} />
    </section>
  );
}

/* ---------- UI helpers ---------- */
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
      onChange={(e) => set(e.target.value)}
      className="border rounded-xl p-2 w-full"
    />
  );
}
function Chk({ label, v, set }: { label: string; v: boolean; set: (x: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
function ScoreDisplay({ value, note }: { value: number; note: string }) {
  return (
    <div className="mt-4 rounded-xl border p-3">
      <div className="text-xs text-[var(--color-brand-bluegray)]">Puntaje</div>
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-sm opacity-70">{note}</div>
    </div>
  );
}
