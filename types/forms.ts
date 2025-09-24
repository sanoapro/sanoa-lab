export type FormField =
  | { key: string; label: string; type: "text" | "date" | "checkbox" }
  | { key: string; label: string; type: "likert"; options: number[] };

export type FormSchema = {
  key: string;
  title: string;
  type: "questionnaire" | "consent";
  scoring?: "sum";
  fields: FormField[];
};

export type FormTemplate = {
  id: string;
  org_id: string;
  name: string;
  specialty: string;
  version: number;
  schema: FormSchema;
  is_active: boolean;
  created_by: string;
  created_at: string;
};

export type FormResponse = {
  id: string;
  template_id: string;
  org_id: string;
  patient_id: string;
  answers: Record<string, unknown>;
  score?: { total?: number; subscales?: Record<string, number> };
  signed_by?: string | null;
  created_by: string;
  created_at: string;
};
