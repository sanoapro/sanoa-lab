"use client";
import { useEffect, useMemo, useState } from "react";
import PatientAutocomplete from "@/components/patients/PatientAutocomplete";
import PHQ9Form from "./PHQ9Form";
import GAD7Form from "./GAD7Form";
import AUDITCForm from "./AUDITCForm";
import AssessmentsTimeline from "./AssessmentsTimeline";
import { getActiveOrg } from "@/lib/org-local";

function bandCls(b: "low" | "med" | "high") {
  if (b === "high") return "bg-rose-100 text-rose-800";
  if (b === "med") return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-800";
}

type PatientItem = {
  id?: string;
  patient_id?: string;
  label?: string | null;
  name?: string | null;
  display_name?: string | null;
};

export default function AssessmentsScreen() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";

  const [patient, setPatient] = useState<{ id: string; label: string } | null>(null);
  const [lastScore, setLastScore] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [tool, setTool] = useState<"phq9" | "gad7" | "auditc">("phq9");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLastScore(null);
    setAnswers({});
  }, [tool]);

  async function save() {
    if (!orgId || !patient?.id || !tool || !answers) return;
    setSaving(true);
    const r = await fetch("/api/modules/mente/assessments/save", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ org_id: orgId, patient_id: patient.id, tool, answers }),
    });
    const j = await r.json();
    setSaving(false);
    if (!j.ok) alert(j.error?.message ?? "Error");
    else alert("Evaluación guardada");
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border p-4 space-y-3">
        <h3 className="font-semibold">Selecciona paciente</h3>
        {!orgId ? (
          <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
            Selecciona una organización activa para continuar.
          </p>
        ) : (
          <PatientAutocomplete
            orgId={orgId}
            scope="mine"
            onSelect={(p: PatientItem) =>
              setPatient({
                id: (p.id ?? p.patient_id)!,
                label: p.label ?? p.name ?? p.display_name ?? "Paciente",
              })
            }
            placeholder="Buscar paciente (solo mis pacientes)…"
          />
        )}
        {patient && (
          <div className="text-sm text-slate-600">
            Paciente: <strong>{patient.label}</strong>
          </div>
        )}
      </div>

      <div className="rounded-2xl border p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            className={`border rounded px-3 py-2 ${tool === "phq9" ? "bg-slate-100" : ""}`}
            onClick={() => setTool("phq9")}
          >
            PHQ-9
          </button>
        </div>

        {tool === "phq9" && (
          <PHQ9Form
            onScore={(res, a) => {
              setLastScore(res);
              setAnswers(a);
            }}
          />
        )}
        {tool === "gad7" && (
          <GAD7Form
            onScore={(res, a) => {
              setLastScore(res);
              setAnswers(a);
            }}
          />
        )}
        {tool === "auditc" && (
          <AUDITCForm
            onScore={(res, a) => {
              setLastScore(res);
              setAnswers(a);
            }}
          />
        )}

        {lastScore && (
          <div className="border rounded-xl p-3">
            <div className="text-sm">Resultado</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-semibold">{lastScore.total}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${bandCls(lastScore.risk_band)}`}>
                ● {lastScore.risk_band}
              </span>
              <span className="text-xs text-slate-600">({lastScore.severity})</span>
            </div>
            <div className="mt-2">
              <button
                className="border rounded px-3 py-2"
                onClick={save}
                disabled={saving || !patient}
              >
                Guardar en el expediente
              </button>
            </div>
          </div>
        )}
      </div>

      {orgId && patient?.id && (
        <div className="space-y-3">
          <h3 className="font-semibold">Historial de evaluaciones</h3>
          <AssessmentsTimeline orgId={orgId} patientId={patient.id} />
        </div>
      )}
    </section>
  );
}
