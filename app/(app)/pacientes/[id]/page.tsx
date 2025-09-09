"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ColorEmoji from "@/components/ColorEmoji";
import { getPatient, type Patient } from "@/lib/patients";
import { showToast } from "@/components/Toaster";

export default function PacienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const p = await getPatient(id);
        setPatient(p);
      } catch (e: any) {
        console.error(e);
        showToast(e?.message || "No se pudo cargar el paciente.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <main className="p-6 md:p-10"><p>Cargando…</p></main>;
  }

  if (!patient) {
    return (
      <main className="p-6 md:p-10">
        <div className="rounded-2xl border border-[var(--color-brand-border)] bg-white p-6">
          <p className="text-red-600">Paciente no encontrado.</p>
          <Link href="/pacientes" className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand-border)] px-3 py-2 hover:bg-[var(--color-brand-background)]">
            <ColorEmoji token="atras" size={16} /> Volver
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 md:p-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-brand-text)] flex items-center gap-3">
          <ColorEmoji token="usuario" size={24} /> {patient.nombre}
        </h1>
        <Link href="/pacientes" className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand-border)] px-3 py-2 hover:bg-[var(--color-brand-background)]">
          <ColorEmoji token="atras" size={16} /> Volver
        </Link>
      </div>

      <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h2 className="font-semibold text-[var(--color-brand-text)]">Datos básicos</h2>
            <p className="text-[var(--color-brand-bluegray)] mt-1 text-sm">
              Edad: {patient.edad} · Género: {patient.genero}
            </p>
          </div>
          <div>
            <h2 className="font-semibold text-[var(--color-brand-text)]">Creación</h2>
            <p className="text-[var(--color-brand-bluegray)] mt-1 text-sm">
              {new Date(patient.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="h-px bg-[var(--color-brand-border)] mx-6" />
        <div className="p-6 text-sm text-[var(--color-brand-text)]/80">
          <p>Próximo: notas, archivos vinculados y eventos clínicos.</p>
        </div>
      </section>
    </main>
  );
}
