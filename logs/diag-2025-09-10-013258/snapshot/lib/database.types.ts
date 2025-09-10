export type Gender = "F" | "M" | "O";

export interface Database {
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
        };
        Insert: {
          id?: string;
          nombre: string;
          edad?: number | null;
          genero?: Gender | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["patients"]["Row"], "id">>;
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
        Update: Partial<Omit<Database["public"]["Tables"]["patient_files"]["Row"], "id">>;
        Relationships: [];
      };
      patient_notes: {
        Row: { id: string; patient_id: string; content: string; created_at: string };
        Insert: { id?: string; patient_id: string; content: string; created_at?: string };
        Update: Partial<Omit<Database["public"]["Tables"]["patient_notes"]["Row"], "id">>;
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
        Insert: {
          id?: string;
          owner_id: string;
          patient_id: string;
          grantee_email: string;
          can_edit?: boolean;
          created_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["patient_shares"]["Row"], "id">>;
        Relationships: [];
      };
      user_org_state: {
        Row: { user_id: string; current_org_id: string; updated_at: string };
        Insert: { user_id: string; current_org_id: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["user_org_state"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
