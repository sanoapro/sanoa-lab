// /workspaces/sanoa-lab/app/(app)/pacientes/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ColorEmoji from "@/components/ColorEmoji";
import {
  listPatients,
  createPatient,
  softDeletePatient,
  restorePatient,
  type Patient,
} from "@/lib/patients";
import Modal from "@/components/Modal";
import { showToast } from "@/components/Toaster";
import { listMyTags, type Tag } from "@/lib/tags";
import { getActiveOrg } from "@/lib/org-local";
import clsx from "clsx";

// NUEVO: shadcn/ui + lucide para botones/inputs modernos
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Traducción/normalización de errores frecuentes en listados */
function toSpanishListError(e: unknown): string {
  const msg =
    typeof e === "object" && e && "message" in e ? String((e as any).message) : String(e ?? "");
  if (/stack depth limit exceeded/i.test(msg)) {
    return "La consulta es demasiado compleja o recursiva. Sugerencias: reduce filtros activos, acota el rango de fechas o intenta con menos términos. Si persiste, vuelve a intentarlo más tarde.";
  }
  return msg || "Ocurrió un error al buscar pacientes.";
}

type SortCombo = "created_at:desc" | "created_at:asc" | "nombre:asc" | "nombre:desc";
type GenderOpt = "ALL" | "F" | "M" | "O";

