"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ColorEmoji from "@/components/ColorEmoji";
import { showToast } from "@/components/Toaster";
import { getActiveOrg } from "@/lib/org-local";

/* ==================== Tipos ==================== */
type ReqRow = {
  id: string;
  title: string;
  status: "awaiting_upload" | "uploaded" | string;
  created_at: string;
  lab_results?: { path: string }[] | null;
};

type RequestsListResponse =
  | { ok: true; rows: ReqRow[] }
  | { ok: false; error: string };

type SignResultResponse =
  | { ok: true; url: string }
  | { ok: false; error: string };

type TemplateItem = { code?: string | null; name: string; notes?: string | null };

type Template = {
  id: string;
  name: string;
  notes?: string | null;
  items: TemplateItem[];
  is_active: boolean;
  created_at: string;
};

type TemplatesListResponse =
  | { ok: true; rows: Template[] }
  | { ok: false; error: string };

type SaveTemplateResponse =
  | { ok: true; id: string }
  | { ok: false; error: string };

type DeleteTemplateResponse =
  | { ok: true }
  | { ok: false; error: string };

type CreateRequestResponse =
  | { ok: true; id: string }
  | { ok: false; error: string };

/* ==================== Utilidades ==================== */
const rtf = new Intl.RelativeTimeFormat("es-MX", { numeric: "auto" });
function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.round(diffMs / 1000);
  if (Math.abs(sec) < 60) return rtf.format(-sec, "second");
  const min = Math.round(sec / 60);
  if (Math.abs(min) < 60) return rtf.format(-min, "minute");
  const hr = Math.round(min / 60);
  if (Math.abs(hr) < 24) return rtf.format(-hr, "hour");
  const day = Math.round(hr / 24);
  return rtf.format(-day, "day");
}

/* ==================== Página ==================== */
export default function LabDashboard() {
  const [tab, setTab] = useState<"req" | "tpl">("req");

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold inline-flex items-center gap-2">
          <ColorEmoji token="laboratorio" /> Laboratorio
        </h1>
        <nav
          className="inline-flex rounded-xl border border-[var(--color-brand-border)] bg-white p-1"
          aria-label="Pestañas de laboratorio"
        >
          <button
            type="button"
            onClick={() => setTab("req")}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              tab === "req" ? "bg-[var(--color-brand-bluegray)] text-white" : ""
            }`}
            aria-pressed={tab === "req"}
          >
            Solicitudes
          </button>
          <button
            type="button"
            onClick={() => setTab("tpl")}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              tab === "tpl" ? "bg-[var(--color-brand-bluegray)] text-white" : ""
            }`}
            aria-pressed={tab === "tpl"}
          >
            Sugerencias
          </button>
        </nav>
      </header>

      {tab === "req" ? <RequestsPanel /> : <TemplatesPanel />}
    </div>
  );
}

