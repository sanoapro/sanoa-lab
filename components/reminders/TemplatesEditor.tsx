"use client";

import { useEffect, useState } from "react";
import { interpolateTemplate, isE164, normalizeE164 } from "@/lib/templates";
import { useToast } from "@/components/Toast";

type Tpl = {
  id: string;
  org_id: string;
  name: string;
  specialty: string | null;
  channel: "sms" | "whatsapp";
  body: string;
  variables: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type PreviewState = {
  text: string;
  missing: string[];
  extra: string[];
  target?: string;
} | null;

export default function TemplatesEditor({ orgId }: { orgId: string }) {
  const { toast } = useToast();
  const [list, setList] = useState<Tpl[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<{
    name: string;
    specialty: string;
    channel: "sms" | "whatsapp";
    variables: string;
    body: string;
    is_active: boolean;
  }>({
    name: "",
    specialty: "",
    channel: "whatsapp",
    variables: "paciente,fecha,hora,clinica",
    body: "Hola {{paciente}}, te recordamos tu cita el {{fecha}} a las {{hora}} en {{clinica}}.",
    is_active: true,
  });
  const [preview, setPreview] = useState<PreviewState>(null);
  const [payload, setPayload] = useState<Record<string, string>>({
    paciente: "Juan Pérez",
    fecha: "5 Oct",
    hora: "10:30",
    clinica: "Sanoa Centro",
  });
  const [testTarget, setTestTarget] = useState("+5215512345678");

  function load() {
    setLoading(true);
    const p = new URLSearchParams({ org_id: orgId, q });
    fetch(`/api/reminders/templates?${p.toString()}`)
      .then((r: any) => r.json())
      .then((j: any) => {
        if (j?.ok) setList(j.data);
        else
          toast({
            variant: "error",
            title: "No se pudieron cargar las plantillas",
            description: j?.error?.message ?? "Intenta nuevamente",
          });
      })
      .catch(() =>
        toast({
          variant: "error",
          title: "Error de red",
          description: "No fue posible obtener las plantillas",
        }),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [orgId, q]);

  function allowedArray() {
    return form.variables
      .split(",")
      .map((s: any) => s.trim())
      .filter(Boolean);
  }

  async function save() {
    const body = {
      org_id: orgId,
      name: form.name,
      specialty: form.specialty || null,
      channel: form.channel,
      body: form.body,
      variables: allowedArray(),
      is_active: form.is_active,
    };
    const r = await fetch("/api/reminders/templates/upsert", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (r.ok && j.ok) {
      toast({ variant: "success", title: "Plantilla guardada" });
      load();
    } else {
      toast({
        variant: "error",
        title: "No se pudo guardar",
        description: j?.error?.message ?? "Revisa los datos e intenta nuevamente",
      });
    }
  }

  async function doPreview() {
    const r = await fetch("/api/reminders/templates/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        body: form.body,
        variables: allowedArray(),
        payload,
        target: testTarget,
      }),
    });
    const j = await r.json();
    if (r.ok && j.ok) {
      setPreview({
        text: j.data.preview ?? "",
        missing: j.data.missing ?? [],
        extra: j.data.extra ?? [],
        target: j.data.target,
      });
    } else {
      setPreview(null);
      toast({
        variant: "error",
        title: "Error al previsualizar",
        description: j?.error?.message ?? "Verifica el contenido de la plantilla",
      });
    }
  }

  const targetValid = isE164(normalizeE164(testTarget));

  return (
    <section className="grid grid-cols-1 md:grid-cols-5 gap-6">
      {/* Lista */}
      <div className="md:col-span-2 space-y-3">
        <div className="flex gap-2">
          <input
            className="glass-input w-full"
            placeholder="Buscar por nombre…"
            value={q}
            onChange={(e: any) => setQ(e.target.value)}
          />
          <button className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm hover:shadow-sm" onClick={load}>
            Buscar
          </button>
        </div>

        <div className="glass-card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Nombre</th>
                <th className="text-left px-3 py-2">Especialidad</th>
                <th className="text-left px-3 py-2">Canal</th>
                <th className="text-left px-3 py-2">Activa</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center">
                    Cargando…
                  </td>
                </tr>
              )}
              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center">
                    Sin plantillas.
                  </td>
                </tr>
              )}
              {list.map((t: any) => (
                <tr key={t.id} className="border-t hover:bg-white/70">
                  <td className="px-3 py-2">
                    <button
                      className="underline underline-offset-2"
                      onClick={() =>
                        setForm({
                          name: t.name,
                          specialty: t.specialty ?? "",
                          channel: t.channel,
                          variables: (t.variables ?? []).join(","),
                          body: t.body,
                          is_active: t.is_active,
                        })
                      }
                    >
                      {t.name}
                    </button>
                  </td>
                  <td className="px-3 py-2">{t.specialty ?? "—"}</td>
                  <td className="px-3 py-2">{t.channel.toUpperCase()}</td>
                  <td className="px-3 py-2">{t.is_active ? "Sí" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="md:col-span-3 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Nombre</label>
            <input
              className="glass-input w-full"
              value={form.name}
              onChange={(e: any) => setForm({ ...form, name: e.target.value })}
              placeholder="recordatorio_cita"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Especialidad</label>
            <input
              className="glass-input w-full"
              value={form.specialty}
              onChange={(e: any) => setForm({ ...form, specialty: e.target.value })}
              placeholder="odontología, psicología…"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Canal</label>
            <select
              className="glass-input w-full"
              value={form.channel}
              onChange={(e: any) => setForm({ ...form, channel: e.target.value as any })}
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Variables permitidas (coma)</label>
            <input
              className="glass-input w-full"
              value={form.variables}
              onChange={(e: any) => setForm({ ...form, variables: e.target.value })}
            />
            <p className="text-xs text-slate-500 mt-1">Ej: paciente,fecha,hora,clinica</p>
          </div>
          <div className="flex items-end">
            <button className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm hover:shadow-sm w-full" onClick={save}>
              Guardar plantilla
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Cuerpo</label>
          <textarea
            className="glass-input w-full min-h-[160px]"
            value={form.body}
            onChange={(e: any) => setForm({ ...form, body: e.target.value })}
          />
          <p className="text-xs text-slate-500 mt-1">
            Usa llaves dobles: {"{{paciente}} {{fecha}} {{hora}} {{clinica}}"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Datos de prueba</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(payload).map((k: any) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-20">{k}</span>
                  <input
                    className="glass-input w-full"
                    value={payload[k]}
                    onChange={(e: any) => setPayload({ ...payload, [k]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Destino prueba (E.164)</label>
            <input
              className="glass-input w-full"
              value={testTarget}
              onChange={(e: any) => setTestTarget(e.target.value)}
            />
            <p className={`text-xs mt-1 ${targetValid ? "text-green-700" : "text-rose-700"}`}>
              {targetValid ? "Formato válido (+...)" : "Formato inválido (usa +<código><número>)"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm hover:shadow-sm" onClick={doPreview}>
            Previsualizar
          </button>
        </div>

        {preview && (
          <div className="glass-card p-4">
            <div className="text-sm text-slate-500 mb-1">Mensaje generado:</div>
            <pre className="whitespace-pre-wrap text-sm">{preview.text}</pre>
            {!!preview.missing?.length && (
              <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-2 text-sm">
                Faltan variables: {preview.missing.join(", ")}
              </p>
            )}
            {!!preview.extra?.length && (
              <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-2 text-sm">
                Variables extra no permitidas: {preview.extra.join(", ")}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
