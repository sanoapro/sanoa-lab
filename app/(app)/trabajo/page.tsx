"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/Toaster";
import { getActiveOrg } from "@/lib/org-local";
import {
  listWorkItems,
  createWorkItem,
  setWorkStatus,
  deleteWorkItem,
  type WorkItem,
  type WorkStatus,
} from "@/lib/work-items";
import { useSearchParams } from "next/navigation";

function useQueryParam(name: string) {
  const sp = useSearchParams();
  return sp.get(name);
}

export default function Page() {
  return (
    <Suspense
      fallback={<div className="p-6 text-center text-[var(--color-brand-bluegray)]">Cargando…</div>}
    >
      <RequireAuth>
        <PageInner />
      </RequireAuth>
    </Suspense>
  );
}

function PageInner() {
  const org = getActiveOrg();
  const prefillPatient = useQueryParam("patient") || "";

  const [items, setItems] = useState<WorkItem[]>([]);
  const [status, setStatus] = useState<WorkStatus | "all">("open");
  const [patientId, setPatientId] = useState(prefillPatient);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState(""); // datetime-local (string)
  const [loading, setLoading] = useState(false);

  const canLoad = !!org?.id;

  const fmtDateTime = useMemo(
    () =>
      new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Mexico_City",
      }),
    [],
  );

  async function load() {
    if (!canLoad) return;
    setLoading(true);
    try {
      const data = await listWorkItems({
        orgId: org.id!,
        status,
        patientId: patientId.trim() ? patientId.trim() : undefined,
      });
      setItems(data);
    } catch (e: any) {
      showToast({ title: "Error al cargar", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org?.id, status]);

  async function create() {
    if (!org?.id) {
      showToast({ title: "Selecciona organización activa" });
      return;
    }
    if (!patientId.trim() || !title.trim()) {
      showToast({ title: "Faltan datos", description: "Indica patient_id y título." });
      return;
    }
    try {
      const iso = dueAt ? new Date(dueAt).toISOString() : null;
      await createWorkItem({
        orgId: org.id!,
        patientId: patientId.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        dueAt: iso,
      });
      setTitle("");
      setDescription("");
      // Conserva patientId para cargar varias al hilo
      showToast({ title: "Creada", description: "La tarea se agregó correctamente." });
      await load();
    } catch (e: any) {
      showToast({ title: "No se pudo crear", description: e.message, variant: "destructive" });
    }
  }

  async function mark(id: string, done: boolean) {
    try {
      await setWorkStatus(id, done ? "done" : "open");
      await load();
    } catch (e: any) {
      showToast({
        title: "No se pudo cambiar estado",
        description: e.message,
        variant: "destructive",
      });
    }
  }

  async function removeItem(id: string) {
    if (!confirm("¿Borrar tarea?")) return;
    try {
      await deleteWorkItem(id);
      await load();
    } catch (e: any) {
      showToast({ title: "No se pudo borrar", description: e.message, variant: "destructive" });
    }
  }

  const header = useMemo(() => {
    if (status === "open") return "Tareas abiertas";
    if (status === "done") return "Tareas completadas";
    return "Todas las tareas";
  }, [status]);

  const canCreate = !!org?.id && patientId.trim() && title.trim();

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Trabajo</h1>
        <div className="flex items-center gap-2">
          <select
            className="border rounded-md px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            aria-label="Filtro de estado"
          >
            <option value="open">Abiertas</option>
            <option value="done">Completadas</option>
            <option value="all">Todas</option>
          </select>
          <Button variant="secondary" onClick={() => void load()} disabled={loading}>
            {loading ? "Actualizando…" : "Actualizar"}
          </Button>
        </div>
      </div>

      {/* Crear */}
      <section className="bg-white border rounded-xl p-4 space-y-3">
        <div className="text-lg font-semibold">Nueva tarea</div>
        {!org?.id && (
          <div
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
            role="alert"
          >
            Activa una organización para crear tareas.
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">patient_id (UUID)</label>
            <Input
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="uuid del paciente"
              onKeyDown={(e) => {
                if (e.key === "Enter") void create();
              }}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Fecha límite</label>
            <Input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="p. ej., Completar nota SOAP"
              onKeyDown={(e) => {
                if (e.key === "Enter") void create();
              }}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Descripción (opcional)</label>
            <textarea
              className="w-full border rounded-md p-2 min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles, enlaces, checklist…"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => void create()}
            disabled={!canCreate}
            aria-busy={loading}
            title={!canCreate ? "Completa patient_id y título" : "Crear tarea"}
          >
            Crear tarea
          </Button>
        </div>
      </section>

      {/* Lista */}
      <section className="space-y-2">
        <div className="text-lg font-semibold">{header}</div>
        <div
          className="border rounded-xl divide-y bg-white"
          aria-busy={loading}
          aria-live="polite"
        >
          {items.length === 0 && !loading && (
            <div className="p-4 text-sm text-gray-600">
              No hay tareas para los filtros seleccionados.
            </div>
          )}

          {items.map((w) => (
            <div key={w.id} className="p-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium break-words">{w.title}</div>
                <div className="text-xs text-gray-600">
                  Paciente: {w.patient_id.slice(0, 8)}… · Estado: {w.status}
                  {" · "}
                  {w.due_at ? `Vence ${fmtDateTime.format(new Date(w.due_at))}` : "Sin fecha"}
                </div>
                {w.description && (
                  <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                    {w.description}
                  </div>
                )}
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {w.status === "open" ? (
                  <Button type="button" onClick={() => void mark(w.id, true)}>
                    Marcar como hecha
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void mark(w.id, false)}
                  >
                    Reabrir
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void removeItem(w.id)}
                  title="Borrar tarea"
                >
                  Borrar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