/* ==================== Solicitudes ==================== */
function RequestsPanel() {
  const [rows, setRows] = useState<ReqRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function load() {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setBusy(true);
    try {
      const r = await fetch("/api/lab/requests/list", { cache: "no-store", signal: ac.signal });
      const j = (await r.json().catch(() => ({}))) as RequestsListResponse;
      if (!r.ok || !("ok" in j) || j.ok !== true) {
        throw new Error(("error" in j && j.error) || "No se pudo cargar");
      }
      setRows(j.rows || []);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      showToast({
        title: "Error",
        description: e?.message || "No se pudo cargar",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, []);

  async function download(path: string) {
    setDownloadingPath(path);
    try {
      const r = await fetch("/api/lab/results/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const j = (await r.json().catch(() => ({}))) as SignResultResponse;
      if (!r.ok || !("ok" in j) || j.ok !== true || !("url" in j)) {
        throw new Error(("error" in j && j.error) || "No se pudo firmar");
      }
      window.open(j.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      showToast({
        title: "Error",
        description: e?.message || "No se pudo descargar",
        variant: "error",
      });
    } finally {
      setDownloadingPath(null);
    }
  }

  return (
    <section className="surface-light rounded-2xl border border-[var(--color-brand-border)] bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Últimas solicitudes</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="text-sm px-3 py-1.5 rounded-lg border border-[var(--color-brand-border)]"
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? "Actualizando…" : "Actualizar"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-[var(--color-brand-border)]">
              <th className="py-2 pr-3">Título</th>
              <th className="py-2 pr-3">Estado</th>
              <th className="py-2 pr-3">Creado</th>
              <th className="py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const hasFile = !!r.lab_results?.[0]?.path;
              const isUploaded = r.status === "uploaded";
              const path = r.lab_results?.[0]?.path ?? null;
              const isDownloading = path && downloadingPath === path;

              return (
                <tr
                  key={r.id}
                  className="border-b border-[var(--color-brand-border)] last:border-0"
                >
                  <td className="py-2 pr-3">{r.title}</td>
                  <td className="py-2 pr-3">
                    {isUploaded ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-emerald-700 border border-emerald-200">
                        <ColorEmoji token="ok" /> Recibido
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-amber-700 border border-amber-200">
                        <ColorEmoji token="espera" /> Pendiente
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3">{timeAgo(r.created_at)}</td>
                  <td className="py-2">
                    {hasFile && path ? (
                      <button
                        type="button"
                        onClick={() => void download(path)}
                        className="px-3 py-1.5 rounded-lg bg-[var(--color-brand-bluegray)] text-white disabled:opacity-60"
                        disabled={!!isDownloading}
                        aria-busy={!!isDownloading}
                        title="Descargar resultado firmado"
                      >
                        {isDownloading ? "Firmando…" : "Descargar"}
                      </button>
                    ) : (
                      <span className="text-xs text-[var(--color-brand-bluegray)]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="py-6 text-[var(--color-brand-bluegray)] text-center" colSpan={4}>
                  No hay solicitudes todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ==================== Plantillas (Sugerencias) ==================== */
function TemplatesPanel() {
  const org = getActiveOrg() as { id?: string } | null;
  const orgId = org?.id ?? null;

  const [rows, setRows] = useState<Template[]>([]);
  const [busy, setBusy] = useState(false);

  // Form nuevo/editar
  const [tplId, setTplId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [itemsText, setItemsText] = useState(""); // 1 por línea
  const [active, setActive] = useState(true);

  const items: TemplateItem[] = useMemo(
    () =>
      itemsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({ name })),
    [itemsText]
  );

  async function load() {
    setBusy(true);
    try {
      const r = await fetch("/api/lab/templates", { cache: "no-store" });
      const j = (await r.json().catch(() => ({}))) as TemplatesListResponse;
      if (!r.ok || !("ok" in j) || j.ok !== true) {
        throw new Error(("error" in j && j.error) || "No se pudo cargar");
      }
      setRows(j.rows || []);
    } catch (e: any) {
      showToast({
        title: "Error",
        description: e?.message || "No se pudo cargar",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function resetForm() {
    setTplId(null);
    setName("");
    setNotes("");
    setItemsText("");
    setActive(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      const r = await fetch("/api/lab/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tplId || undefined, name, notes, items, is_active: active }),
      });
      const j = (await r.json().catch(() => ({}))) as SaveTemplateResponse;
      if (!r.ok || !("ok" in j) || j.ok !== true) {
        throw new Error(("error" in j && j.error) || "No se pudo guardar");
      }
      showToast({ title: "Plantilla guardada", variant: "success" });
      resetForm();
      void load();
    } catch (e: any) {
      showToast({
        title: "Error",
        description: e?.message || "No se pudo guardar",
        variant: "error",
      });
    }
  }

  function edit(t: Template) {
    setTplId(t.id);
    setName(t.name);
    setNotes(t.notes || "");
    setItemsText(t.items.map((i) => i.name).join("\n"));
    setActive(!!t.is_active);
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar plantilla?")) return;
    try {
      const r = await fetch("/api/lab/templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = (await r.json().catch(() => ({}))) as DeleteTemplateResponse;
      if (!r.ok || !("ok" in j) || j.ok !== true) {
        throw new Error(("error" in j && j.error) || "No se pudo eliminar");
      }
      showToast({ title: "Plantilla eliminada", variant: "success" });
      void load();
    } catch (e: any) {
      showToast({
        title: "Error",
        description: e?.message || "No se pudo eliminar",
        variant: "error",
      });
    }
  }

  async function assign(t: Template) {
    // Sugerencia: reemplazar prompts por UI propia; conservamos por simplicidad.
    const email = prompt("Correo del paciente:");
    if (!email) return;
    const patient_id = prompt("ID del paciente (si ya existe), opcional:") || null;
    const title = prompt("Título de la solicitud:", t.name) || t.name;

    try {
      const r = await fetch("/api/lab/requests/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId ?? null, // usa organización activa si está disponible
          patient_id,
          email,
          title,
          instructions: t.notes || "",
          items: t.items,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as CreateRequestResponse;
      if (!r.ok || !("ok" in j) || j.ok !== true) {
        throw new Error(("error" in j && j.error) || "No se pudo crear la solicitud");
      }
      showToast({
        title: "Solicitud enviada",
        description: "Se envió el correo al paciente.",
        variant: "success",
      });
    } catch (e: any) {
      showToast({
        title: "Error",
        description: e?.message || "No se pudo crear la solicitud",
        variant: "error",
      });
    }
  }

  return (
    <div className="grid md:grid-cols-[1fr_1fr] gap-6">
      {/* Formulario */}
      <section className="rounded-2xl border border-[var(--color-brand-border)] bg-white p-4">
        <h2 className="font-semibold mb-3 inline-flex items-center gap-2">
          <ColorEmoji token="pieza" /> {tplId ? "Editar plantilla" : "Nueva plantilla"}
        </h2>
        <form onSubmit={save} className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium">Nombre</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              placeholder="Biometría hemática + Química sanguínea"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">
              Notas (encabezado del médico / indicaciones)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              placeholder="Dr(a). Nombre Apellido — Cédula XXXX… Ayuno 8–12 h."
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Estudios (uno por línea)</span>
            <textarea
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2 font-mono text-xs"
              placeholder={"Biometría hemática\nQuímica sanguínea 6 elementos\nPerfil lipídico"}
            />
          </label>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Activa
            </label>

            <div className="flex gap-2">
              {tplId && (
                <button
                  type="button"
                  onClick={() => resetForm()}
                  className="px-3 py-2 rounded-xl border border-[var(--color-brand-border)]"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-[var(--color-brand-bluegray)] text-white"
              >
                Guardar
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Listado */}
      <section className="rounded-2xl border border-[var(--color-brand-border)] bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Plantillas guardadas</h2>
          <button
            type="button"
            onClick={() => void load()}
            className="text-sm px-3 py-1.5 rounded-lg border border-[var(--color-brand-border)]"
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? "Actualizando…" : "Actualizar"}
          </button>
        </div>

        <div className="space-y-3">
          {rows.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-[var(--color-brand-border)] p-3 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {t.name}{" "}
                  {!t.is_active && (
                    <span className="text-xs text-[var(--color-brand-bluegray)]">(inactiva)</span>
                  )}
                </p>
                {t.notes && (
                  <p className="text-sm text-[var(--color-brand-bluegray)] mt-0.5">{t.notes}</p>
                )}
                <p className="text-xs text-[var(--color-brand-bluegray)] mt-1">
                  {t.items.length} estudio(s) • {timeAgo(t.created_at)}
                </p>
              </div>
              <div className="shrink-0 flex gap-2">
                <button
                  type="button"
                  onClick={() => void assign(t)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--color-brand-bluegray)] text-white"
                  title="Asignar a paciente"
                >
                  Asignar
                </button>
                <button
                  type="button"
                  onClick={() => edit(t)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--color-brand-border)]"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="text-sm text-[var(--color-brand-bluegray)]">
              Aún no tienes plantillas.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
