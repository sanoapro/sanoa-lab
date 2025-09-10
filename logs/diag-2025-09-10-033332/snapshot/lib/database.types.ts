// Shim de tipos: sólo lo necesario que usa tu código.
// Cuando quieras, lo reemplazamos por el generado del CLI de Supabase.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Gender = "M" | "F" | "O" | "male" | "female" | "other" | (string & {}); // permite valores existentes sin romper

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
          user_id?: string | null;
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
          storage_key: string; // <- en tu código antes ponía "path"
          file_name: string;
          size: number;
          mime_type: string | null;
          created_at: string;
        };
        Insert: Omit<
          {
            id?: string;
            user_id: string;
            patient_id: string;
            storage_key: string;
            file_name: string;
            size: number;
            mime_type?: string | null;
            created_at?: string;
          },
          never
        >;
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
          user_id: string;
          patient_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          patient_id: string;
          content: string;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          patient_id: string;
          content: string;
          created_at: string;
        }>;
        Relationships: [];
      };

      patient_shares: {
        Row: {
          id: string;
          user_id: string;
          patient_id: string;
          token: string;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          patient_id: string;
          token: string;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          patient_id: string;
          token: string;
          expires_at: string | null;
          created_at: string;
        }>;
        Relationships: [];
      };

      // Preferencias de organización que usa lib/org.ts
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
    };
    Views: {};
    Functions: {};
    Enums: {
      Gender: Gender;
    };
  };
};
