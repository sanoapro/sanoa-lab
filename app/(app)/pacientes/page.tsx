"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import ColorEmoji from "@/components/ColorEmoji";
import { showToast } from "@/components/Toaster";
import { createPatient, deletePatient, listPatients, type Genero, type Patient } from "@/lib/patients";
import { usePatientsRealtime } from "@/hooks/usePatientsRealtime";

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Patient[]>([]);
  const [q, setQ] = useState("");
  const [fGenero, setFGenero] = useState<"" | Genero>("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPatients({ q, genero: fGenero });
      setPacientes(data);
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "No se pudo cargar pacientes.", "error");
    } finally {
      setLoading(false);
    }
  }, [q, fGenero]);

  // Carga inicial
  useEffect(() => { refresh(); }, [refresh]);

  // Re-filtrado con debounce al escribir/buscar
  useEffect(() => {
    const t = setTimeout(() => { refresh(); }, 350);
    return () => clearTimeout(t);
  }, [q, fGenero, refresh]);

  // 🔴 Realtime: refresca cuando hay cambios en DB (de este usuario)
  usePatientsRealtime(refresh, 250);

  const filtered = useMemo(() => pacientes, [pacientes]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const nombre = String(d.get("nombre") || "").trim();
    const edad = Number(d.get("edad") || 0);
    const genero = (String(d.get("genero") || "O") as Genero);
    if (!nombre) { showToast("Escribe un nombre.", "info"); return; }
    if (!Number.isFinite(edad) || edad < 0) { showToast("Edad inválida.", "error"); return; }

    try {
      const nuevo = await createPatient({ nombre, edad, genero });
      setPacientes(prev => [nuevo, ...prev].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      (e.currentTarget as HTMLFormElement).reset();
      setCreating(false);
      showToast("Paciente creado.", "success");
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "No se pudo crear.", "error");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar paciente?")) return;
    try {
      await deletePatient(id);
      setPacientes(prev => prev.filter(p => p.id !== id));
      showToast("Paciente eliminado.", "success");
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "No se pudo eliminar.", "error");
    }
  }

  return (
    <main className="p-6 md:p-10 space-y-8">
      {/* Encabezado */}
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3">
          <ColorEmoji token="pacientes" size={28} />
          Pacientes
        </h1>
        <p className="text-[var(--color-brand-bluegray)]">
          Datos en Supabase con RLS por usuario (+ Realtime).
        </p>
      </header>

      {/* Barra de acciones */}
      <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-sm text-[var(--color-brand-text)]/80 flex items-center gap-2">
              <ColorEmoji token="busqueda" size={16} /> Buscar
            </span>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Nombre del paciente…"
              className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-sm text-[var(--color-brand-text)]/80">Género</span>
            <select
              value={fGenero}
              onChange={e => setFGenero(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
            >
              <option value="">Todos</option>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
              <option value="O">Otro</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              onClick={() => setCreating(v => !v)}
              className="w-full rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90 flex items-center justify-center gap-2"
            >
              <ColorEmoji token="guardar" size={18} /> {creating ? "Cerrar" : "Nuevo paciente"}
            </button>
          </div>
        </div>

        {creating && (
          <>
            <div className="h-px bg-[var(--color-brand-border)] mx-6" />
            <form onSubmit={onCreate} className="p-6 grid grid-cols-1 sm:grid-cols-5 gap-4">
              <input name="nombre" placeholder="Nombre completo" className="sm:col-span-2 rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2" />
              <input name="edad" type="number" min="0" placeholder="Edad" className="rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2" />
              <select name="genero" className="rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2">
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
                <option value="O">Otro</option>
              </select>
              <button className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90 flex items-center justify-center gap-2">
                <ColorEmoji token="guardar" size={18} /> Guardar
              </button>
            </form>
          </>
        )}
      </section>

      {/* Lista */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full rounded-2xl border border-[var(--color-brand-border)] bg-white p-6 text-[var(--color-brand-bluegray)]">
            Cargando…
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-[var(--color-brand-border)] bg-white p-6 text-[var(--color-brand-bluegray)]">
            Sin resultados.
          </div>
        ) : filtered.map((p) => (
          <article key={p.id}
            className="group rounded-3xl bg-white/95 border border-[var(--color-brand-border)]
                       shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_38px_rgba(0,0,0,0.08)]
                       transition overflow-hidden">
            <div className="p-6 flex items-start gap-4">
              <div className="rounded-2xl p-4 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
                <ColorEmoji token="usuario" size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[var(--color-brand-text)] truncate">{p.nombre}</h3>
                <p className="text-sm text-[var(--color-brand-bluegray)]">Edad: {p.edad} · Género: {p.genero}</p>
                <p className="text-xs text-[var(--color-brand-bluegray)]/80">Creado: {new Date(p.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="h-px bg-[var(--color-brand-border)] mx-6" />

            <div className="p-4 grid grid-cols-2 gap-3">
              <Link href={`/pacientes/${p.id}`} className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2 hover:bg-[var(--color-brand-background)] flex items-center justify-center gap-2 text-sm">
                <ColorEmoji token="ver" size={16} /> Ver ficha
              </Link>
              <button onClick={() => onDelete(p.id)} className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2 hover:bg-red-50 flex items-center justify-center gap-2 text-sm text-red-600">
                <ColorEmoji token="borrar" size={16} /> Eliminar
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
