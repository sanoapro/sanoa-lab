"use client";

import { useMemo, useState } from "react";
import ColorEmoji from "@/components/ColorEmoji";
import AccentHeader from "@/components/ui/AccentHeader";

function toNum(v: any){ const n = Number(v); return Number.isFinite(n) ? n : NaN; }

export default function CalculadorasPulso(){
  // Inputs
  const [peso, setPeso] = useState<string>("70");            // kg
  const [talla, setTalla] = useState<string>("170");         // cm
  const [edad, setEdad] = useState<string>("40");            // años
  const [sexo, setSexo] = useState<"M"|"F">("M");
  const [creat, setCreat] = useState<string>("1.0");         // mg/dL
  const [Na, setNa] = useState<string>("140");
  const [Cl, setCl] = useState<string>("103");
  const [HCO3, setHCO3] = useState<string>("24");
  const [qt, setQt] = useState<string>("400");               // ms
  const [rr, setRr] = useState<string>("800");               // ms (intervalo RR)

  // Cálculos
  const imc = useMemo(()=>{
    const p = toNum(peso), t = toNum(talla)/100;
    if (!p || !t) return NaN;
    return p/(t*t);
  }, [peso, talla]);

  const sc = useMemo(()=>{
    const p = toNum(peso), t = toNum(talla);
    if (!p || !t) return NaN;
    return Math.sqrt((p*t)/3600); // Mosteller
  }, [peso, talla]);

  const clcr = useMemo(()=>{
    // Cockcroft-Gault (ml/min) usando peso actual
    const p = toNum(peso), cr = toNum(creat), e = toNum(edad);
    if (!p || !cr || !e) return NaN;
    const base = ((140 - e) * p) / (72 * cr);
    return sexo === "F" ? base * 0.85 : base;
  }, [peso, creat, edad, sexo]);

  const anionGap = useMemo(()=>{
    const na = toNum(Na), cl = toNum(Cl), h = toNum(HCO3);
    if (!na && na!==0 || !cl && cl!==0 || !h && h!==0) return NaN;
    return na - (cl + h);
  }, [Na, Cl, HCO3]);

  const qtc = useMemo(()=>{
    const QT = toNum(qt), RR = toNum(rr);
    if (!QT || !RR) return NaN;
    // Bazett: QTc = QT / sqrt(RR) ; RR en segundos
    return QT / Math.sqrt(RR/1000);
  }, [qt, rr]);

  const box = "rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-6";

  return (
    <main className="p-6 md:p-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3">
          <ColorEmoji token="agenda" size={32} />
          Pulso · Calculadoras
        </h1>
        <p className="text-sm text-[var(--color-brand-text)]/80">
          Auxiliares de uso clínico. Revisa unidades y contexto del paciente.
        </p>
      </header>

      {/* Datos del paciente */}
      <section className={box}>
        <AccentHeader emoji="🧍">Datos</AccentHeader>
        <div className="grid md:grid-cols-6 gap-3 mt-4">
          <L label="Peso (kg)"><I value={peso} onChange={setPeso} /></L>
          <L label="Talla (cm)"><I value={talla} onChange={setTalla} /></L>
          <L label="Edad (años)"><I value={edad} onChange={setEdad} /></L>
          <L label="Sexo">
            <select value={sexo} onChange={e=>setSexo(e.target.value as any)} className="border rounded-xl p-2 w-full">
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </L>
          <L label="Creatinina (mg/dL)"><I value={creat} onChange={setCreat} /></L>
          <div className="hidden md:block" />
        </div>
      </section>

      {/* Resultados rápidos */}
      <section className="grid md:grid-cols-4 gap-6">
        <K title="IMC" v={imc} unit="kg/m²" fmt={(x)=>x.toFixed(1)} />
        <K title="SC (Mosteller)" v={sc} unit="m²" fmt={(x)=>x.toFixed(2)} />
        <K title="ClCr (Cockcroft–Gault)" v={clcr} unit="mL/min" fmt={(x)=>x.toFixed(0)} />
        <div className={box}>
          <div className="text-sm text-[var(--color-brand-bluegray)]">Clasificación IMC</div>
          <div className="text-[var(--color-brand-text)] mt-2">
            {isNaN(imc) ? "—" :
              imc < 18.5 ? "Bajo peso" :
              imc < 25 ? "Normal" :
              imc < 30 ? "Sobrepeso" : "Obesidad"}
          </div>
        </div>
      </section>

      {/* Metabolismo y ECG */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className={box}>
          <AccentHeader emoji="🧪">GAP aniónico</AccentHeader>
          <div className="grid md:grid-cols-4 gap-3 mt-4">
            <L label="Na (mEq/L)"><I value={Na} onChange={setNa} /></L>
            <L label="Cl (mEq/L)"><I value={Cl} onChange={setCl} /></L>
            <L label="HCO₃⁻ (mEq/L)"><I value={HCO3} onChange={setHCO3} /></L>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-[var(--color-brand-bluegray)]">Resultado</div>
              <div className="text-lg font-semibold">{isNaN(anionGap) ? "—" : anionGap.toFixed(0)} mEq/L</div>
            </div>
          </div>
        </div>

        <div className={box}>
          <AccentHeader emoji="📈">QTc (Bazett)</AccentHeader>
          <div className="grid md:grid-cols-3 gap-3 mt-4">
            <L label="QT (ms)"><I value={qt} onChange={setQt} /></L>
            <L label="RR (ms)"><I value={rr} onChange={setRr} /></L>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-[var(--color-brand-bluegray)]">Resultado</div>
              <div className="text-lg font-semibold">{isNaN(qtc) ? "—" : qtc.toFixed(0)} ms</div>
            </div>
          </div>
        </div>
      </section>

      <p className="text-xs text-[var(--color-brand-text)]/60">
        Estos resultados son de referencia y no sustituyen el juicio clínico.
      </p>
    </main>
  );
}

function L({label, children}:{label:string; children:React.ReactNode}){
  return <label className="text-sm">{label}<div className="mt-1">{children}</div></label>;
}
function I({value, onChange}:{value:string; onChange:(v:string)=>void}){
  return <input value={value} onChange={e=>onChange(e.target.value)} className="border rounded-xl p-2 w-full" />;
}
function K({title, v, unit, fmt}:{title:string; v:number; unit?:string; fmt?:(x:number)=>string}){
  const box = "rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-6";
  return (
    <div className={box}>
      <div className="text-sm text-[var(--color-brand-bluegray)]">{title}</div>
      <div className="text-xl font-semibold text-[var(--color-brand-text)]">
        {isNaN(v) ? "—" : (fmt ? fmt(v) : v)}
        {unit ? <span className="text-sm ml-1">{unit}</span> : null}
      </div>
    </div>
  );
}
