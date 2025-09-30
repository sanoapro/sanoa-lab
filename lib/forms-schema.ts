import type { FormSchema } from "@/types/forms";

export function validateAnswers(schema: FormSchema, answers: Record<string, any>) {
  const fields = (schema as any)?.fields ?? [];
  const missing: string[] = [];
  for (const f of fields) {
    if (
      f.required &&
      (answers[f.key] === undefined || answers[f.key] === null || answers[f.key] === "")
    ) {
      missing.push(f.key);
    }
  }
  return { ok: missing.length === 0, missing };
}

export function computeSumScore(schema: FormSchema, answers: Record<string, any>) {
  const fields = (schema as any)?.fields ?? [];
  let total = 0;
  for (const f of fields) {
    if (f.type === "likert") {
      const v = Number(answers[f.key] ?? 0);
      if (!Number.isNaN(v)) total += v;
    }
  }
  return { total, subscales: {} };
}
