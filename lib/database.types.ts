export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Gender = "M" | "F" | "O" | "male" | "female" | "other" | (string & {});

export type Database = {
  public: {
    Tables: {
      patients: {
        Row: {
          id: string;
          nombre: string;
          edad: number | null;
          genero: Gender | null;
          created_at: string;
          updated_at: string | null;
          user_id?: string | null; // usado en app/(app)/pacientes/[id]
        };
        Insert: {
          id?: string;
          nombre: string;
          edad?: number | null;
          genero?: Gender | null;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<{
          id: string;
          nombre: string;
          edad: number | null;
          genero: Gender | null;
          user_id: string | null;
          created_at: string;
          updated_at: string | null;
        }>;
        Relationships: [];
      };

      patient_files: {
        Row: {
          id: string;
          user_id: string;
          patient_id: string;
          storage_key: string; // clave en storage
          file_name: string;
          size: number;
          mime_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          patient_id: string;
          storage_key: string;
          file_name: string;
          size: number;
          mime_type?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          patient_id: string;
          storage_key: string;
          file_name: string;
          size: number;
          mime_type: string | null;
          created_at: string;
        }>;
        Relationships: [];
      };

      patient_notes: {
        Row: {
          id: string;
          user_id: string | null;
          patient_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null; // opcional para que compile tu insert actual
          patient_id: string;
          content: string;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string | null;
          patient_id: string;
          content: string;
          created_at: string;
        }>;
        Relationships: [];
      };

      // Alineado a tu código (owner_id, grantee_email, can_edit)
      patient_shares: {
        Row: {
          id: string;
          owner_id: string;
          patient_id: string;
          grantee_email: string;
          can_edit: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          patient_id: string;
          grantee_email: string;
          can_edit: boolean;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          owner_id: string;
          patient_id: string;
          grantee_email: string;
          can_edit: boolean;
          created_at: string;
        }>;
        Relationships: [];
      };

      // Preferencias de usuario (usado en lib/org.ts)
      user_prefs: {
        Row: {
          user_id: string;
          current_org_id: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          current_org_id: string;
          updated_at?: string;
        };
        Update: Partial<{
          user_id: string;
          current_org_id: string;
          updated_at: string;
        }>;
        Relationships: [];
      };

      // Si también usas user_org_prefs en algún lado, lo dejamos:
      user_org_prefs: {
        Row: {
          user_id: string;
          current_org_id: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          current_org_id: string;
          updated_at?: string;
        };
        Update: Partial<{
          user_id: string;
          current_org_id: string;
          updated_at: string;
        }>;
        Relationships: [];
      };

      // Bitácora usada en lib/audit.ts
      audit_log: {
        Row: {
          id: string;
          patient_id: string;
          action: string;
          user_id: string | null;
          meta: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          action: string;
          user_id?: string | null;
          meta?: Json | null;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          patient_id: string;
          action: string;
          user_id: string | null;
          meta: Json | null;
          created_at: string;
        }>;
        Relationships: [];
      };
    };

    Views: {
      // Vista usada en lib/org.ts
      v_my_orgs: {
        Row: {
          id: string;
          name: string;
          slug: string;
          is_personal: boolean;
          role: string;
        };
      };
    };

    Functions: {};
    Enums: {
      Gender: Gender;
    };
  };
};
