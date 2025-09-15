// /workspaces/sanoa-lab/lib/note-templates.ts
import { getSupabaseBrowser } from "./supabase-browser";
import { getCurrentOrgId } from "./org";

/**
 * =========================
 * 1) API ORIGINAL (built-in)
 * =========================
 */
export type NoteTemplateKey = "SOAP" | "DARE";

export function getTemplate(key: NoteTemplateKey) {
  if (key === "SOAP") {
    return {
      titulo: "Nota SOAP",
      contenido: `S - Subjetivo:
- Motivo de consulta:
- Síntomas/Relato del paciente:

O - Objetivo:
- Observaciones clínicas:
- Resultados/mediciones relevantes:

A - Análisis:
- Impresión clínica / hipótesis:

P - Plan:
- Intervenciones / Tareas:
- Seguimiento / Próxima cita:`,
    };
  }
  // DARE
  return {
    titulo: "Nota DARE",
    contenido: `D - Datos:
- Hechos/mediciones:

A - Análisis:
- Interpretación/hipótesis:

R - Respuesta:
- Intervención realizada / reacción:

E - Evaluación:
- Resultados/efectos / próximos pasos:`,
  };
}

/** Versión "DB-like" de las plantillas built-in para mezclarlas con las de BD si se requiere */
function builtInTemplatesDb(): NoteTemplate[] {
  const soap = getTemplate("SOAP");
  const dare = getTemplate("DARE");
  const epoch = "1970-01-01T00:00:00.000Z";
  return [
    {
      id: "builtin:SOAP",
      owner_id: "builtin",
      org_id: null,
      name: soap.titulo,
      body: soap.contenido,
      created_at: epoch,
    },
    {
      id: "builtin:DARE",
      owner_id: "builtin",
      org_id: null,
      name: dare.titulo,
      body: dare.contenido,
      created_at: epoch,
    },
  ];
}

/**
 * ======================================
 * 2) NUEVO: Plantillas persistidas en BD
 * ======================================
 */
export interface NoteTemplate {
  id: string;
  owner_id: string;
  org_id: string | null;
  name: string;
  body: string;
  created_at: string;
}

/**
 * Lista plantillas desde la tabla `note_templates`.
 * - includeOrg=true: devuelve personales (owner_id=user) **o** de la org actual (org_id=current_org)
 * - includeOrg=false: devuelve solo personales
 */
export async function listTemplates(includeOrg = true): Promise<NoteTemplate[]> {
  const supabase = getSupabaseBrowser();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) throw new Error("No hay sesión.");

  const orgId = includeOrg ? await getCurrentOrgId().catch(() => null) : null;

  let q = supabase
    .from("note_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (includeOrg && orgId) {
    // personales OR de la organización activa
    q = q.or(`owner_id.eq.${userId},org_id.eq.${orgId}`);
  } else {
    // solo personales
    q = q.eq("owner_id", userId);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as NoteTemplate[];
}

/**
 * Helper: devuelve plantillas de BD + las built-in (útil para pickers)
 * - Las built-in aparecen al final para priorizar las del usuario/organización.
 */
export async function listTemplatesWithDefaults(
  includeOrg = true
): Promise<NoteTemplate[]> {
  const db = await listTemplates(includeOrg).catch(() => []);
  const builtins = builtInTemplatesDb();
  // Evitar duplicados si algún día guardas una con mismo id (poco probable):
  const ids = new Set(db.map((t) => t.id));
  const merged = [...db, ...builtins.filter((b) => !ids.has(b.id))];
  return merged;
}

/**
 * Crea una plantilla:
 * - scope "personal": org_id = null
 * - scope "org": org_id = current_org (si no hay org activa, queda null)
 */
export async function createTemplate(
  name: string,
  body: string,
  scope: "personal" | "org" = "personal"
): Promise<NoteTemplate> {
  const supabase = getSupabaseBrowser();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new Error("No hay sesión.");

  const orgId = scope === "org" ? await getCurrentOrgId().catch(() => null) : null;

  const payload = {
    owner_id: auth.user.id,
    org_id: orgId ?? null,
    name,
    body,
  };

  const { data, error } = await supabase
    .from("note_templates")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as NoteTemplate;
}

/** Borra una plantilla por id (respeta RLS) */
export async function deleteTemplate(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("note_templates").delete().eq("id", id);
  if (error) throw error;
}
