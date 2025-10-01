"use client";
import { useState } from "react";
import Gate from "@/components/Gate";
import { cvdRisk } from "@/lib/risk/cvd-framingham";
import AccentHeader from "@/components/ui/AccentHeader";
import CTAButton from "@/components/ui/CTAButton";

export default function RiesgoCVD() {
  const orgId = typeof window !== "undefined" ? localStorage.getItem("org_id") || "" : "";
  const [age, setAge] = useState(45);
  const [sex, setSex] = useState<"M" | "F">("M");
  const [smoker, setSmoker] = useState(false);
  const [totalChol, setTotalChol] = useState(200);
  const [hdl, setHdl] = useState(50);
  const [sbp, setSbp] = useState(130);
  const [treated, setTreated] = useState(false);
  const [out, setOut] = useState<any>(null);

  return (
    <Gate
      orgId={orgId}
      featureId="pulso.riesgo.cvd"
      fallback={
        <div>
          Activa &quot;Riesgo cardiovascular&quot; para usar esta calculadora.
        </div>
      }
    >
      <div className="p-6 space-y-4">
        <AccentHeader emoji="🩺">Riesgo cardiovascular (demo)</AccentHeader>
        <div className="grid md:grid-cols-3 gap-3">
          <label>
            Edad{" "}
            <input
              aria-label="Edad"
              type="number"
              value={age}
              onChange={(e) => setAge(+e.target.value)}
              className="border p-1 rounded w-full"
            />
          </label>
          <label>
            Sexo
            <select
              aria-label="Sexo"
              value={sex}
              onChange={(e) => setSex(e.target.value as any)}
              className="border p-1 rounded w-full"
            >
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
          </label>
          <label>
            Fumador{" "}
            <input
              aria-label="Fumador"
              type="checkbox"
              checked={smoker}
              onChange={(e) => setSmoker(e.target.checked)}
            />
          </label>
          <label>
            Colesterol total{" "}
            <input
              aria-label="Colesterol total"
              type="number"
              value={totalChol}
              onChange={(e) => setTotalChol(+e.target.value)}
              className="border p-1 rounded w-full"
            />
          </label>
          <label>
            HDL{" "}
            <input
              aria-label="HDL"
              type="number"
              value={hdl}
              onChange={(e) => setHdl(+e.target.value)}
              className="border p-1 rounded w-full"
            />
          </label>
          <label>
            PAS (SBP){" "}
            <input
              aria-label="SBP"
              type="number"
              value={sbp}
              onChange={(e) => setSbp(+e.target.value)}
              className="border p-1 rounded w-full"
            />
          </label>
          <label>
            Hipertensión tratada{" "}
            <input
              aria-label="HTA tratada"
              type="checkbox"
              checked={treated}
              onChange={(e) => setTreated(e.target.checked)}
            />
          </label>
        </div>
        <CTAButton
          onClick={() => setOut(cvdRisk({ age, sex, smoker, totalChol, hdl, sbp, treated }))}
        >
          Calcular
        </CTAButton>
        {out && (
          <pre className="bg-gray-100 dark:bg-white/10 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(out, null, 2)}
          </pre>
        )}
      </div>
    </Gate>
  );
}
