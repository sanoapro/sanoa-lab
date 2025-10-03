// /workspaces/sanoa-lab/types/database-extended.d.ts
import type { Database as Base } from "@/types/database.types";

type Rows<T> = T extends { Row: infer R } ? R : never;

export type DatabaseExtended = Base & {
  public: Base["public"] & {
    Tables: Base["public"]["Tables"] & {
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
        Update: Partial<Rows<{ Row: DatabaseExtended["public"]["Tables"]["tags"]["Row"] }>>;
        Relationships: [];
      };
      patient_tags: {
        Row: {
          patient_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          patient_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: Partial<Rows<{ Row: DatabaseExtended["public"]["Tables"]["patient_tags"]["Row"] }>>;
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
        Update: Partial<Rows<{ Row: DatabaseExtended["public"]["Tables"]["work_items"]["Row"] }>>;
        Relationships: [];
      };
    };
  };
};
