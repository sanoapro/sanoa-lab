"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import FormRenderer from "@/components/forms/FormRenderer";
import type { FormTemplate } from "@/types/forms";

function Inner() {
  const params = useParams<{ templateId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const patientId = search.get("patient_id") || ""; // ?patient_id=...

  const [tpl, setTpl] = useState<FormTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/forms/templates?specialty=mente`);
      const j = await r.json();
      const t: FormTemplate | undefined = (j.templates || []).find(
        (x: FormTemplate) => x.id === params.templateId,
      );
      setTpl(t || null);
    })();
  }, [params.templateId]);

  if (!patientId) {
    return (
      <div className="p-4">
        Falta <code>patient_id</code> en la URL.
      </div>
    );
  }
  if (!tpl) return <div className="p-4">Cargando...</div>;

  return (
    <div className="p-4 max-w-2xl">
      <FormRenderer
        schema={tpl.schema}
        submitting={saving}
        onSubmit={async (answers) => {
          try {
            setSaving(true);
            const r = await fetch("/api/forms/responses", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                template_id: tpl.id,
                patient_id: patientId,
                answers,
              }),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || "Error al guardar");
            router.push(`/pacientes/${patientId}/formularios`);
          } catch (e: any) {
            alert(e?.message || "No fue posible guardar");
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4">Cargando…</div>}>
      <Inner />
    </Suspense>
  );
}
