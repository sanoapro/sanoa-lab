"use client";
import { useState } from "react";
import type { FormField, FormSchema } from "@/types/forms";

type Props = {
  schema: FormSchema;
  onSubmit: (answers: Record<string, unknown>) => Promise<void> | void;
  submitting?: boolean;
};

function Likert({ f, value, onChange }: { f: Extract<FormField, { type: "likert" }>; value?: number; onChange: (n: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="font-medium">{f.label}</div>
      <div className="flex gap-2 items-center">
        {f.options.map((opt) => (
          <label key={opt} className="inline-flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name={f.key}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="cursor-pointer"
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function FormRenderer({ schema, onSubmit, submitting }: Props) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});

  const setVal = (k: string, v: unknown) => setAnswers((s) => ({ ...s, [k]: v }));

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(answers);
      }}
    >
      <h1 className="text-2xl font-semibold">{schema.title}</h1>

      {schema.fields.map((f) => {
        if (f.type === "text") {
          return (
            <div key={f.key} className="space-y-2">
              <label className="font-medium">{f.label}</label>
              <input
                type="text"
                className="w-full rounded border p-2"
                value={(answers[f.key] as string) || ""}
                onChange={(e) => setVal(f.key, e.target.value)}
              />
            </div>
          );
        }
        if (f.type === "date") {
          return (
            <div key={f.key} className="space-y-2">
              <label className="font-medium">{f.label}</label>
              <input
                type="date"
                className="w-full rounded border p-2"
                value={(answers[f.key] as string) || ""}
                onChange={(e) => setVal(f.key, e.target.value)}
              />
            </div>
          );
        }
        if (f.type === "checkbox") {
          const val = Boolean(answers[f.key] ?? false);
          return (
            <label key={f.key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={val}
                onChange={(e) => setVal(f.key, e.target.checked)}
              />
              <span>{f.label}</span>
            </label>
          );
        }
        if (f.type === "likert") {
          return (
            <Likert
              key={f.key}
              f={f}
              value={Number(answers[f.key] ?? NaN)}
              onChange={(n) => setVal(f.key, n)}
            />
          );
        }
        return null;
      })}

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
      >
        {submitting ? "Guardando..." : "Guardar respuesta"}
      </button>
    </form>
  );
}
