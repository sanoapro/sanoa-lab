"use client";
import { useMemo, useState } from "react";
import { getActiveOrg } from "@/lib/org-local";
import PatientAutocomplete from "@/components/patients/PatientAutocomplete";
import TemplatePicker from "./TemplatePicker";

type RxTemplate = { id?: string };

type Item = {
  drug: string;
  dose: string;
  route: string;
  freq: string;
  duration: string;
  instructions?: string;
};

export default function PrescriptionEditor() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";
  const [patient, setPatient] = useState<{ id: string; label: string } | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [notes, setNotes] = useState("");
  const [letterheadPath, setLetterheadPath] = useState<string>("");
  const [signaturePath, setSignaturePath] = useState<string>("");
  const [issuedAt, setIssuedAt] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);

  function addEmpty() {
    setItems((xs) => [
      ...xs,
      { drug: "", dose: "", route: "", freq: "", duration: "", instructions: "" },
    ]);
  }

  function removeAt(index: number) {
    setItems((xs) => xs.filter((_, idx) => idx !== index));
  }

  function setAt<T extends keyof Item>(index: number, key: T, value: Item[T]) {
    setItems((xs) => xs.map((x, idx) => (idx === index ? { ...x, [key]: value } : x)));
  }

  async function searchDrug(index: number, query: string) {
    if (query.trim().length < 2) return;
    const params = new URLSearchParams({ q: query });
    const r = await fetch(`/api/catalog/drugs/search?${params.toString()}`, {
      cache: "no-store",
    });
    const j = await r.json().catch(() => null);
    if (j?.ok && Array.isArray(j.data) && j.data[0]?.name) {
      setAt(index, "drug", j.data[0].name);
    } else if (Array.isArray(j?.items) && j.items[0]?.name) {
      setAt(index, "drug", j.items[0].name);
    }
  }

  async function save() {
    if (!orgId || !patient?.id || items.length === 0) {
      alert("Faltan datos");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        org_id: orgId,
        patient_id: patient.id,
        letterhead_path: letterheadPath || null,
        signature_path: signaturePath || null,
        notes: notes || null,
        issued_at: issuedAt ? new Date(issuedAt).toISOString() : null,
        items: items.map((it) => ({
          ...it,
          frequency: it.freq,
        })),
      };
      const r = await fetch("/api/prescriptions/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => null);
      const newId: string | undefined = j?.data?.id ?? j?.id;
      if (!j?.ok || !newId) {
        alert(j?.error?.message ?? "Error al guardar");
        return;
      }
      window.open(`/print/recetas/${newId}`, "_blank");
      setItems([]);
    } finally {
      setSaving(false);
    }
  }

  async function useTemplate(tpl: RxTemplate) {
    if (!orgId || !patient?.id) {
      alert("Elige paciente");
      return;
    }
    if (!tpl.id) {
      alert("La plantilla seleccionada no tiene identificador válido");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/prescriptions/from-template", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          patient_id: patient.id,
          template_id: tpl.id,
          letterhead_path: letterheadPath || null,
          signature_path: signaturePath || null,
          issued_at: new Date().toISOString(),
        }),
      });
      const j = await r.json().catch(() => null);
      const newId: string | undefined = j?.data?.id ?? j?.id;
      if (!j?.ok || !newId) {
        alert(j?.error?.message ?? "Error al usar plantilla");
        return;
      }
      window.open(`/print/recetas/${newId}`, "_blank");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="border rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold">Paciente</h3>
        {!orgId ? (
          <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
            Selecciona una organización activa.
          </p>
        ) : (
          <PatientAutocomplete
            orgId={orgId}
            scope="mine"
            onSelect={setPatient}
            placeholder="Buscar paciente…"
          />
        )}
        {patient && (
          <div className="text-sm text-slate-600">
            Paciente: <strong>{patient.label}</strong>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="border rounded-2xl p-4 space-y-2">
          <h3 className="font-semibold">Membrete/Firma (opcional)</h3>
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="letterheads/&lt;org&gt;/&lt;file&gt;.png"
            value={letterheadPath}
            onChange={(e) => setLetterheadPath(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="signatures/&lt;org&gt;/&lt;file&gt;.png"
            value={signaturePath}
            onChange={(e) => setSignaturePath(e.target.value)}
          />
          <label className="text-sm">Fecha/hora emisión</label>
          <input
            type="datetime-local"
            className="border rounded px-3 py-2 w-full"
            value={issuedAt}
            onChange={(e) => setIssuedAt(e.target.value)}
          />
        </div>
        <div className="md:col-span-2 border rounded-2xl p-4">
          <h3 className="font-semibold">Plantillas</h3>
          <TemplatePicker onSelect={useTemplate} />
        </div>
      </div>

      <div className="border rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Renglones de receta</h3>
          <button className="border rounded px-3 py-2" onClick={addEmpty}>
            Agregar renglón
          </button>
        </div>
        <div className="rounded border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-3 py-2">Fármaco</th>
                <th className="text-left px-3 py-2">Dosis</th>
                <th className="text-left px-3 py-2">Vía</th>
                <th className="text-left px-3 py-2">Frecuencia</th>
                <th className="text-left px-3 py-2">Duración</th>
                <th className="text-left px-3 py-2">Indicaciones</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">
                    <input
                      className="border rounded px-2 py-1 w-56"
                      value={it.drug}
                      onChange={(e) => setAt(i, "drug", e.target.value)}
                      onBlur={(e) => searchDrug(i, e.target.value)}
                      placeholder="Buscar/Escribir fármaco…"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="border rounded px-2 py-1 w-32"
                      value={it.dose}
                      onChange={(e) => setAt(i, "dose", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="border rounded px-2 py-1 w-28"
                      value={it.route}
                      onChange={(e) => setAt(i, "route", e.target.value)}
                      placeholder="VO/IM/IV..."
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="border rounded px-2 py-1 w-32"
                      value={it.freq}
                      onChange={(e) => setAt(i, "freq", e.target.value)}
                      placeholder="cada 8h..."
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="border rounded px-2 py-1 w-28"
                      value={it.duration}
                      onChange={(e) => setAt(i, "duration", e.target.value)}
                      placeholder="7 días..."
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="border rounded px-2 py-1 w-56"
                      value={it.instructions || ""}
                      onChange={(e) => setAt(i, "instructions", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button className="border rounded px-2 py-1" onClick={() => removeAt(i)}>
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                    Agrega al menos un renglón
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <label className="text-sm">Notas</label>
          <textarea
            className="border rounded px-3 py-2 w-full min-h-[100px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instrucciones generales al paciente..."
          />
        </div>

        <div className="flex gap-2">
          <button
            className="border rounded px-3 py-2"
            onClick={save}
            disabled={!patient || items.length === 0 || saving}
          >
            Guardar y abrir impresión
          </button>
        </div>
      </div>
    </section>
  );
}
