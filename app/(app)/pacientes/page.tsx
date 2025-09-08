"use client";

import { useEffect, useMemo, useState } from "react";
import supabase from "@/lib/supabase-browser";
import Link from "next/link";
import ColorEmoji from "@/components/ColorEmoji";

type Patient = {
  id: string;
  owner: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birthdate: string | null; // ISO yyyy-mm-dd
  sex: "M" | "F" | "O" | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
};

export default function PacientesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [list, setList] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Form
  const [fullName, setFullName] = useState("");
  const [email, setEmail]     = useState("");
  const [phone, setPhone]     = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [sex, setSex] = useState<"M"|"F"|"O"|"">("");

  useEffect(() => {
    (async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setUserId(user?.id ?? null);
      await refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setList((data ?? []) as Patient[]);
    setLoading(false);
  }

  async function addPatient(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    if (!fullName.trim()) {
      alert("Nombre es obligatorio");
      return;
    }

    const payload = {
      owner: userId,
      full_name: fullName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      birthdate: birthdate || null,
      sex: (sex || null) as Patient["sex"],
    };

    const { error } = await supabase.from("patients").insert(payload);
    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    // Reset + Refresh
    setFullName("");
    setEmail("");
    setPhone("");
    setBirthdate("");
    setSex("");
    await refresh();
  }

  async function removePatient(id: string) {
    if (!confirm("¿Eliminar paciente?")) return;
    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }
    await refresh();
  }

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter((p) =>
      [p.full_name, p.email ?? "", p.phone ?? ""].some((v) =>
        v.toLowerCase().includes(t)
      )
    );
  }, [list, q]);

  return (
    <main className="p-6 md:p-10 space-y-8">
      {/* Header card */}
      <section className="
        w-full rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.06)]
        bg-white/95 border border-[var(--color-brand-border)]
        backdrop-blur-sm overflow-hidden
      ">
        <div className="px-7 md:px-10 py-7 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3">
              <ColorEmoji emoji="👥" size={36} />
              Pacientes
            </h1>
            <p className="mt-1 text-[var(--color-brand-bluegray)]">
              Administra tu lista de pacientes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, correo o teléfono…"
              className="rounded-2xl border border-[var(--color-brand-border)] bg-white px-4 py-3 min-w-[260px]
                         text-[var(--color-brand-text)]
                         focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
            />
            <button
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-3
                         bg-[var(--color-brand-primary)] text-white hover:brightness-95 active:brightness-90 transition shadow-sm"
            >
              <ColorEmoji emoji="🔄" />
              Actualizar
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
      <section className="
        w-full rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.06)]
        bg-white/95 border border-[var(--color-brand-border)]
        backdrop-blur-sm overflow-hidden
      ">
        <div className="px-7 md:px-10 py-7">
          <h2 className="text-xl font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
            <ColorEmoji emoji="➕" />
            Agregar paciente
          </h2>

          <form onSubmit={addPatient} className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="col-span-1 md:col-span-1">
              <label className="block text-sm text-[var(--color-brand-text)] mb-1">Nombre completo *</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-2xl border border-[var(--color-brand-border)] bg-white px-4 py-3
                           text-[var(--color-brand-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                required
                placeholder="Ej. Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--color-brand-text)] mb-1">Correo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-[var(--color-brand-border)] bg-white px-4 py-3
                           text-[var(--color-brand-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                placeholder="juan@correo.com"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--color-brand-text)] mb-1">Teléfono</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl border border-[var(--color-brand-border)] bg-white px-4 py-3
                           text-[var(--color-brand-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                placeholder="+52 55 0000 0000"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--color-brand-text)] mb-1">Fecha de nacimiento</label>
              <input
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full rounded-2xl border border-[var(--color-brand-border)] bg-white px-4 py-3
                           text-[var(--color-brand-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--color-brand-text)] mb-1">Sexo (opcional)</label>
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

            <div className="md:col-span-3 flex justify-end pt-1">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-3
                           bg-[var(--color-brand-primary)] text-white hover:brightness-95 active:brightness-90 transition shadow-sm"
              >
                <ColorEmoji emoji="💾" />
                Guardar
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* List card */}
      <section className="
        w-full rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.06)]
        bg-white/95 border border-[var(--color-brand-border)]
        backdrop-blur-sm overflow-hidden
      ">
        <div className="px-7 md:px-10 py-5">
          <h2 className="text-xl font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
            <ColorEmoji emoji="📋" />
            Lista
          </h2>
        </div>

        {loading ? (
          <div className="px-7 md:px-10 pb-8 text-[var(--color-brand-bluegray)]">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="px-7 md:px-10 pb-8 text-[var(--color-brand-bluegray)]">
            Sin pacientes. Agrega el primero 👇
          </div>
        ) : (
          <div className="px-7 md:px-10 pb-8 overflow-x-auto">
            <table className="min-w-full text-[var(--color-brand-text)]">
              <thead>
                <tr className="text-left text-sm text-[var(--color-brand-bluegray)] border-b border-[var(--color-brand-border)]">
                  <th className="py-3 pr-4">Nombre</th>
                  <th className="py-3 pr-4">Correo</th>
                  <th className="py-3 pr-4">Teléfono</th>
                  <th className="py-3 pr-4">Nacimiento</th>
                  <th className="py-3 pr-4">Sexo</th>
                  <th className="py-3 pr-0 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--color-brand-border)]/70">
                    <td className="py-3 pr-4">{p.full_name}</td>
                    <td className="py-3 pr-4">{p.email ?? "—"}</td>
                    <td className="py-3 pr-4">{p.phone ?? "—"}</td>
                    <td className="py-3 pr-4">{p.birthdate ?? "—"}</td>
                    <td className="py-3 pr-4">{p.sex ?? "—"}</td>
                    <td className="py-3 pr-0">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => removePatient(p.id)}
                          className="inline-flex items-center gap-2 rounded-xl px-3 py-2
                                     border border-[var(--color-brand-border)]
                                     hover:bg-[color-mix(in_oklab,white_85%,var(--color-brand-primary)_0%)]
                                     transition"
                          title="Eliminar"
                        >
                          <ColorEmoji emoji="🗑️" />
                          Eliminar
                        </button>

                        <Link
                          href={`/pacientes/${p.id}`}
                          className="inline-flex items-center gap-2 rounded-xl px-3 py-2
                                     bg-[var(--color-brand-primary)] text-white hover:brightness-95 transition"
                          title="Ver"
                        >
                          <ColorEmoji emoji="👁️" />
                          Ver
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