export default function PacientesPage() {
  // ===== Filtros y paginación (mantiene tu estructura visual) =====
  const [filters, setFilters] = useState({
    q: "",
    genero: "ALL" as GenderOpt,
    edadMin: null as number | null,
    edadMax: null as number | null,
    createdFrom: null as string | null,
    createdTo: null as string | null,
    orderBy: "created_at" as "created_at" | "nombre",
    orderDir: "desc" as "asc" | "desc",
    includeDeleted: false,
    // nuevas capacidades
    onlyActiveOrg: true,
    useAllMode: false, // false = tagsAny; true = tagsAll
    tagsAny: [] as string[],
    tagsAll: [] as string[],
    // paginación
    page: 1,
    pageSize: 10,
  });

  const [items, setItems] = useState<Patient[]>([]);
  const [serverTotal, setServerTotal] = useState(0); // total que reporta la API (sin filtro de edad cliente)
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Debounce para búsqueda por nombre (campo de entrada separado como en tu UI)
  const [qInput, setQInput] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(qInput), 300);
    return () => clearTimeout(t);
  }, [qInput]);

  // Selector de orden simplificado (4 opciones)
  const sortValue: SortCombo = `${filters.orderBy}:${filters.orderDir}` as SortCombo;
  function setSortFromCombo(v: SortCombo) {
    const [orderBy, orderDir] = v.split(":") as ["created_at" | "nombre", "asc" | "desc"];
    setFilters((f: any) => ({ ...f, orderBy, orderDir, page: 1 }));
    void doSearch(1, { orderBy, orderDir });
  }

  // Paginación (se calcula con el total del servidor)
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(serverTotal / filters.pageSize));
  }, [serverTotal, filters.pageSize]);

  // Aplica filtros de edad en cliente sobre la página actual
  const rows = useMemo(() => {
    return items.filter((p: any) => {
      if (filters.edadMin !== null && (p.edad ?? -Infinity) < filters.edadMin) return false;
      if (filters.edadMax !== null && (p.edad ?? Infinity) > filters.edadMax) return false;
      return true;
    });
  }, [items, filters.edadMin, filters.edadMax]);

  async function doSearch(nextPage?: number, overrides?: Partial<typeof filters>) {
    setLoading(true);
    setErr(null);
    try {
      const merged = { ...filters, ...(overrides || {}), page: nextPage ?? filters.page };

      const res = await listPatients({
        q: merged.q,
        page: merged.page,
        pageSize: merged.pageSize,
        sortBy: merged.orderBy,
        direction: merged.orderDir,
        genero: merged.genero === "ALL" ? undefined : merged.genero,
        from: merged.createdFrom || undefined,
        to: merged.createdTo || undefined,
        includeDeleted: merged.includeDeleted,
        ...(merged.useAllMode ? { tagsAll: merged.tagsAll } : { tagsAny: merged.tagsAny }),
        onlyActiveOrg: merged.onlyActiveOrg,
      });

      setItems(res.items);
      setServerTotal(res.total);
      setFilters((f: any) => ({ ...f, page: res.page })); // sincroniza página mostrada
    } catch (e) {
      setErr(toSpanishListError(e));
    } finally {
      setLoading(false);
    }
  }

  // primera carga + carga de etiquetas
  const [myTags, setMyTags] = useState<Tag[]>([]);
  useEffect(() => {
    void doSearch(1);
    (async () => {
      try {
        const tags = await listMyTags();
        setMyTags(tags);
      } catch {
        // no crítico
      }
    })();
     
  }, []);

  // dispara búsqueda cuando cambia el debounce de q
  useEffect(() => {
    setFilters((f: any) => ({ ...f, q: qDebounced, page: 1 }));
    void doSearch(1, { q: qDebounced });
     
  }, [qDebounced]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void doSearch(1);
  }

  function onClear() {
    setQInput("");
    setQDebounced("");
    const reset = {
      q: "",
      genero: "ALL" as GenderOpt,
      edadMin: null as number | null,
      edadMax: null as number | null,
      createdFrom: null as string | null,
      createdTo: null as string | null,
      orderBy: "created_at" as const,
      orderDir: "desc" as const,
      includeDeleted: false,
      onlyActiveOrg: true,
      useAllMode: false,
      tagsAny: [] as string[],
      tagsAll: [] as string[],
      page: 1,
      pageSize: filters.pageSize,
    };
    setFilters(reset);
    setTimeout(() => void doSearch(1, reset), 0);
  }

  // ===== Crear / Soft-delete / Restaurar =====
  const [openCreate, setOpenCreate] = useState(false);
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState<number | "">("");
  const [generoCrear, setGeneroCrear] = useState<"F" | "M" | "O">("O");

  async function handleCreate() {
    if (!nombre.trim()) {
      showToast({ title: "Valida", description: "El nombre es obligatorio." });
      return;
    }
    setLoading(true);
    try {
      await createPatient({
        nombre: nombre.trim(),
        edad: typeof edad === "number" ? edad : null,
        genero: generoCrear,
      });
      setOpenCreate(false);
      setNombre("");
      setEdad("");
      setGeneroCrear("O");
      await doSearch(1); // vuelve a la primera página con filtros actuales
      showToast({ title: "Listo", description: "Paciente creado." });
    } catch (e: unknown) {
      showToast({
        title: "Error al crear",
        description: (e as Error)?.message ?? "Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSoftDelete(id: string) {
    if (!confirm("¿Enviar este paciente a 'Eliminados'? Podrás restaurarlo luego.")) return;
    setLoading(true);
    try {
      await softDeletePatient(id);
      await doSearch(filters.page);
      showToast({ title: "Eliminado", description: "Paciente movido a 'Eliminados'." });
    } catch (e: unknown) {
      showToast({
        title: "Error al eliminar",
        description: (e as Error)?.message ?? "Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(id: string) {
    setLoading(true);
    try {
      await restorePatient(id);
      await doSearch(filters.page);
      showToast({ title: "Restaurado", description: "Paciente restaurado." });
    } catch (e: unknown) {
      showToast({
        title: "Error al restaurar",
        description: (e as Error)?.message ?? "Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // ===== Facetas (tags) =====
  function toggleTag(id: string) {
    setFilters((f: any) => {
      if (f.useAllMode) {
        const exists = f.tagsAll.includes(id);
        const nextAll = exists ? f.tagsAll.filter((x: any) => x !== id) : [...f.tagsAll, id];
        const next = { ...f, tagsAll: nextAll, page: 1 };
        void doSearch(1, next);
        return next;
      } else {
        const exists = f.tagsAny.includes(id);
        const nextAny = exists ? f.tagsAny.filter((x: any) => x !== id) : [...f.tagsAny, id];
        const next = { ...f, tagsAny: nextAny, page: 1 };
        void doSearch(1, next);
        return next;
      }
    });
  }

  // ===== Export CSV =====
  function exportURL(): string {
    const sp = new URLSearchParams();
    if (qDebounced) sp.set("q", qDebounced);
    if (filters.genero !== "ALL") sp.set("genero", filters.genero);
    if (filters.createdFrom) sp.set("from", filters.createdFrom);
    if (filters.createdTo) sp.set("to", filters.createdTo);
    if (filters.includeDeleted) sp.set("includeDeleted", "1");
    if (filters.useAllMode && filters.tagsAll.length) sp.set("tagsAll", filters.tagsAll.join(","));
    if (!filters.useAllMode && filters.tagsAny.length) sp.set("tagsAny", filters.tagsAny.join(","));
    // Nota: export no fuerza org activa; se exporta todo lo permitido por RLS.
    return `/api/export/pacientes?${sp.toString()}`;
  }

  const activeOrg = getActiveOrg();

  return (
    <main className="page-bg min-h-[100dvh] p-6 md:p-10 space-y-6">
      <header className="space-y-2">
        {/* Conservador: solo cambiamos las clases del título y descripción */}
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white flex items-center gap-3">
          <ColorEmoji token="pacientes" size={24} />
          Pacientes
        </h1>
        <p className="text-slate-600 dark:text-slate-200">
          Filtra por nombre, etiquetas, género, edad y fechas. Los resultados respetan tus permisos
          (propios o compartidos). Puedes exportar a CSV.
        </p>
      </header>

      {/* Barra de acciones (Export CSV + Nuevo paciente) */}
      <div className="flex items-center justify-between">
        <a href={exportURL()} title="Exportar resultados a CSV">
          <Button variant="secondary" className="inline-flex items-center gap-2">
            <ColorEmoji token="exportar" size={16} />
            Exportar CSV
          </Button>
        </a>
        <Button
          type="button"
          onClick={() => setOpenCreate(true)}
          disabled={loading}
          className="inline-flex items-center gap-2"
        >
          <ColorEmoji token="nuevo" size={16} />
          Nuevo paciente
        </Button>
      </div>

      {/* Org activa */}
      <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <div className="text-sm text-[var(--color-brand-text)]">
            Org activa: <strong>{activeOrg.name ?? "—"}</strong>{" "}
            <span className="text-[var(--color-brand-bluegray)]">
              ({activeOrg.id?.slice(0, 8) ?? "sin org"})
            </span>
          </div>
          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.onlyActiveOrg}
              onChange={(e: any) => {
                const onlyActiveOrg = e.target.checked;
                setFilters((f: any) => ({ ...f, onlyActiveOrg, page: 1 }));
                void doSearch(1, { onlyActiveOrg });
              }}
            />
            Sólo org activa
          </label>
        </div>
      </section>

      {/* Filtros principales */}
      <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        <form onSubmit={onSubmit} className="p-6 grid grid-cols-1 md:grid-cols-12 gap-3">
          <label className="md:col-span-4">
            <span className="text-sm font-medium text-[var(--color-brand-text)]">Nombre</span>
            <Input
              value={qInput}
              onChange={(e: any) => setQInput(e.target.value)}
              placeholder="Buscar por nombre…"
              className="mt-1 w-full"
            />
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-medium text-[var(--color-brand-text)]">Género</span>
            <select
              value={filters.genero}
              onChange={(e: any) =>
                setFilters((f: any) => ({ ...f, genero: e.target.value as GenderOpt, page: 1 }))
              }
              className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
            >
              <option value="ALL">Todos</option>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
              <option value="O">Otro</option>
            </select>
          </label>

          <div className="md:col-span-2 grid grid-cols-2 gap-3">
            <label>
              <span className="text-sm font-medium text-[var(--color-brand-text)]">Edad mín.</span>
              <Input
                type="number"
                min={0}
                value={filters.edadMin ?? ""}
                onChange={(e: any) =>
                  setFilters((f: any) => ({
                    ...f,
                    edadMin: e.target.value === "" ? null : Number(e.target.value),
                    page: 1,
                  }))
                }
                className="mt-1 w-full"
              />
            </label>
            <label>
              <span className="text-sm font-medium text-[var(--color-brand-text)]">Edad máx.</span>
              <Input
                type="number"
                min={0}
                value={filters.edadMax ?? ""}
                onChange={(e: any) =>
                  setFilters((f: any) => ({
                    ...f,
                    edadMax: e.target.value === "" ? null : Number(e.target.value),
                    page: 1,
                  }))
                }
                className="mt-1 w-full"
              />
            </label>
          </div>

          <div className="md:col-span-3 grid grid-cols-2 gap-3">
            <label>
              <span className="text-sm font-medium text-[var(--color-brand-text)]">Desde</span>
              <Input
                type="date"
                value={filters.createdFrom ?? ""}
                onChange={(e: any) =>
                  setFilters((f: any) => ({ ...f, createdFrom: e.target.value || null, page: 1 }))
                }
                className="mt-1 w-full"
              />
            </label>
            <label>
              <span className="text-sm font-medium text-[var(--color-brand-text)]">Hasta</span>
              <Input
                type="date"
                value={filters.createdTo ?? ""}
                onChange={(e: any) =>
                  setFilters((f: any) => ({ ...f, createdTo: e.target.value || null, page: 1 }))
                }
                className="mt-1 w-full"
              />
            </label>
          </div>

          {/* Orden simplificado */}
          <label className="md:col-span-2">
            <span className="text-sm font-medium text-[var(--color-brand-text)]">Orden</span>
            <select
              value={sortValue}
              onChange={(e: any) => setSortFromCombo(e.target.value as SortCombo)}
              className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
            >
              <option value="created_at:desc">Más recientes primero</option>
              <option value="created_at:asc">Más antiguos primero</option>
              <option value="nombre:asc">Nombre A→Z</option>
              <option value="nombre:desc">Nombre Z→A</option>
            </select>
          </label>

          {/* Mostrar eliminados */}
          <label className="md:col-span-1 flex items-end gap-2">
            <input
              type="checkbox"
              checked={filters.includeDeleted}
              onChange={(e: any) => {
                setFilters((f: any) => ({ ...f, includeDeleted: e.target.checked, page: 1 }));
                void doSearch(1, { includeDeleted: e.target.checked });
              }}
            />
            <span className="text-sm text-[var(--color-brand-text)]">Mostrar eliminados</span>
          </label>

          <div className="md:col-span-12 flex flex-wrap gap-3 pt-1">
            <Button className="inline-flex items-center gap-2" disabled={loading} type="submit">
              <ColorEmoji token="buscar" size={16} /> {loading ? "Buscando…" : "Buscar"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClear}
              className="inline-flex items-center gap-2"
            >
              <ColorEmoji token="limpiar" size={16} /> Limpiar
            </Button>
            <div className="text-sm text-[var(--color-brand-bluegray)] self-center ml-auto">
              {/* Mostramos cuántos se ven en esta página tras filtro de edad, y total del servidor */}
              {rows.length} mostrados · Total {serverTotal} · Página {filters.page} de {totalPages}
            </div>
          </div>
        </form>
      </section>

      {/* Facetas por Etiquetas */}
      <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-[var(--color-brand-text)]">
              Filtrar por etiquetas
            </div>
            <label className="text-xs flex items-center gap-2 text-[var(--color-brand-bluegray)]">
              <input
                type="checkbox"
                checked={filters.useAllMode}
                onChange={(e: any) => {
                  const useAllMode = e.target.checked;
                  const next = { ...filters, useAllMode, tagsAny: [], tagsAll: [], page: 1 };
                  setFilters(next);
                  void doSearch(1, next);
                }}
              />
              Requerir TODAS
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {myTags.map((t: any) => {
              const active = filters.useAllMode
                ? filters.tagsAll.includes(t.id)
                : filters.tagsAny.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t.id)}
                  className={clsx(
                    "px-3 py-1 rounded-full text-sm border",
                    active
                      ? "bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)]"
                      : "bg-white text-[var(--color-brand-bluegray)] border-[var(--color-brand-border)] hover:bg-[var(--color-brand-background)]",
                  )}
                >
                  {t.name}
                </button>
              );
            })}
            {myTags.length === 0 && (
              <div className="text-sm text-[var(--color-brand-bluegray)]">
                No tienes etiquetas aún.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Resultados */}
      <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="p-6">
          {err && (
            <div
              className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
              aria-live="polite"
            >
              {err}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--color-brand-text)] border-b border-[var(--color-brand-border)]">
                  <th className="py-2 pr-3">Nombre</th>
                  <th className="py-2 px-3">Edad</th>
                  <th className="py-2 px-3">Género</th>
                  <th className="py-2 px-3">Creado</th>
                  <th className="py-2 pl-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-[var(--color-brand-bluegray)]">
                      Cargando…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-[var(--color-brand-bluegray)]">
                      Sin resultados.
                    </td>
                  </tr>
                ) : (
                  rows.map((p: any) => {
                    const isDeleted = !!p.deleted_at;
                    return (
                      <tr
                        key={p.id}
                        className={`border-b border-[var(--color-brand-border)] hover:bg-[var(--color-brand-background)]/50 ${
                          isDeleted ? "opacity-80" : ""
                        }`}
                        title={isDeleted ? "Eliminado (puede restaurarse)" : ""}
                      >
                        <td className="py-2 pr-3 text-[var(--color-brand-text)]">
                          <span className={isDeleted ? "line-through text-gray-500" : ""}>
                            {p.nombre}
                          </span>
                          {isDeleted && (
                            <span className="ml-2 text-xs text-gray-500">(Eliminado)</span>
                          )}
                        </td>
                        <td className="py-2 px-3">{p.edad}</td>
                        <td className="py-2 px-3">{p.genero}</td>
                        <td className="py-2 px-3">{new Date(p.created_at).toLocaleString()}</td>
                        <td className="py-2 pl-3 flex gap-2">
                          <Link
                            href={`/pacientes/${p.id}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand-border)] px-3 py-1.5 hover:bg-[var(--color-brand-background)]"
                          >
                            Ver <ColorEmoji token="siguiente" size={14} />
                          </Link>
                          {!isDeleted ? (
                            <button
                              type="button"
                              onClick={() => void handleSoftDelete(p.id)}
                              disabled={loading}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-300 text-red-700 px-3 py-1.5 hover:bg-red-50"
                              title="Enviar a Eliminados"
                            >
                              <ColorEmoji token="eliminar" size={14} /> Eliminar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void handleRestore(p.id)}
                              disabled={loading}
                              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand-border)] px-3 py-1.5 hover:bg-[var(--color-brand-background)]"
                              title="Restaurar"
                            >
                              <ColorEmoji token="refrescar" size={14} /> Restaurar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación (usa total del servidor) */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-[var(--color-brand-bluegray)]">
              Mostrando {rows.length > 0 ? (filters.page - 1) * filters.pageSize + 1 : 0}
              {" – "}
              {rows.length > 0 ? (filters.page - 1) * filters.pageSize + rows.length : 0}
              {" de "}
              {serverTotal}
            </div>

            <div className="flex gap-2">
              <button
                className="rounded-xl border border-[var(--color-brand-border)] px-3 py-1.5 hover:bg-[var(--color-brand-background)] inline-flex items-center gap-2"
                disabled={loading || filters.page <= 1}
                onClick={() => void doSearch(filters.page - 1)}
              >
                <ColorEmoji token="anterior" size={14} /> Anterior
              </button>
              <button
                className="rounded-xl border border-[var(--color-brand-border)] px-3 py-1.5 hover:bg-[var(--color-brand-background)] inline-flex items-center gap-2"
                disabled={loading || filters.page >= totalPages}
                onClick={() => void doSearch(filters.page + 1)}
              >
                Siguiente <ColorEmoji token="siguiente" size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modal: Nuevo paciente */}
      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Nuevo paciente">
        <div className="space-y-3">
          <label className="block text-sm text-[var(--color-brand-text)]">Nombre *</label>
          <Input
            value={nombre}
            onChange={(e: any) => setNombre(e.target.value)}
            placeholder="Nombre completo"
            className="w-full"
          />

          <label className="block text-sm text-[var(--color-brand-text)]">Edad</label>
          <Input
            type="number"
            inputMode="numeric"
            value={edad}
            onChange={(e: any) => setEdad(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="Ej. 32"
            className="w-full"
          />

          <label className="block text-sm text-[var(--color-brand-text)]">Género</label>
          <select
            className="border rounded-md px-3 py-2 w-full"
            value={generoCrear}
            onChange={(e: any) => setGeneroCrear(e.target.value as "F" | "M" | "O")}
          >
            <option value="O">Otro/Prefiero no decir</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
          </select>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-xl border border-[var(--color-brand-border)] px-4 py-2 hover:bg-[var(--color-brand-background)]"
              onClick={() => setOpenCreate(false)}
              disabled={loading}
            >
              Cancelar
            </button>
            <Button
              type="button"
              className="px-4"
              onClick={() => void handleCreate()}
              disabled={loading}
            >
              Crear
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
