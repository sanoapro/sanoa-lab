"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ColorEmoji from "@/components/ColorEmoji";
import {
  searchPatients,
  type PatientSearchFilters,
  type PatientSearchResult,
} from "@/lib/patients-search";

export default function PacientesPage() {
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

  const totalPages = useMemo(() => {
    if (!result) return 1;
    return Math.max(1, Math.ceil(result.count / result.pageSize));
  }, [result]);

  async function doSearch(nextPage?: number) {
    setLoading(true);
    setErr(null);
    try {
      const rs = await searchPatients({ ...filters, page: nextPage ?? filters.page });
      setResult(rs);
      setFilters((f) => ({ ...f, page: rs.page })); // sincroniza
    } catch (e: unknown) {
      setErr((e as any)?.message || "No se pudo buscar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // primera carga
    doSearch(1);
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSearch(1);
  }

  function onClear() {
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
    setTimeout(() => doSearch(1), 0);
  }

  return (
    <main className="p-6 md:p-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-brand-text)] flex items-center gap-3">
          <ColorEmoji token="pacientes" size={24} />
          Pacientes
        </h1>
        <p className="text-[var(--color-brand-bluegray)]">
          Filtra por nombre, género, edad y fechas. Resultados visibles respetan tus permisos
          (propios o compartidos).
        </p>
      </header>

      {/* Filtros */}
      <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        <form onSubmit={onSubmit} className="p-6 grid grid-cols-1 md:grid-cols-12 gap-3">
          <label className="md:col-span-4">
            <span className="text-sm text-[var(--color-brand-text)]/80">Nombre</span>
            <input
              value={filters.q || ""}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              placeholder="Buscar por nombre…"
              className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
            />
          </label>

          <label className="md:col-span-2">
            <span className="text-sm text-[var(--color-brand-text)]/80">Género</span>
            <select
              value={filters.genero || "ALL"}
              onChange={(e) => setFilters((f) => ({ ...f, genero: e.target.value as any }))}
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
              <span className="text-sm text-[var(--color-brand-text)]/80">Edad mín.</span>
              <input
                type="number"
                min={0}
                value={filters.edadMin ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    edadMin: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              />
            </label>
            <label>
              <span className="text-sm text-[var(--color-brand-text)]/80">Edad máx.</span>
              <input
                type="number"
                min={0}
                value={filters.edadMax ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    edadMax: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              />
            </label>
          </div>

          <div className="md:col-span-3 grid grid-cols-2 gap-3">
            <label>
              <span className="text-sm text-[var(--color-brand-text)]/80">Desde</span>
              <input
                type="date"
                value={filters.createdFrom ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, createdFrom: e.target.value || null }))}
                className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              />
            </label>
            <label>
              <span className="text-sm text-[var(--color-brand-text)]/80">Hasta</span>
              <input
                type="date"
                value={filters.createdTo ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, createdTo: e.target.value || null }))}
                className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              />
            </label>
          </div>

          <div className="md:col-span-3 grid grid-cols-2 gap-3">
            <label>
              <span className="text-sm text-[var(--color-brand-text)]/80">Ordenar por</span>
              <select
                value={filters.orderBy}
                onChange={(e) => setFilters((f) => ({ ...f, orderBy: e.target.value as any }))}
                className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              >
                <option value="created_at">Fecha</option>
                <option value="nombre">Nombre</option>
                <option value="edad">Edad</option>
              </select>
            </label>
            <label>
              <span className="text-sm text-[var(--color-brand-text)]/80">Dirección</span>
              <select
                value={filters.orderDir}
                onChange={(e) => setFilters((f) => ({ ...f, orderDir: e.target.value as any }))}
                className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </label>
          </div>

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
          {err && <p className="text-red-600 text-sm mb-3">{err}</p>}

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
                      <td className="py-2 pl-3">
                        <Link
                          href={`/pacientes/${p.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand-border)] px-3 py-1.5 hover:bg-[var(--color-brand-background)]"
                        >
                          Ver <ColorEmoji token="siguiente" size={14} />
                        </Link>
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
                onClick={() => doSearch((result?.page ?? 1) - 1)}
              >
                <ColorEmoji token="anterior" size={14} /> Anterior
              </button>
              <button
                className="rounded-xl border border-[var(--color-brand-border)] px-3 py-1.5 hover:bg-[var(--color-brand-background)] inline-flex items-center gap-2"
                disabled={loading || (result?.page ?? 1) >= totalPages}
                onClick={() => doSearch((result?.page ?? 1) + 1)}
              >
                Siguiente <ColorEmoji token="siguiente" size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
