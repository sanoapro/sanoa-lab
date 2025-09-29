// components/pulso/MeasurementForm.tsx
"use client";
import { useState } from "react";
import CalcBMI from "./CalcBMI";
import HASClassifier from "./HASClassifier";

type Item = { type: string; value: number; unit?: string; measured_at?: string|null; note?: string };

export default function MeasurementForm({
  orgId, patientId, onSaved
}: { orgId: string; patientId: string; onSaved?: ()=>void }) {
  const [sys, setSys] = useState<string>("");
  const [dia, setDia] = useState<string>("");
  const [hr, setHr] = useState<string>("");
  const [gluc, setGluc] = useState<string>("");
  const [hba1c, setHba1c] = useState<string>("");
  const [ldl, setLdl] = useState<string>("");
  const [hdl, setHdl] = useState<string>("");
  const [tg, setTg] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [date, setDate] = useState<string>(""); // yyyy-mm-dd
  const [note, setNote] = useState<string>("");

  function pushMaybe(arr: Item[], type: string, raw: string, unit: string) {
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) return;
    arr.push({ type, value: n, unit, measured_at: date ? new Date(date).toISOString() : null, note: note || undefined });
  }

  async function save() {
    const items: Item[] = [];
    pushMaybe(items, "bp_sys", sys, "mmHg");
    pushMaybe(items, "bp_dia", dia, "mmHg");
    pushMaybe(items, "hr", hr, "lpm");
    pushMaybe(items, "glucose", gluc, "mg/dL");
    pushMaybe(items, "hba1c", hba1c, "%");
    pushMaybe(items, "ldl", ldl, "mg/dL");
    pushMaybe(items, "hdl", hdl, "mg/dL");
    pushMaybe(items, "tg", tg, "mg/dL");
    if (weight) pushMaybe(items, "weight", weight, "kg");
    if (height) pushMaybe(items, "height", height, "cm");

    if (items.length === 0) { alert("Captura al menos un valor"); return; }

    const r = await fetch("/api/modules/pulso/measurements/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ org_id: orgId, patient_id: patientId, items }),
    });
    const j = await r.json();
    if (!j.ok) { alert(j.error?.message ?? "Error"); return; }
    // limpiar
    setSys(""); setDia(""); setHr(""); setGluc(""); setHba1c(""); setLdl(""); setHdl(""); setTg("");
    setNote(""); // dejamos fecha por conveniencia
    onSaved?.();
  }

  return (
    <section className="border rounded-2xl p-4 space-y-4">
      <h3 className="font-semibold">Nueva medición</h3>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="border rounded-xl p-3 space-y-2">
          <div className="text-sm font-medium">Presión arterial</div>
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded px-3 py-2" placeholder="Sistólica" inputMode="numeric" value={sys} onChange={e=>setSys(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Diastólica" inputMode="numeric" value={dia} onChange={e=>setDia(e.target.value)} />
          </div>
          <div className="text-xs text-slate-500">mmHg</div>
        </div>

        <div className="border rounded-xl p-3 space-y-2">
          <div className="text-sm font-medium">Frecuencia cardiaca</div>
          <input className="border rounded px-3 py-2 w-full" placeholder="lpm" inputMode="numeric" value={hr} onChange={e=>setHr(e.target.value)} />
        </div>

        <div className="border rounded-xl p-3 space-y-2">
          <div className="text-sm font-medium">Fecha</div>
          <input className="border rounded px-3 py-2 w-full" type="date" value={date} onChange={e=>setDate(e.target.value)} />
          <input className="border rounded px-3 py-2 w-full" placeholder="Nota (opcional)" value={note} onChange={e=>setNote(e.target.value)} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="border rounded-xl p-3 space-y-2">
          <div className="text-sm font-medium">Metabólico</div>
          <input className="border rounded px-3 py-2 w-full" placeholder="Glucosa (mg/dL)" inputMode="numeric" value={gluc} onChange={e=>setGluc(e.target.value)} />
          <input className="border rounded px-3 py-2 w-full" placeholder="HbA1c (%)" inputMode="decimal" value={hba1c} onChange={e=>setHba1c(e.target.value)} />
        </div>

        <div className="border rounded-xl p-3 space-y-2">
          <div className="text-sm font-medium">Lípidos</div>
          <input className="border rounded px-3 py-2 w-full" placeholder="LDL (mg/dL)" inputMode="numeric" value={ldl} onChange={e=>setLdl(e.target.value)} />
          <input className="border rounded px-3 py-2 w-full" placeholder="HDL (mg/dL)" inputMode="numeric" value={hdl} onChange={e=>setHdl(e.target.value)} />
          <input className="border rounded px-3 py-2 w-full" placeholder="TG (mg/dL)" inputMode="numeric" value={tg} onChange={e=>setTg(e.target.value)} />
        </div>

        <div className="space-y-3">
          <CalcBMI onEmit={(_val)=> setHba1c(hba1c) /* no-op */} />
          <HASClassifier />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="border rounded-xl p-3 space-y-2">
          <div className="text-sm font-medium">Antropometría</div>
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded px-3 py-2" placeholder="Peso (kg)" inputMode="decimal" value={weight} onChange={e=>setWeight(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Talla (cm)" inputMode="decimal" value={height} onChange={e=>setHeight(e.target.value)} />
          </div>
          {/* IMC: calculamos al guardar si ambos presentes */}
          {/* Lo emitimos como medición 'bmi' si se puede derivar */}
          <button
            className="border rounded px-3 py-2"
            onClick={()=> {
              const w = parseFloat(weight); const h = parseFloat(height);
              if (!w || !h) return;
              const m = h/100; const bmi = Math.round((w/(m*m))*10)/10;
              setHba1c(hba1c); // no-op
              alert(`IMC: ${bmi}`);
            }}
          >Calcular IMC</button>
        </div>
        <div className="flex items-end">
          <button className="border rounded px-3 py-2 w-full" onClick={save}>Guardar mediciones</button>
        </div>
      </div>
    </section>
  );
}
