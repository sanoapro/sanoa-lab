// components/branding/BrandingForm.tsx
"use client";

import * as React from "react";
import { getActiveOrg } from "@/lib/org-local";
import ColorEmoji from "@/components/ColorEmoji";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type Branding = {
  org_id: string;
  provider_id: string;
  clinic_name: string | null;
  license_number: string | null;
  signature_name: string | null;
  letterhead_url: string | null;
  signature_url: string | null;
};

export default function BrandingForm() {
  const org = getActiveOrg();
  const [meId, setMeId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<Partial<Branding>>({});
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState<"letterhead" | "signature" | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const supa = getSupabaseBrowser();
        const { data } = await supa.auth.getUser();
        const uid = data.user?.id ?? null;
        setMeId(uid);
        if (!uid || !org.id) return;
        const url = new URL("/api/branding/provider", window.location.origin);
        url.searchParams.set("org_id", org.id);
        url.searchParams.set("provider_id", uid);
        const r = await fetch(url.toString(), { cache: "no-store" });
        const j = await r.json();
        if (j?.ok) setForm({ ...j.data, org_id: org.id, provider_id: uid });
        else setForm({ org_id: org.id, provider_id: uid });
      } catch { /* ignore */ }
    })();
  }, [org.id]);

  async function upsert() {
    if (!org.id || !meId) return;
    setLoading(true);
    const r = await fetch("/api/branding/provider", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, org_id: org.id, provider_id: meId }),
    });
    const j = await r.json();
    setLoading(false);
    if (!j?.ok) alert(j?.error?.message || "Error al guardar");
  }

  async function uploadFile(kind: "letterheads" | "signatures", file: File) {
    if (!org.id || !meId) return;
    const supa = getSupabaseBrowser();
    const bucket = kind;
    const key = `${org.id}/${meId}/${file.name}`;
    setUploading(kind === "letterheads" ? "letterhead" : "signature");
    const { error } = await supa.storage.from(bucket).upload(key, file, { upsert: true });
    setUploading(null);
    if (error) { alert(error.message); return; }
    // Usamos rutas de proxy existentes para servir (coinciden con bucket)
    const url = `/api/${kind === "letterheads" ? "storage/letterheads" : "storage/signatures"}/${org.id}/${meId}/${encodeURIComponent(file.name)}`;
    if (kind === "letterheads") setForm(prev => ({ ...prev, letterhead_url: url }));
    else setForm(prev => ({ ...prev, signature_url: url }));
  }

  function onChange<K extends keyof Branding>(k: K, v: Branding[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  const previewHref = org.id && meId ? `/api/branding/preview/rx/pdf?org_id=${org.id}&provider_id=${meId}` : "#";

  return (
    <div className="rounded-2xl border p-4 bg-white/95 dark:bg-slate-900/60 space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2"><ColorEmoji token="hoja" /> Membrete</h3>
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={e => e.target.files?.[0] && uploadFile("letterheads", e.target.files[0])}
          />
          {uploading === "letterhead" && <div className="text-sm text-slate-500">Subiendo…</div>}
          {form.letterhead_url && (
            <div className="rounded-xl border overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.letterhead_url} alt="Membrete" className="max-h-40 w-full object-contain bg-white" />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2"><ColorEmoji token="firma" /> Firma</h3>
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={e => e.target.files?.[0] && uploadFile("signatures", e.target.files[0])}
          />
          {uploading === "signature" && <div className="text-sm text-slate-500">Subiendo…</div>}
          {form.signature_url && (
            <div className="rounded-xl border overflow-hidden p-3 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.signature_url} alt="Firma" className="max-h-24 object-contain mx-auto" />
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Nombre para firma</span>
          <input
            className="rounded-xl border px-3 py-2 bg-white dark:bg-slate-900"
            value={form.signature_name ?? ""}
            onChange={e => onChange("signature_name", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Nombre de clínica</span>
          <input
            className="rounded-xl border px-3 py-2 bg-white dark:bg-slate-900"
            value={form.clinic_name ?? ""}
            onChange={e => onChange("clinic_name", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Cédula profesional</span>
          <input
            className="rounded-xl border px-3 py-2 bg-white dark:bg-slate-900"
            value={form.license_number ?? ""}
            onChange={e => onChange("license_number", e.target.value)}
          />
        </label>
      </section>

      <div className="flex gap-3">
        <button onClick={upsert} disabled={loading} className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-60">
          {loading ? "Guardando…" : "Guardar identidad"}
        </button>
        <a href={previewHref} target="_blank" className="px-4 py-2 rounded-xl border inline-flex items-center gap-2">
          <ColorEmoji token="pdf" /> Previsualizar receta
        </a>
      </div>
    </div>
  );
}
