/** Tipos base JSON */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** Enum de género (de la BD) */
export type Gender = "F" | "M" | "O";

/** Esquema mínimo público usado por la app */
export type Database = {
  public: {
    Tables: {
      patients: {
        Row: {
          id: string;
          nombre: string;
          edad: number | null;
          genero: Gender | null;
          user_id: string | null;
          created_at: string;
          updated_at: string | null;
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
        Update: Partial<
          Omit<Database["public"]["Tables"]["patients"]["Row"], "id" | "created_at">
        > & {
          id?: string;
        };
        Relationships: [];
      };

      patient_files: {
        Row: {
          id: string;
          user_id: string;
          patient_id: string;
          storage_key: string;
          file_name: string;
          size: number;
          mime_type: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["patient_files"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["patient_files"]["Row"]>;
        Relationships: [];
      };

      patient_notes: {
        Row: {
          id: string;
          patient_id: string;
          content: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["patient_notes"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["patient_notes"]["Row"]>;
        Relationships: [];
      };

      patient_shares: {
        Row: {
          id: string;
          owner_id: string;
          patient_id: string;
          grantee_email: string;
          can_edit: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["patient_shares"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["patient_shares"]["Row"]>;
        Relationships: [];
      };

      user_org_prefs: {
        Row: {
          user_id: string;
          current_org_id: string;
          updated_at: string;
        };
        Insert: Database["public"]["Tables"]["user_org_prefs"]["Row"];
        Update: Partial<Database["public"]["Tables"]["user_org_prefs"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      gender: Gender;
    };
    CompositeTypes: {};
  };
};
