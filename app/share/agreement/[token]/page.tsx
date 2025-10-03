// app/share/agreement/[token]/page.tsx
"use client";

import * as React from "react";
import { useParams } from "next/navigation";

export default function AgreementSharePage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tpl, setTpl] = React.useState<{
    title: string;
    description?: string | null;
    content: any;
  } | null>(null);
  const [fullName, setFullName] = React.useState("");
  const [checks, setChecks] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/agreements/share/${token}`, { cache: "no-store" });
        const j = await r.json();
        if (!j?.ok) {
          setError(j?.error?.message || "No disponible");
          setTpl(null);
        } else {
          setTpl(j.data.template);
          const def: Record<string, boolean> = {};
          (j.data.template?.content?.clauses ?? []).forEach((c: any) => {
            def[c.key] = !!c.defaultChecked;
          });
          setChecks(def);
        }
      } catch {
        setError("No disponible");
        setTpl(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function accept() {
    if (!tpl) return;
    // Validar cláusulas requeridas
    const clauses = tpl.content?.clauses ?? [];
    for (const c of clauses) {
      if (c.required && !checks[c.key]) {
        alert("Debes aceptar: " + c.label);
        return;
      }
    }
    if (!fullName.trim()) {
      alert("Escribe tu nombre completo");
      return;
    }

    try {
      const r = await fetch(`/api/agreements/share/${token}/accept`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim(), accept: true, extra: { checks } }),
      });
      const j = await r.json();
      if (!j?.ok) {
        alert(j?.error?.message || "Error");
        return;
      }
      alert("Acuerdo aceptado ✅");
      window.location.replace("/");
    } catch {
      alert("No se pudo registrar tu aceptación");
    }
  }

  if (loading)
    return (
      <main className="p-6">
        <p>Cargando…</p>
      </main>
    );
  if (error)
    return (
      <main className="p-6">
        <p className="text-rose-600">{error}</p>
      </main>
    );
  if (!tpl)
    return (
      <main className="p-6">
        <p>No disponible</p>
      </main>
    );

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">{tpl.title}</h1>
      {tpl.description && <p className="text-slate-600">{tpl.description}</p>}

      <section className="rounded-2xl border bg-white p-4 space-y-3">
        {(tpl.content?.clauses ?? []).map((c: any) => (
          <label key={c.key} className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={!!checks[c.key]}
              onChange={(e: any) => setChecks((prev: any) => ({ ...prev, [c.key]: e.target.checked }))}
            />
            <span>
              {c.label}
              {c.required ? " *" : ""}
            </span>
          </label>
        ))}
        {tpl.content?.extra_rules && (
          <div className="mt-2 p-3 rounded bg-slate-50 text-sm">
            <strong>Reglas adicionales:</strong>
            <div className="whitespace-pre-wrap">{tpl.content.extra_rules}</div>
          </div>
        )}
      </section>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-500">Nombre completo (firma)</span>
        <input
          className="rounded-xl border px-3 py-2"
          value={fullName}
          onChange={(e: any) => setFullName(e.target.value)}
          placeholder="Nombre Apellidos"
        />
      </label>

      <button onClick={accept} className="px-4 py-2 rounded-xl bg-blue-600 text-white">
        Aceptar acuerdo
      </button>
      <p className="text-xs text-slate-500">Al continuar aceptas los términos arriba descritos.</p>
    </main>
  );
}
