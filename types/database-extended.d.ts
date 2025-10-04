// /workspaces/sanoa-lab/types/database-extended.d.ts
import type { Database as Base } from "@/types/database.types";

/**
 * Extiende los tipos generados para cubrir:
 * - Tablas usadas por el código pero ausentes en el dump
 * - Campos adicionales que usa el código (token, expires_at, folio, etc.)
 * - RPCs usadas (para que supa.rpc() tipe bien)
 *
 * ⚠️ Solo tipado. Si la tabla/campo no existe en la DB real, el runtime fallará.
 */

type Public = Base["public"];
type BaseTables = Public["Tables"];

// Fallback genérico para cuando la tabla no existe en el dump generado.
type FallbackTable = {
  Row: Record<string, any>;
  Insert: Record<string, any>;
  Update: Record<string, any>;
};

// Acceso seguro a una tabla del dump. Si no existe, usa FallbackTable.
type TableOrFallback<Name extends PropertyKey> =
  Name extends keyof BaseTables ? BaseTables[Name] : FallbackTable;

export type Database = Base & {
  public: Public & {
    Tables: BaseTables & {
      /**
       * =======================
       * TUS TABLAS PROPIAS (stubs que ya tenías)
       * =======================
       */
      tags: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          color: string | null;
          kind: "tag" | "dx";
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          color?: string | null;
          kind?: "tag" | "dx";
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          owner_id: string;
          name: string;
          color: string | null;
          kind: "tag" | "dx";
          created_at: string;
        }>;
        Relationships: [];
      };

      patient_tags: {
        Row: { patient_id: string; tag_id: string; created_at: string };
        Insert: { patient_id: string; tag_id: string; created_at?: string };
        Update: Partial<{ patient_id: string; tag_id: string; created_at: string }>;
        Relationships: [];
      };

      work_items: {
        Row: {
          id: string;
          org_id: string;
          patient_id: string;
          title: string;
          description: string | null;
          status: "open" | "done";
          due_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          patient_id: string;
          title: string;
          description?: string | null;
          status?: "open" | "done";
          due_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          org_id: string;
          patient_id: string;
          title: string;
          description: string | null;
          status: "open" | "done";
          due_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };

      /**
       * =======================
       * EXTENSIONES / CAMPOS EXTRA SOBRE TABLAS EXISTENTES
       * (si no existen en el dump, se usa fallback y no revienta el compilador)
       * =======================
       */

      // patient_shares: añade token / expires_at / revoked_at / patient_id / org_id
      patient_shares: {
        Row: (TableOrFallback<"patient_shares">["Row"]) & {
          token?: string | null;
          expires_at?: string | null;
          revoked_at?: string | null;
          patient_id?: string | null;
          org_id?: string | null;
        };
        Insert: (TableOrFallback<"patient_shares">["Insert"]) & {
          token?: string | null;
          expires_at?: string | null;
          revoked_at?: string | null;
          patient_id?: string | null;
          org_id?: string | null;
        };
        Update: (TableOrFallback<"patient_shares">["Update"]) & {
          token?: string | null;
          expires_at?: string | null;
          revoked_at?: string | null;
          patient_id?: string | null;
          org_id?: string | null;
        };
      };

      // prescriptions: añade folio / provider_id y hace doctor_id opcional (compat)
      prescriptions: {
        Row: (TableOrFallback<"prescriptions">["Row"]) & {
          folio?: string | null;
          provider_id?: string | null;
          doctor_id?: string | null;
        };
        Insert: (Omit<TableOrFallback<"prescriptions">["Insert"], "doctor_id">) & {
          folio?: string | null;
          provider_id?: string | null;
          doctor_id?: string | null;
        };
        Update: (TableOrFallback<"prescriptions">["Update"]) & {
          folio?: string | null;
          provider_id?: string | null;
          doctor_id?: string | null;
        };
      };

      // referrals: hace doctor_id opcional y añade provider_id (y content/status comunes)
      referrals: {
        Row: (TableOrFallback<"referrals">["Row"]) & {
          provider_id?: string | null;
          doctor_id?: string | null;
          content?: any;
          status?: string;
        };
        Insert: (Omit<TableOrFallback<"referrals">["Insert"], "doctor_id">) & {
          provider_id?: string | null;
          doctor_id?: string | null;
          content?: any;
          status?: string;
        };
        Update: (TableOrFallback<"referrals">["Update"]) & {
          provider_id?: string | null;
          doctor_id?: string | null;
          content?: any;
          status?: string;
        };
      };

      // profiles: asegura id / full_name (sin romper si ya existe con otros campos)
      profiles: {
        Row: (TableOrFallback<"profiles">["Row"]) & Partial<{ id: string; full_name: string | null }>;
        Insert: (TableOrFallback<"profiles">["Insert"]) & Partial<{ id: string; full_name: string | null }>;
        Update: (TableOrFallback<"profiles">["Update"]) & Partial<{ id: string; full_name: string | null }>;
      };

      // patients: asegurar full_name / external_id opcionales
      patients: {
        Row: (TableOrFallback<"patients">["Row"]) & { full_name?: string | null; external_id?: string | null };
        Insert: (TableOrFallback<"patients">["Insert"]) & { full_name?: string | null; external_id?: string | null };
        Update: (TableOrFallback<"patients">["Update"]) & { full_name?: string | null; external_id?: string | null };
      };

      /**
       * =======================
       * TABLAS NUEVAS USADAS POR EL CÓDIGO (stubs completos)
       * =======================
       */

      // Branding para PDFs (alias histórica)
      provider_branding: {
        Row: {
          provider_id: string | null;
          letterhead_url: string | null;
          signature_url: string | null;
          signature_name: string | null;
          clinic_name: string | null;
          license_number: string | null;
          updated_at: string | null;
        };
        Insert: Partial<{
          provider_id: string | null;
          letterhead_url: string | null;
          signature_url: string | null;
          signature_name: string | null;
          clinic_name: string | null;
          license_number: string | null;
          updated_at: string | null;
        }>;
        Update: Partial<{
          provider_id: string | null;
          letterhead_url: string | null;
          signature_url: string | null;
          signature_name: string | null;
          clinic_name: string | null;
          license_number: string | null;
          updated_at: string | null;
        }>;
      };

      // Doctor letterheads (nombre más común)
      doctor_letterheads: {
        Row: {
          provider_id: string | null;
          letterhead_url: string | null;
          signature_url: string | null;
          signature_name: string | null;
          clinic_name: string | null;
          license_number: string | null;
          updated_at: string | null;
        };
        Insert: Partial<{
          provider_id: string | null;
          letterhead_url: string | null;
          signature_url: string | null;
          signature_name: string | null;
          clinic_name: string | null;
          license_number: string | null;
          updated_at: string | null;
        }>;
        Update: Partial<{
          provider_id: string | null;
          letterhead_url: string | null;
          signature_url: string | null;
          signature_name: string | null;
          clinic_name: string | null;
          license_number: string | null;
          updated_at: string | null;
        }>;
      };

      // Plantillas de receta (rx_templates)
      rx_templates: {
        Row: { id: string; org_id: string; name: string; content: any; active: boolean | null; updated_at: string | null; doctor_id?: string | null };
        Insert: { id?: string; org_id: string; name: string; content: any; active?: boolean | null; updated_at?: string | null; doctor_id?: string | null };
        Update: Partial<{ id: string; org_id: string; name: string; content: any; active: boolean | null; updated_at: string | null; doctor_id?: string | null }>;
      };

      agenda_appointments: {
        Row: {
          id: string;
          org_id: string;
          provider_id: string;
          patient_id: string;
          starts_at: string;
          ends_at: string;
          tz: string | null;
          location: string | null;
          notes: string | null;
          status: "scheduled" | "completed" | "cancelled" | "no_show" | string | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          provider_id: string;
          patient_id: string;
          starts_at: string;
          ends_at: string;
          tz?: string | null;
          location?: string | null;
          notes?: string | null;
          status?: "scheduled" | "completed" | "cancelled" | "no_show" | string | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<{
          id: string;
          org_id: string;
          provider_id: string;
          patient_id: string;
          starts_at: string;
          ends_at: string;
          tz: string | null;
          location: string | null;
          notes: string | null;
          status: "scheduled" | "completed" | "cancelled" | "no_show" | string | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        }>;
        Relationships: [];
      };

      // Plantillas de laboratorios (mínimos)
      lab_templates: {
        Row: { id: string; org_id: string; name: string; body?: any; updated_at?: string | null; created_at?: string | null };
        Insert: { id?: string; org_id: string; name: string; body?: any };
        Update: Partial<{ id: string; org_id: string; name: string; body?: any }>;
      };

      // Eventos de trabajo (logs internos)
      work_events: {
        Row: { id: string; org_id: string; assignment_id: string | null; type: string | null; created_at: string | null; payload: any | null };
        Insert: { id?: string; org_id: string; assignment_id?: string | null; type?: string | null; created_at?: string | null; payload?: any | null };
        Update: Partial<{ id: string; org_id: string; assignment_id: string | null; type: string | null; created_at: string | null; payload: any | null }>;
      };
    };

    Functions: Public["Functions"] & {
      // RPC de interacciones de Rx
      rx_check_interactions: {
        Args: { org_id: string; patient_id: string; medications: any };
        Returns: unknown[];
      };

      // RPC de resumen diario
      reports_daily_summary_send: {
        Args: Record<string, never>;
        Returns: { ok: boolean } | null;
      };

      // RPC de recordatorios vencidos
      reminders_run_due: {
        Args: Record<string, never>;
        Returns: { ok: boolean } | null;
      };

      // RPC de reportes programados
      reports_schedules_run: {
        Args: Record<string, never>;
        Returns: { ok: boolean } | null;
      };
    };
  };
};
