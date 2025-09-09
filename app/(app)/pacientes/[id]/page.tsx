"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "@/lib/supabase-browser";
import ColorEmoji from "@/components/ColorEmoji";

type Patient = {
  id: string;
  owner: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birthdate: string | null;
  sex: "M" | "F" | "O" | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
};

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos editables
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [sex, setSex] = useState<"M" | "F" | "O" | "">("");
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.from("patients").select("*").eq("id", id).single();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const p = data as Patient;
      setFullName(p.full_name ?? "");
      setEmail(p.email ?? "");
      setPhone(p.phone ?? "");
      setBirthdate(p.birthdate ?? "");
      setSex((p.sex ?? "") as any);
      setPhotoUrl(p.photo_url ?? "");

      setLoading(false);
    })();
  }, [id]);

  async function save() {
    if (!fullName.trim()) {
      alert("Nombre es obligatorio");
      return;
    }
    setSaving(true);
    const payload = {
      full_name: fullName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      birthdate: birthdate || null,
      sex: (sex || null) as Patient["sex"],
      photo_url: photoUrl.trim() || null,
    };

    const { error } = await supabase.from("patients").update(payload).eq("id", id);

    setSaving(false);
    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }
    alert("Cambios guardados");
  }

  async function removePatient() {
    if (!confirm("¿Eliminar este paciente? Esta acción no se puede deshacer.")) return;
    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }
    router.push("/pacientes");
  }

  return (
    <main className="p-6 md:p-10 space-y-8">
      {/* Header card */}
      <section
        className="
        w-full rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.06)]
        bg-white/95 border border-[var(--color-brand-border)]
        backdrop-blur-sm overflow-hidden
      "
      >
        <div className="px-7 md:px-10 py-7 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/pacientes"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-[var(--color-brand-border)]
                         hover:bg-[color-mix(in_oklab,white_85%,var(--color-brand-primary)_0%)] transition"
            >
              <ColorEmoji token="atras" />
              Volver
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3">
                <ColorEmoji token="usuario" size={36} />
                {loading ? "Cargando…" : fullName || "Paciente"}
              </h1>
              <p className="mt-1 text-[var(--color-brand-bluegray)]">
                Detalle y edición del paciente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-3
                         bg-[var(--color-brand-primary)] text-white hover:brightness-95 active:brightness-90 transition shadow-sm disabled:opacity-60"
            >
              <ColorEmoji token="guardar" />
              Guardar
            </button>
            <button
              onClick={removePatient}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-3
                         border border-[var(--color-brand-border)]
                         hover:bg-[color-mix(in_oklab,white_85%,var(--color-brand-primary)_0%)]
                         transition"
            >
              <ColorEmoji token="borrar" />
              Eliminar
            </button>
          </div>
        </div>

        {error && (
          <div className="px-7 md:px-10 pb-6">
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          </div>
        )}
      </section>

      {/* Form card */}
      <section
        className="
        w-full rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.06)]
        bg-white/95 border border-[var(--color-brand-border)]
        backdrop-blur-sm overflow-hidden
      "
      >
        <div className="px-7 md:px-10 py-7">
          {loading ? (
            <div className="text-[var(--color-brand-bluegray)]">Cargando…</div>
          ) : (
            <form className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-[var(--color-brand-text)] mb-1">
                  Nombre completo *
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--color-brand-border)] bg-white px-4 py-3
                             text-[var(--color-brand-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--color-brand-text)] mb-1">
                  Foto (URL)
                </label>
                <input
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full rounded-2xl border border-[var(--color-brand-border)] bg-white px-4 py-3
                             text-[var(--color-brand-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                />
                {photoUrl && (
                  <img
                    src={photoUrl}
                    alt="Foto del paciente"
                    className="mt-3 w-28 h-28 object-cover rounded-2xl border border-[var(--color-brand-border)]"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm text-[var(--color-brand-text)] mb-1">Correo</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--color-brand-border)] bg-white px-4 py-3
                             text-[var(--color-brand-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--color-brand-text)] mb-1">
                  Teléfono
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--color-brand-border)] bg-white px-4 py-3
                             text-[var(--color-brand-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--color-brand-text)] mb-1">
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  value={birthdate ?? ""}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--color-brand-border)] bg-white px-4 py-3
                             text-[var(--color-brand-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--color-brand-text)] mb-1">Sexo</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as any)}
                  className="w-full rounded-2xl border border-[var(--color-brand-border)] bg-white px-4 py-3
                             text-[var(--color-brand-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                >
                  <option value="">—</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                  <option value="O">Otro</option>
                </select>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Próximamente: archivos/notas */}
      <section
        className="
        w-full rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.06)]
        bg-white/60 border border-dashed border-[var(--color-brand-border)]
        backdrop-blur-sm overflow-hidden
      "
      >
        <div className="px-7 md:px-10 py-7 text-[var(--color-brand-bluegray)]">
          <div className="flex items-center gap-2">
            <ColorEmoji token="documentos" />
            <strong>Archivos del paciente (próximamente)</strong>
          </div>
          <p className="mt-1">
            Integraremos el mismo estilo de subida/visualización que en <code>/test-ui/upload</code>{" "}
            y lo relacionaremos por paciente.
          </p>
        </div>
      </section>
    </main>
  );
}
