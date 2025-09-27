"use client";

import { useEffect, useState } from "react";
import { isE164, normalizeE164 } from "@/lib/templates";
import { useToastSafe } from "@/components/Toast";

type Props = { orgId: string; patientId: string; initialLabels?: string[] };
const PRESETS = ["Riesgo", "Embarazo", "Prioridad"] as const;

export default function QuickBar({ orgId, patientId, initialLabels = [] }: Props) {
  const [labels, setLabels] = useState<string[]>(initialLabels);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [expires, setExpires] = useState<number>(72);
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [target, setTarget] = useState<string>("");
  const [template, setTemplate] = useState<string>("recordatorio_cita");
  const { toast } = useToastSafe();

  useEffect(() => { setLabels(initialLabels); }, [initialLabels]);

  async function toggle(label: string) {
    const r = await fetch("/api/patients/labels/toggle", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ org_id: orgId, patient_id: patientId, label })
    });
    const j = await r.json();
    if (j.ok) {
      setLabels(prev => j.data.toggled === "added" ? Array.from(new Set([...prev, label])) : prev.filter(x => x !== label));
    } else {
      toast({ variant: "error", title: "Error", description: j.error?.message ?? "No se pudo actualizar etiqueta", emoji: "🛑" });
    }
  }

  async function createShare() {
    const r = await fetch("/api/patients/share/create", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ org_id: orgId, patient_id: patientId, expires_hours: expires })
    });
    const j = await r.json();
    if (j.ok) {
      setShareUrl(j.data.url);
      try { await navigator.clipboard.writeText(j.data.url); } catch {}
      toast({ variant: "success", title: "Enlace generado", description: "Copiado al portapapeles", emoji: "✅" });
    } else {
      toast({ variant: "error", title: "Error", description: j.error?.message ?? "No se pudo generar enlace", emoji: "🛑" });
    }
  }

  async function revokeShare() {
    if (!shareUrl) return;
    const token = shareUrl.split("/").pop();
    if (!token) return;
    const r = await fetch("/api/patients/share/revoke", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ org_id: orgId, token })
    });
    const j = await r.json();
    if (j.ok) {
      setShareUrl("");
      toast({ variant: "success", title: "Enlace revocado", description: "Accesos deshabilitados", emoji: "✅" });
    } else {
      toast({ variant: "error", title: "Error", description: j.error?.message ?? "No se pudo revocar", emoji: "🛑" });
    }
  }

  async function sendQuickReminder() {
    const norm = normalizeE164(target);
    if (!isE164(norm)) {
      toast({ variant: "error", title: "Destino inválido", description: "Usa formato E.164 (+52...)", emoji: "📵" });
      return;
    }
    const r = await fetch("/api/reminders/schedule", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        org_id: orgId,
        item: {
          channel,
          target: norm,
          template: template || "recordatorio_cita",
          schedule_at: new Date().toISOString(),
          meta: { patient_id: patientId, source: "patient_quick" }
        }
      })
    });
    const j = await r.json();
    if (j.ok) {
      toast({ variant: "success", title: "Recordatorio programado", description: `Canal: ${channel.toUpperCase()}`, emoji: "📤" });
      setTemplate("recordatorio_cita");
    } else {
      toast({ variant: "error", title: "Error", description: j.error?.message ?? "No se pudo programar", emoji: "🛑" });
    }
  }

  return (
    <section className="rounded-2xl border p-4 space-y-4">
      <h3 className="font-semibold">Acciones rápidas</h3>

      <div>
        <div className="text-sm text-slate-600 mb-1">Etiquetas</div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(l => {
            const active = labels.includes(l);
            return (
              <button
                key={l}
                type="button"
                aria-pressed={active}
                className={`px-3 py-1.5 rounded-xl border text-sm ${active ? "bg-white" : "opacity-60"}`}
                onClick={() => toggle(l)}
              >
                {active ? "✓ " : ""}{l}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-sm mb-1">Caducidad (horas)</label>
          <input type="number" min={1} max={336} className="rounded border px-3 py-2 w-full" value={expires} onChange={e => setExpires(Math.max(1, Number(e.target.value || 1)))} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Enlace compartido</label>
          <div className="flex gap-2">
            <input readOnly className="rounded border px-3 py-2 w-full" value={shareUrl} placeholder="Genera un enlace seguro…" />
            <button className="rounded px-3 py-2 border" onClick={createShare}>Generar</button>
            <button className="rounded px-3 py-2 border" onClick={revokeShare} disabled={!shareUrl}>Revocar</button>
          </div>
          <p className="text-xs text-slate-500 mt-1">El enlace registra accesos (IP/UA) y expira automáticamente.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-sm mb-1">Canal</label>
          <select className="rounded border px-3 py-2 w-full" value={channel} onChange={e => setChannel(e.target.value as any)}>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Destino (E.164)</label>
          <input className="rounded border px-3 py-2 w-full" value={target} onChange={e => setTarget(e.target.value)} placeholder="+52..." />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm mb-1">Plantilla</label>
          <input className="rounded border px-3 py-2 w-full" value={template} onChange={e => setTemplate(e.target.value)} placeholder="recordatorio_cita" />
        </div>
        <div className="md:col-span-1">
          <button className="rounded px-4 py-2 border w-full" onClick={sendQuickReminder}>Enviar ahora</button>
        </div>
      </div>
    </section>
  );
}
