// components/reminders/PrefsForm.tsx
"use client";

import * as React from "react";
import { getActiveOrg } from "@/lib/org-local";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type Prefs = {
  org_id: string;
  provider_id: string;
  tz: string;
  window_start: string;
  window_end: string;
  days_of_week: number[];
  channels_priority: ("whatsapp"|"sms")[];
  max_retries: number;
  retry_backoff_min: number;
};

const DAYS = [
  { v: 0, label: "Dom" }, { v: 1, label: "Lun" }, { v: 2, label: "Mar" },
  { v: 3, label: "Mié" }, { v: 4, label: "Jue" }, { v: 5, label: "Vie" }, { v: 6, label: "Sáb" },
];

export default function PrefsForm() {
  const org = getActiveOrg();
  const [me, setMe] = React.useState<string | null>(null);
  const [p, setP] = React.useState<Partial<Prefs>>({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const supa = getSupabaseBrowser();
      const { data } = await supa.auth.getUser();
      const uid = data.user?.id ?? null;
      setMe(uid);
      if (!uid || !org.id) return;
      const url = new URL("/api/reminders/prefs", window.location.origin);
      url.searchParams.set("org_id", org.id);
      url.searchParams.set("provider_id", uid);
      const r = await fetch(url.toString(), { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setP(j.data);
      else setP({ tz: "America/Mexico_City", window_start: "09:00", window_end: "20:00", days_of_week: [1,2,3,4,5], channels_priority: ["whatsapp","sms"], max_retries: 3, retry_backoff_min: 30 });
    })();
  }, [org.id]);

  function toggleDay(v: number) {
    setP(prev => {
      const arr = new Set(prev.days_of_week ?? []);
      if (arr.has(v)) arr.delete(v); else arr.add(v);
      return { ...prev, days_of_week: Array.from(arr).sort() };
    });
  }

  async function save() {
    if (!org.id || !me) return;
    setLoading(true);
    const r = await fetch("/api/reminders/prefs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...p, org_id: org.id, provider_id: me }),
    });
    const j = await r.json();
    setLoading(false);
    if (!j?.ok) alert(j?.error?.message || "Error al guardar");
  }

  return (
    <div className="rounded-2xl border bg-white/95 dark:bg-slate-900/60 p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Zona horaria</span>
          <input className="rounded-xl border px-3 py-2" value={p.tz ?? ""} onChange={e => setP(prev => ({ ...prev, tz: e.target.value }))} placeholder="America/Mexico_City" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Ventana inicio (HH:MM)</span>
          <input className="rounded-xl border px-3 py-2" value={p.window_start ?? ""} onChange={e => setP(prev => ({ ...prev, window_start: e.target.value }))} placeholder="09:00" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Ventana fin (HH:MM)</span>
          <input className="rounded-xl border px-3 py-2" value={p.window_end ?? ""} onChange={e => setP(prev => ({ ...prev, window_end: e.target.value }))} placeholder="20:00" />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {DAYS.map(d => (
          <button key={d.v} type="button"
            onClick={() => toggleDay(d.v)}
            className={[
              "px-3 py-1 rounded-lg border",
              (p.days_of_week ?? []).includes(d.v) ? "bg-blue-600 text-white border-blue-600" : "bg-white"
            ].join(" ")}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <label className="flex items-center gap-2">
          <input type="checkbox"
            checked={(p.channels_priority ?? ["whatsapp","sms"]).includes("whatsapp")}
            onChange={e => setP(prev => {
              const arr = new Set(prev.channels_priority ?? []);
              if (e.target.checked) arr.add("whatsapp"); else arr.delete("whatsapp");
              return { ...prev, channels_priority: Array.from(arr) as any };
            })}
          />
          <span>WhatsApp</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox"
            checked={(p.channels_priority ?? ["whatsapp","sms"]).includes("sms")}
            onChange={e => setP(prev => {
              const arr = new Set(prev.channels_priority ?? []);
              if (e.target.checked) arr.add("sms"); else arr.delete("sms");
              return { ...prev, channels_priority: Array.from(arr) as any };
            })}
          />
          <span>SMS</span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Reintentos máx</span>
          <input type="number" min={0} max={10} className="rounded-xl border px-3 py-2" value={p.max_retries ?? 3} onChange={e => setP(prev => ({ ...prev, max_retries: Number(e.target.value) }))} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Backoff base (min)</span>
          <input type="number" min={1} max={240} className="rounded-xl border px-3 py-2" value={p.retry_backoff_min ?? 30} onChange={e => setP(prev => ({ ...prev, retry_backoff_min: Number(e.target.value) }))} />
        </label>
      </div>

      <div className="flex gap-3">
        <button onClick={save} disabled={loading} className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-60">
          {loading ? "Guardando…" : "Guardar preferencias"}
        </button>
      </div>
    </div>
  );
}
