"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { FormTemplate } from "@/types/forms";

export default function PatientFormsPage() {
  const { id: patientId } = useParams<{ id: string }>();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/forms/templates?specialty=mente`);
      const j = await r.json();
      setTemplates(j.templates || []);
    })();
  }, []);

  const items = useMemo(
    () =>
      templates.map((t) => ({
        id: t.id,
        name: t.name,
      })),
    [templates],
  );

  return (
    <div className="p-4 max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Formularios del paciente</h1>
      <p className="text-sm text-gray-600">
        Selecciona una plantilla para crear una nueva respuesta.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((it) => (
          <Link
            key={it.id}
            className="rounded border p-4 hover:bg-gray-50"
            href={`/forms/new/${it.id}?patient_id=${patientId}`}
          >
            {it.name}
          </Link>
        ))}
      </div>

      {/* Aquí más adelante listaremos respuestas existentes del paciente */}
    </div>
  );
}
