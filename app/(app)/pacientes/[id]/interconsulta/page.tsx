"use client";
import { useMemo, useState, useCallback, useEffect } from "react";
import TemplateLibraryModal from "@/components/templates/TemplateLibraryModal";
import { getActiveOrg } from "@/lib/org-local";
import { listReferralTemplates, type ReferralTemplate } from "@/lib/referrals/templates";

type ReferralForm = {
  to_specialty: string;
  to_doctor_name: string;
  reason: string;
  summary: string;
  plan: string;
};

export default function NewReferral({ params }: { params: { id: string } }) {
  const patientId = params.id;
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";
  const [templates, setTemplates] = useState<ReferralTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [sel, setSel] = useState("");
  const [form, setForm] = useState<ReferralForm>({
    to_specialty: "",
    to_doctor_name: "",
    reason: "",
    summary: "",
    plan: "",
  });

  const loadTemplates = useCallback(async () => {
    if (!orgId) {
      setTemplates([]);
      return [] as ReferralTemplate[];
    }
    setLoadingTemplates(true);
    try {
      const data = await listReferralTemplates(orgId);
      const active = data.filter((tpl) => tpl.is_active !== false);
      setTemplates(active);
      return active;
    } catch (err) {
      console.error(err);
      setTemplates([]);
      return [] as ReferralTemplate[];
    } finally {
      setLoadingTemplates(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const applyTemplate = useCallback(
    (tpl?: ReferralTemplate) => {
      if (!tpl) return;
      setForm((prev) => ({
        ...prev,
        to_specialty: tpl.content?.to_specialty ?? "",
        to_doctor_name: tpl.content?.to_doctor_name ?? "",
        reason: tpl.content?.reason ?? "",
        summary: tpl.content?.summary ?? "",
        plan: tpl.content?.plan ?? "",
      }));
    },
    [],
  );

  const handleSelectChange = (value: string) => {
    setSel(value);
    const tpl = templates.find((t) => t.id === value);
    applyTemplate(tpl);
  };

  const handleUseFromModal = useCallback(
    async (tpl: { id: string; name: string }) => {
      setModalOpen(false);
      const data = await loadTemplates();
      const found = data.find((item) => item.id === tpl.id);
      if (found) {
        setSel(found.id);
        applyTemplate(found);
      }
    },
    [applyTemplate, loadTemplates],
  );

  const save = async () => {
    if (!(form.to_specialty || form.to_doctor_name))
      return alert("Falta: Especialidad o Dr. destino");
    if (!(form.reason || form.summary)) return alert("Falta: Motivo o Resumen");
    const r = await fetch("/api/referrals/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ patient_id: patientId, ...form }),
    });
    const j = await r.json();
    if (!j.id) return alert("Error al crear");
    window.open(`/api/referrals/${j.id}/pdf`, "_blank");
  };
  return (
    <div className="p-4 max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Nueva interconsulta</h1>
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600">Plantillas activas</span>
            <select
              className="rounded-xl border border-white/30 bg-white/80 px-3 py-2"
              value={sel}
              disabled={!templates.length}
              onChange={(e) => handleSelectChange(e.target.value)}
            >
              <option value="">Selecciona plantilla…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.content?.meta?.specialty ? ` · ${t.content.meta.specialty}` : ""}
                </option>
              ))}
            </select>
            {loadingTemplates && <span className="text-xs text-slate-500">Cargando plantillas…</span>}
            {!loadingTemplates && !templates.length && (
              <span className="text-xs text-slate-500">Aún no hay plantillas activas.</span>
            )}
          </label>
        </div>
        <button
          className="glass-btn"
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={!orgId}
        >
          📚 Administrar plantillas
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          className="border rounded p-2"
          placeholder="Especialidad destino"
          value={form.to_specialty}
          onChange={(e) => setForm({ ...form, to_specialty: e.target.value })}
        />
        <input
          className="border rounded p-2"
          placeholder="Dr(a) destinatario"
          value={form.to_doctor_name}
          onChange={(e) => setForm({ ...form, to_doctor_name: e.target.value })}
        />
        <textarea
          className="col-span-2 border rounded p-2"
          rows={2}
          placeholder="Motivo"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        />
        <textarea
          className="col-span-2 border rounded p-2"
          rows={3}
          placeholder="Resumen"
          value={form.summary}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
        />
        <textarea
          className="col-span-2 border rounded p-2"
          rows={2}
          placeholder="Plan sugerido"
          value={form.plan}
          onChange={(e) => setForm({ ...form, plan: e.target.value })}
        />
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-2 bg-black text-white rounded" onClick={save}>
          Guardar + PDF
        </button>
      </div>

      <TemplateLibraryModal
        kind="referral"
        orgId={orgId}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          loadTemplates();
        }}
        onUse={handleUseFromModal}
      />
    </div>
  );
}
