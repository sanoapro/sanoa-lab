"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ColorEmoji from "@/components/ColorEmoji";
import {
  searchPatients,
  type PatientSearchFilters,
  type PatientSearchResult,
} from "@/lib/patients-search";
import { createPatient, deletePatient } from "@/lib/patients";
import Modal from "@/components/Modal";
import { showToast } from "@/components/Toaster";

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

export default function PacientesPage() {
  // ===== Filtros y paginación (conservados) =====
  const [filters, setFilters] = useState<PatientSearchFilters>({
    q: "",
    genero: "ALL",
    edadMin: null,
    edadMax: null,
    createdFrom: null,
    createdTo: null,
    orderBy: "created_at",
    orderDir: "desc",
    page: 1,
    pageSize: 10,
  });
  const [result, setResult] = useState<PatientSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Debounce para búsqueda por nombre
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
    setFilters((f) => ({ ...f, orderBy, orderDir, page: 1 }));
    void doSearch(1);
  }

  const totalPages = useMemo(() => {
    if (!result) return 1;
    return Math.max(1, Math.ceil(result.count / result.pageSize));
  }, [result]);

  async function doSearch(nextPage?: number, overrides?: Partial<PatientSearchFilters>) {
    setLoading(true);
    setErr(null);
    try {
      const payload: PatientSearchFilters = { ...filters, ...(overrides || {}), page: nextPage ?? filters.page };
      const rs = await searchPatients(payload);
      setResult(rs);
      setFilters((f) => ({ ...f, page: rs.page })); // sincroniza página mostrada
    } catch (e) {
      setErr(toSpanishListError(e));
    } finally {
      setLoading(false);
    }
  }

  // primera carga
  useEffect(() => {
    void doSearch(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // dispara búsqueda cuando el debounce cambia
  useEffect(() => {
    setFilters((f) => ({ ...f, q: qDebounced, page: 1 }));
    if (qDebounced !== filters.q) {
      void doSearch(1, { q: qDebounced });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void doSearch(1);
  }

  function onClear() {
    setQInput("");
    setQDebounced("");
    setFilters({
      q: "",
      genero: "ALL",
      edadMin: null,
      edadMax: null,
      createdFrom: null,
      createdTo: null,
      orderBy: "created_at",
      orderDir: "desc",
      page: 1,
      pageSize: 10,
    });
    setTimeout(() => void doSearch(1, { q: "" }), 0);
  }

  // ===== Crear / Borrar =====
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

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este paciente? Esta acción no se puede deshacer.")) return;
    setLoading(true);
    try {
      await deletePatient(id);
      await doSearch(filters.page);
      showToast({ title: "Eliminado", description: "Paciente eliminado." });
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

  return (
    <main className="page-bg min-h-[100dvh] p-6 md:p-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-brand-text)] flex items-center gap-3">
          <ColorEmoji token="pacientes" size={24} />
          Pacientes
        </h1>
        <p className="text-[var(--color-brand-bluegray)]">
          Filtra por nombre, género, edad y fechas. Los resultados respetan tus permisos
          (propios o compartidos).
        </p>
      </header>

      {/* Barra de acciones (Nuevo paciente) */}
      <div className="flex items-center justify-between">
        <div />
        <button
          type="button"
          onClick={() => setOpenCreate(true)}
          disabled={loading}
          className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2"
        >
          <ColorEmoji token="nuevo" size={16} /> Nuevo paciente
        </button>
      </div>

      {/* Filtros */}
      <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        <form onSubmit={onSubmit} className="p-6 grid grid-cols-1 md:grid-cols-12 gap-3">
          <label className="md:col-span-4">
            <span className="text-sm font-medium text-[var(--color-brand-text)]">Nombre</span>
            <input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Buscar por nombre…"
              className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
            />
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-medium text-[var(--color-brand-text)]">Género</span>
            <select
              value={filters.genero || "ALL"}
              onChange={(e) => setFilters((f) => ({ ...f, genero: e.target.value as any, page: 1 }))}
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
              <input
                type="number"
                min={0}
                value={filters.edadMin ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    edadMin: e.target.value === "" ? null : Number(e.target.value),
                    page: 1,
                  }))
                }
                className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              />
            </label>
            <label>
              <span className="text-sm font-medium text-[var(--color-brand-text)]">Edad máx.</span>
              <input
                type="number"
                min={0}
                value={filters.edadMax ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    edadMax: e.target.value === "" ? null : Number(e.target.value),
                    page: 1,
                  }))
                }
                className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              />
            </label>
          </div>

          <div className="md:col-span-3 grid grid-cols-2 gap-3">
            <label>
              <span className="text-sm font-medium text-[var(--color-brand-text)]">Desde</span>
              <input
                type="date"
                value={filters.createdFrom ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, createdFrom: e.target.value || null, page: 1 }))}
                className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              />
            </label>
            <label>
              <span className="text-sm font-medium text-[var(--color-brand-text)]">Hasta</span>
              <input
                type="date"
                value={filters.createdTo ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, createdTo: e.target.value || null, page: 1 }))}
                className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              />
            </label>
          </div>

          {/* Orden simplificado */}
          <label className="md:col-span-3">
            <span className="text-sm font-medium text-[var(--color-brand-text)]">Orden</span>
            <select
              value={sortValue}
              onChange={(e) => setSortFromCombo(e.target.value as SortCombo)}
              className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
            >
              <option value="created_at:desc">Más recientes primero</option>
              <option value="created_at:asc">Más antiguos primero</option>
              <option value="nombre:asc">Nombre A→Z</option>
              <option value="nombre:desc">Nombre Z→A</option>
            </select>
          </label>

          <div className="md:col-span-12 flex flex-wrap gap-3 pt-1">
            <button
              className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2"
              disabled={loading}
              type="submit"
            >
              <ColorEmoji token="buscar" size={16} /> {loading ? "Buscando…" : "Buscar"}
            </button>
            <button
              type="button"
              onClick={onClear}
              className="rounded-xl border border-[var(--color-brand-border)] px-4 py-2 hover:bg-[var(--color-brand-background)] inline-flex items-center gap-2"
            >
              <ColorEmoji token="limpiar" size={16} /> Limpiar
            </button>
            <div className="text-sm text-[var(--color-brand-bluegray)] self-center ml-auto">
              Página {result?.page ?? 1} de {totalPages} · {result?.count ?? 0} resultados
            </div>
          </div>
        </form>
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
                {!result || loading ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-[var(--color-brand-bluegray)]">
                      Cargando…
                    </td>
                  </tr>
                ) : result.rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-[var(--color-brand-bluegray)]">
                      Sin resultados.
                    </td>
                  </tr>
                ) : (
                  result.rows.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-[var(--color-brand-border)] hover:bg-[var(--color-brand-background)]/50"
                    >
                      <td className="py-2 pr-3 text-[var(--color-brand-text)]">{p.nombre}</td>
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
                        <button
                          type="button"
                          onClick={() => void handleDelete(p.id)}
                          disabled={loading}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-300 text-red-700 px-3 py-1.5 hover:bg-red-50"
                          title="Eliminar"
                        >
                          <ColorEmoji token="eliminar" size={14} /> Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-[var(--color-brand-bluegray)]">
              Mostrando{" "}
              {result && result.rows.length > 0 ? (result.page - 1) * result.pageSize + 1 : 0}
              {" – "}
              {result && result.rows.length > 0
                ? (result.page - 1) * result.pageSize + result.rows.length
                : 0}
              {" de "}
              {result?.count ?? 0}
            </div>

            <div className="flex gap-2">
              <button
                className="rounded-xl border border-[var(--color-brand-border)] px-3 py-1.5 hover:bg-[var(--color-brand-background)] inline-flex items-center gap-2"
                disabled={loading || (result?.page ?? 1) <= 1}
                onClick={() => void doSearch((result?.page ?? 1) - 1)}
              >
                <ColorEmoji token="anterior" size={14} /> Anterior
              </button>
              <button
                className="rounded-xl border border-[var(--color-brand-border)] px-3 py-1.5 hover:bg-[var(--color-brand-background)] inline-flex items-center gap-2"
                disabled={loading || (result?.page ?? 1) >= totalPages}
                onClick={() => void doSearch((result?.page ?? 1) + 1)}
              >
                Siguiente <ColorEmoji token="siguiente" size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modal: Nuevo paciente */}
      <Modal open={openCreate} onOpenChange={setOpenCreate} title="Nuevo paciente">
        <div className="space-y-3">
          <label className="block text-sm text-[var(--color-brand-text)]">Nombre *</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre completo"
            className="w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
          />

          <label className="block text-sm text-[var(--color-brand-text)]">Edad</label>
          <input
            type="number"
            inputMode="numeric"
            value={edad}
            onChange={(e) => setEdad(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="Ej. 32"
            className="w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
          />

          <label className="block text-sm text-[var(--color-brand-text)]">Género</label>
          <select
            className="border rounded-md px-3 py-2 w-full"
            value={generoCrear}
            onChange={(e) => setGeneroCrear(e.target.value as "F" | "M" | "O")}
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
            <button
              type="button"
              className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
              onClick={() => void handleCreate()}
              disabled={loading}
            >
              Crear
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}