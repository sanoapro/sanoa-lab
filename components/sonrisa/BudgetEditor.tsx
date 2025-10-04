// components/sonrisa/BudgetEditor.tsx
"use client";
import { useMemo, useState } from "react";
import CatalogPicker from "./CatalogPicker";
import SignaturePad from "./SignaturePad";
import PatientAutocomplete from "@/components/patients/PatientAutocomplete";
import { getActiveOrg } from "@/lib/org-local";

type Item = { description: string; qty: number; unit_price_cents: number; treatment_id?: string };

export default function BudgetEditor() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";

  const [patient, setPatient] = useState<{ id: string; label: string } | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [lastQuoteId, setLastQuoteId] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  const totalCents = useMemo(
    () => items.reduce((s: any, it: any) => s + it.qty * it.unit_price_cents, 0),
    [items],
  );

  function add(it: Item) {
    setItems((xs: any) => [...xs, it]);
  }
  function del(i: number) {
    setItems((xs: any) => xs.filter((_: any, idx: any) => idx !== i));
  }
  function setQty(i: number, q: number) {
    setItems((xs: any) =>
      xs.map((x: any, idx: any) => (idx === i ? { ...x, qty: Math.max(1, Math.floor(q)) } : x)),
    );
  }
  function setPrice(i: number, p: number) {
    setItems((xs: any) =>
      xs.map((x: any, idx: any) => (idx === i ? { ...x, unit_price_cents: Math.max(0, Math.floor(p)) } : x)),
    );
  }

  async function save() {
    if (!orgId || !patient?.id) {
      alert("Falta organización o paciente");
      return;
    }
    if (!items.length) {
      alert("Agrega al menos un concepto");
      return;
    }
    setSaving(true);
    const r = await fetch("/api/modules/sonrisa/quotes/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ org_id: orgId, patient_id: patient.id, items, notes }),
    });
    const j = await r.json();
    setSaving(false);
    if (!j.ok) {
      alert(j.error?.message ?? "Error");
      return;
    }
    setLastQuoteId(j.data.id);
    alert("Presupuesto guardado. Ahora puedes firmar con el paciente.");
  }

  async function accept() {
    if (!orgId || !lastQuoteId || !signature) {
      alert("Falta firma o presupuesto");
      return;
    }
    setAccepting(true);
    const r = await fetch("/api/modules/sonrisa/quotes/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ org_id: orgId, quote_id: lastQuoteId, signature_data_url: signature }),
    });
    const j = await r.json();
    setAccepting(false);
    if (!j.ok) {
      alert(j.error?.message ?? "Error");
      return;
    }
    alert("Presupuesto aceptado y firmado ✅");
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
            onSelect={(p:any) => setPatient(p as any)}
            placeholder="Buscar paciente…"
          />
        )}
        {patient && (
          <div className="text-sm text-slate-600">
            Paciente: <strong>{patient.label}</strong>
          </div>
        )}
      </div>

      <CatalogPicker orgId={orgId} onAdd={add} />

      <div className="border rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold">Renglones</h3>
        <div className="rounded border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Descripción</th>
                <th className="text-right px-3 py-2">Cantidad</th>
                <th className="text-right px-3 py-2">Precio</th>
                <th className="text-right px-3 py-2">Importe</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((it: any, i: any) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">{it.description}</td>
                  <td className="px-3 py-2 text-right">
                    <input
                      className="border rounded px-2 py-1 w-20 text-right"
                      inputMode="numeric"
                      value={it.qty}
                      onChange={(e: any) => setQty(i, Number(e.target.value))}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      className="border rounded px-2 py-1 w-28 text-right"
                      inputMode="numeric"
                      value={Math.round(it.unit_price_cents)}
                      onChange={(e: any) => setPrice(i, Number(e.target.value))}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    {((it.qty * it.unit_price_cents) / 100).toLocaleString("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    })}
                  </td>
                  <td className="px-3 py-2">
                    <button className="border rounded px-2 py-1" onClick={() => del(i)}>
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    Agrega tratamientos desde el catálogo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="text-sm">Notas</label>
            <textarea
              className="border rounded px-3 py-2 w-full min-h-[80px]"
              placeholder="Condiciones, vigencia, observaciones…"
              value={notes}
              onChange={(e: any) => setNotes(e.target.value)}
            />
          </div>
          <div className="text-right min-w-[220px] pl-4">
            <div className="text-sm text-slate-500">Total</div>
            <div className="text-2xl font-semibold">
              {(totalCents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="border rounded px-3 py-2" onClick={save} disabled={saving || !patient}>
            Guardar presupuesto
          </button>
        </div>
      </div>

      {lastQuoteId && (
        <div className="border rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold">Firma del paciente</h3>
          <SignaturePad onChange={setSignature} />
          <div className="flex gap-2">
            <button
              className="border rounded px-3 py-2"
              disabled={!signature || accepting}
              onClick={accept}
            >
              Aceptar y firmar
            </button>
            {/* Opcional: pago */}
            <form
              action="/api/modules/sonrisa/quotes/stripe/checkout"
              method="post"
              className="inline-flex gap-2"
            >
              <input type="hidden" name="org_id" value={orgId} />
              <input type="hidden" name="quote_id" value={lastQuoteId} />
            </form>
          </div>
          <p className="text-xs text-slate-500">
            Al firmar, se registra la aceptación con sello de tiempo y usuario.
          </p>
        </div>
      )}
    </section>
  );
}
