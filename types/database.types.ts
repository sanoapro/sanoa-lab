export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      agenda_alert_log: {
        Row: {
          date_key: string
          id: number
          key: string
          org_id: string
          schedule_id: string
          sent_at: string
        }
        Insert: {
          date_key: string
          id?: never
          key: string
          org_id: string
          schedule_id: string
          sent_at?: string
        }
        Update: {
          date_key?: string
          id?: never
          key?: string
          org_id?: string
          schedule_id?: string
          sent_at?: string
        }
        Relationships: []
      }
      agreements: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          contract_type: string
          created_at: string
          id: string
          org_id: string | null
          subject_id: string | null
          subject_type: string
          version: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          contract_type: string
          created_at?: string
          id?: string
          org_id?: string | null
          subject_id?: string | null
          subject_type: string
          version?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          contract_type?: string
          created_at?: string
          id?: string
          org_id?: string | null
          subject_id?: string | null
          subject_type?: string
          version?: string
        }
        Relationships: []
      }
      agreements_acceptances: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          accepted_role: Database["public"]["Enums"]["agreement_role"] | null
          contract_type: Database["public"]["Enums"]["agreement_type"]
          created_at: string
          created_by: string | null
          id: string
          ip_addr: string | null
          name_snapshot: Json | null
          org_id: string
          patient_id: string | null
          specialist_id: string | null
          status: Database["public"]["Enums"]["agreement_status"]
          template_id: string
          template_version: number
          token: string | null
          token_expires_at: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          accepted_role?: Database["public"]["Enums"]["agreement_role"] | null
          contract_type: Database["public"]["Enums"]["agreement_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          ip_addr?: string | null
          name_snapshot?: Json | null
          org_id: string
          patient_id?: string | null
          specialist_id?: string | null
          status?: Database["public"]["Enums"]["agreement_status"]
          template_id: string
          template_version: number
          token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          accepted_role?: Database["public"]["Enums"]["agreement_role"] | null
          contract_type?: Database["public"]["Enums"]["agreement_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          ip_addr?: string | null
          name_snapshot?: Json | null
          org_id?: string
          patient_id?: string | null
          specialist_id?: string | null
          status?: Database["public"]["Enums"]["agreement_status"]
          template_id?: string
          template_version?: number
          token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agreements_acceptances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agreements_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      agreements_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean
          locale: string
          title: string
          type: Database["public"]["Enums"]["agreement_type"]
          version: number
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_active?: boolean
          locale?: string
          title: string
          type: Database["public"]["Enums"]["agreement_type"]
          version?: number
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          locale?: string
          title?: string
          type?: Database["public"]["Enums"]["agreement_type"]
          version?: number
        }
        Relationships: []
      }
      appointments: {
        Row: {
          cal_event_id: string | null
          created_at: string
          end_at: string | null
          id: string
          location: string | null
          notes: string | null
          org_id: string
          patient_id: string
          provider_id: string | null
          start_at: string
          title: string | null
        }
        Insert: {
          cal_event_id?: string | null
          created_at?: string
          end_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          org_id: string
          patient_id: string
          provider_id?: string | null
          start_at: string
          title?: string | null
        }
        Update: {
          cal_event_id?: string | null
          created_at?: string
          end_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          org_id?: string
          patient_id?: string
          provider_id?: string | null
          start_at?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_my_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients_export"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments_events: {
        Row: {
          address: string | null
          appointment_id: string | null
          channel: string | null
          created_at: string
          event: string
          id: number
          meta: Json | null
          org_id: string | null
        }
        Insert: {
          address?: string | null
          appointment_id?: string | null
          channel?: string | null
          created_at?: string
          event: string
          id?: number
          meta?: Json | null
          org_id?: string | null
        }
        Update: {
          address?: string | null
          appointment_id?: string | null
          channel?: string | null
          created_at?: string
          event?: string
          id?: number
          meta?: Json | null
          org_id?: string | null
        }
        Relationships: []
      }
      audit_entries: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: number
          payload: Json | null
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: number
          payload?: Json | null
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: number
          payload?: Json | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor: string | null
          actor_email: string | null
          actor_id: string | null
          at: string
          created_at: string
          data: Json | null
          entity: string
          entity_id: string
          id: string
          new_data: Json | null
          old_data: Json | null
          org_id: string | null
          patient_id: string
          row_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor?: string | null
          actor_email?: string | null
          actor_id?: string | null
          at?: string
          created_at?: string
          data?: Json | null
          entity: string
          entity_id: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          org_id?: string | null
          patient_id: string
          row_id?: string | null
          table_name?: string
        }
        Update: {
          action?: string
          actor?: string | null
          actor_email?: string | null
          actor_id?: string | null
          at?: string
          created_at?: string
          data?: Json | null
          entity?: string
          entity_id?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          org_id?: string | null
          patient_id?: string
          row_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          created_at: string
          currency: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          type: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          type: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          type?: string
        }
        Relationships: []
      }
      bank_budgets: {
        Row: {
          amount_cents: number
          category_id: string
          created_at: string
          id: string
          month: string
          org_id: string
        }
        Insert: {
          amount_cents: number
          category_id: string
          created_at?: string
          id?: string
          month: string
          org_id: string
        }
        Update: {
          amount_cents?: number
          category_id?: string
          created_at?: string
          id?: string
          month?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "bank_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_categories: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          org_id: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          name: string
          org_id: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          org_id?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "bank_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_rules: {
        Row: {
          created_at: string
          id: string
          if_text_like: string
          org_id: string
          priority: number
          set_category_id: string | null
          set_tags: string[] | null
        }
        Insert: {
          created_at?: string
          id?: string
          if_text_like: string
          org_id: string
          priority?: number
          set_category_id?: string | null
          set_tags?: string[] | null
        }
        Update: {
          created_at?: string
          id?: string
          if_text_like?: string
          org_id?: string
          priority?: number
          set_category_id?: string | null
          set_tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_rules_set_category_id_fkey"
            columns: ["set_category_id"]
            isOneToOne: false
            referencedRelation: "bank_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_tx: {
        Row: {
          account_id: string
          amount_cents: number
          category_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          date: string
          id: string
          memo: string | null
          method: string | null
          org_id: string
          reconciled_at: string | null
          status: string
          tags: string[] | null
        }
        Insert: {
          account_id: string
          amount_cents: number
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          date: string
          id?: string
          memo?: string | null
          method?: string | null
          org_id: string
          reconciled_at?: string | null
          status?: string
          tags?: string[] | null
        }
        Update: {
          account_id?: string
          amount_cents?: number
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          date?: string
          id?: string
          memo?: string | null
          method?: string | null
          org_id?: string
          reconciled_at?: string | null
          status?: string
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_tx_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_tx_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "bank_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cal_bookings_raw: {
        Row: {
          attendee_email: string | null
          attendee_name: string | null
          cal_uid: string
          end: string | null
          inserted_at: string
          payload: Json
          start: string | null
          status: string | null
          trigger_event: string
          updated_at: string
        }
        Insert: {
          attendee_email?: string | null
          attendee_name?: string | null
          cal_uid: string
          end?: string | null
          inserted_at?: string
          payload: Json
          start?: string | null
          status?: string | null
          trigger_event: string
          updated_at?: string
        }
        Update: {
          attendee_email?: string | null
          attendee_name?: string | null
          cal_uid?: string
          end?: string | null
          inserted_at?: string
          payload?: Json
          start?: string | null
          status?: string | null
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      cal_webhooks: {
        Row: {
          created_at: string
          id: string
          org_id: string | null
          raw: Json
        }
        Insert: {
          created_at?: string
          id: string
          org_id?: string | null
          raw: Json
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string | null
          raw?: Json
        }
        Relationships: []
      }
      concept_dictionary: {
        Row: {
          canonical: string
          canonical_norm: string
          created_at: string
          id: string
        }
        Insert: {
          canonical: string
          canonical_norm: string
          created_at?: string
          id?: string
        }
        Update: {
          canonical?: string
          canonical_norm?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          address: string
          channel: string
          consent: boolean
          created_at: string
          created_by: string | null
          id: string
          label: string | null
          org_id: string | null
          patient_id: string | null
          updated_at: string
        }
        Insert: {
          address: string
          channel: string
          consent?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          org_id?: string | null
          patient_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          channel?: string
          consent?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          org_id?: string | null
          patient_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dental_budget_items: {
        Row: {
          budget_id: string
          description: string
          id: string
          line_total: number
          qty: number
          unit_price: number
        }
        Insert: {
          budget_id: string
          description: string
          id?: string
          line_total?: number
          qty?: number
          unit_price?: number
        }
        Update: {
          budget_id?: string
          description?: string
          id?: string
          line_total?: number
          qty?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "dental_budget_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "dental_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_budgets: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          org_id: string | null
          patient_id: string
          title: string | null
          total: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string | null
          patient_id: string
          title?: string | null
          total?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string | null
          patient_id?: string
          title?: string | null
          total?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      dental_charts: {
        Row: {
          chart: Json
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          patient_id: string
          updated_at: string
        }
        Insert: {
          chart: Json
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          patient_id: string
          updated_at?: string
        }
        Update: {
          chart?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          patient_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      discharge_templates: {
        Row: {
          body: Json
          created_at: string
          doctor_id: string | null
          id: string
          name: string
          org_id: string
        }
        Insert: {
          body?: Json
          created_at?: string
          doctor_id?: string | null
          id?: string
          name: string
          org_id: string
        }
        Update: {
          body?: Json
          created_at?: string
          doctor_id?: string | null
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: []
      }
      discharges: {
        Row: {
          admission_at: string | null
          created_at: string
          diagnosis: string | null
          discharge_at: string | null
          doctor_id: string
          follow_up_at: string | null
          id: string
          org_id: string
          patient_id: string
          recommendations: string | null
          summary: string | null
        }
        Insert: {
          admission_at?: string | null
          created_at?: string
          diagnosis?: string | null
          discharge_at?: string | null
          doctor_id: string
          follow_up_at?: string | null
          id?: string
          org_id: string
          patient_id: string
          recommendations?: string | null
          summary?: string | null
        }
        Update: {
          admission_at?: string | null
          created_at?: string
          diagnosis?: string | null
          discharge_at?: string | null
          doctor_id?: string
          follow_up_at?: string | null
          id?: string
          org_id?: string
          patient_id?: string
          recommendations?: string | null
          summary?: string | null
        }
        Relationships: []
      }
      doc_folios: {
        Row: {
          doc_type: string
          last_number: number
          org_id: string
          year_month: string
        }
        Insert: {
          doc_type: string
          last_number?: number
          org_id: string
          year_month: string
        }
        Update: {
          doc_type?: string
          last_number?: number
          org_id?: string
          year_month?: string
        }
        Relationships: []
      }
      doctor_letterheads: {
        Row: {
          clinic_info: string | null
          created_at: string
          credentials: string | null
          display_name: string
          doctor_id: string
          footer_disclaimer: string | null
          id: string
          logo_url: string | null
          org_id: string
          signature_url: string | null
        }
        Insert: {
          clinic_info?: string | null
          created_at?: string
          credentials?: string | null
          display_name: string
          doctor_id: string
          footer_disclaimer?: string | null
          id?: string
          logo_url?: string | null
          org_id: string
          signature_url?: string | null
        }
        Update: {
          clinic_info?: string | null
          created_at?: string
          credentials?: string | null
          display_name?: string
          doctor_id?: string
          footer_disclaimer?: string | null
          id?: string
          logo_url?: string | null
          org_id?: string
          signature_url?: string | null
        }
        Relationships: []
      }
      document_ledger: {
        Row: {
          created_at: string
          doc_id: string
          doc_type: string
          folio: string | null
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          verify_code: string | null
        }
        Insert: {
          created_at?: string
          doc_id: string
          doc_type: string
          folio?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          verify_code?: string | null
        }
        Update: {
          created_at?: string
          doc_id?: string
          doc_type?: string
          folio?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          verify_code?: string | null
        }
        Relationships: []
      }
      drug_condition_alerts: {
        Row: {
          condition_concept_id: string
          created_at: string
          id: string
          ingredient_id: string
          note: string | null
          severity: string
        }
        Insert: {
          condition_concept_id: string
          created_at?: string
          id?: string
          ingredient_id: string
          note?: string | null
          severity: string
        }
        Update: {
          condition_concept_id?: string
          created_at?: string
          id?: string
          ingredient_id?: string
          note?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "drug_condition_alerts_condition_concept_id_fkey"
            columns: ["condition_concept_id"]
            isOneToOne: false
            referencedRelation: "concept_dictionary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_condition_alerts_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "drug_dictionary"
            referencedColumns: ["id"]
          },
        ]
      }
      drug_dictionary: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          name_norm: string
          synonyms: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          name: string
          name_norm: string
          synonyms?: string[]
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          name_norm?: string
          synonyms?: string[]
        }
        Relationships: []
      }
      drug_interactions: {
        Row: {
          a_ingredient: string
          b_ingredient: string
          created_at: string
          id: string
          note: string | null
          severity: string
        }
        Insert: {
          a_ingredient: string
          b_ingredient: string
          created_at?: string
          id?: string
          note?: string | null
          severity: string
        }
        Update: {
          a_ingredient?: string
          b_ingredient?: string
          created_at?: string
          id?: string
          note?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "drug_interactions_a_ingredient_fkey"
            columns: ["a_ingredient"]
            isOneToOne: false
            referencedRelation: "drug_dictionary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_interactions_b_ingredient_fkey"
            columns: ["b_ingredient"]
            isOneToOne: false
            referencedRelation: "drug_dictionary"
            referencedColumns: ["id"]
          },
        ]
      }
      equilibrio_checkins: {
        Row: {
          created_at: string
          created_by: string | null
          day: string
          id: string
          item_id: string
          note: string | null
          org_id: string
          patient_id: string
          plan_id: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          day: string
          id?: string
          item_id: string
          note?: string | null
          org_id: string
          patient_id: string
          plan_id: string
          status: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          day?: string
          id?: string
          item_id?: string
          note?: string | null
          org_id?: string
          patient_id?: string
          plan_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "equilibrio_checkins_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "equilibrio_plan_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equilibrio_checkins_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "equilibrio_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      equilibrio_plan_items: {
        Row: {
          created_at: string
          fri: boolean
          goal: string | null
          id: string
          library_id: string
          mon: boolean
          notes: string | null
          plan_id: string
          sat: boolean
          sun: boolean
          thu: boolean
          tue: boolean
          wed: boolean
        }
        Insert: {
          created_at?: string
          fri?: boolean
          goal?: string | null
          id?: string
          library_id: string
          mon?: boolean
          notes?: string | null
          plan_id: string
          sat?: boolean
          sun?: boolean
          thu?: boolean
          tue?: boolean
          wed?: boolean
        }
        Update: {
          created_at?: string
          fri?: boolean
          goal?: string | null
          id?: string
          library_id?: string
          mon?: boolean
          notes?: string | null
          plan_id?: string
          sat?: boolean
          sun?: boolean
          thu?: boolean
          tue?: boolean
          wed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "equilibrio_plan_items_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "equilibrio_task_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equilibrio_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "equilibrio_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      equilibrio_plans: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          org_id: string
          patient_id: string
          starts_on: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          org_id: string
          patient_id: string
          starts_on: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          org_id?: string
          patient_id?: string
          starts_on?: string
          updated_at?: string
        }
        Relationships: []
      }
      equilibrio_task_library: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          default_goal: string | null
          description: string | null
          id: string
          kind: string
          module: string
          org_id: string
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          default_goal?: string | null
          description?: string | null
          id?: string
          kind?: string
          module?: string
          org_id: string
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          default_goal?: string | null
          description?: string | null
          id?: string
          kind?: string
          module?: string
          org_id?: string
          title?: string
        }
        Relationships: []
      }
      exercise_plans: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          org_id: string | null
          patient_id: string
          plan: Json
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string | null
          patient_id: string
          plan?: Json
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string | null
          patient_id?: string
          plan?: Json
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      export_templates: {
        Row: {
          brand_hex: string | null
          cover_subtitle: string | null
          cover_title: string
          created_at: string
          id: string
          logo_url: string | null
          name: string
          org_id: string | null
          owner_id: string
        }
        Insert: {
          brand_hex?: string | null
          cover_subtitle?: string | null
          cover_title: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          org_id?: string | null
          owner_id: string
        }
        Update: {
          brand_hex?: string | null
          cover_subtitle?: string | null
          cover_title?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          org_id?: string | null
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "export_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_my_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          description: string | null
          id: string
          module_id: string
          name: string
        }
        Insert: {
          description?: string | null
          id: string
          module_id: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          module_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "features_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      file_embeddings: {
        Row: {
          content: string | null
          created_at: string
          dim: number | null
          embedding: string | null
          id: string
          model: string | null
          name: string
          org_id: string
          path: string
          patient_id: string
          provider: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          dim?: number | null
          embedding?: string | null
          id?: string
          model?: string | null
          name: string
          org_id: string
          path: string
          patient_id: string
          provider?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          dim?: number | null
          embedding?: string | null
          id?: string
          model?: string | null
          name?: string
          org_id?: string
          path?: string
          patient_id?: string
          provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_embeddings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_embeddings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_my_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_embeddings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_embeddings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_embeddings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients_export"
            referencedColumns: ["id"]
          },
        ]
      }
      form_responses: {
        Row: {
          answers: Json
          created_at: string
          id: string
          org_id: string | null
          patient_id: string
          submitted_by: string
          template_id: string
        }
        Insert: {
          answers: Json
          created_at?: string
          id?: string
          org_id?: string | null
          patient_id: string
          submitted_by: string
          template_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          org_id?: string | null
          patient_id?: string
          submitted_by?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_responses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients_export"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          schema: Json
          specialty: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          schema: Json
          specialty: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          schema?: Json
          specialty?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "form_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_my_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      jotform_webhooks: {
        Row: {
          created_at: string
          id: string
          org_id: string | null
          raw: Json
        }
        Insert: {
          created_at?: string
          id: string
          org_id?: string | null
          raw: Json
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string | null
          raw?: Json
        }
        Relationships: []
      }
      lab_request_items: {
        Row: {
          id: string
          notes: string | null
          request_id: string
          test_code: string | null
          test_name: string
        }
        Insert: {
          id?: string
          notes?: string | null
          request_id: string
          test_code?: string | null
          test_name: string
        }
        Update: {
          id?: string
          notes?: string | null
          request_id?: string
          test_code?: string | null
          test_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "lab_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_requests: {
        Row: {
          created_at: string
          due_at: string | null
          id: string
          instructions: string | null
          org_id: string
          patient_id: string
          requested_by: string
          status: Database["public"]["Enums"]["lab_status"]
          title: string
        }
        Insert: {
          created_at?: string
          due_at?: string | null
          id?: string
          instructions?: string | null
          org_id: string
          patient_id: string
          requested_by: string
          status?: Database["public"]["Enums"]["lab_status"]
          title: string
        }
        Update: {
          created_at?: string
          due_at?: string | null
          id?: string
          instructions?: string | null
          org_id?: string
          patient_id?: string
          requested_by?: string
          status?: Database["public"]["Enums"]["lab_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_my_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients_export"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_results: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          notes: string | null
          parsed: Json | null
          patient_id: string
          request_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          size_bytes: number | null
          uploaded_by_user_id: string | null
          uploaded_via_token: boolean
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          parsed?: Json | null
          patient_id: string
          request_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_bytes?: number | null
          uploaded_by_user_id?: string | null
          uploaded_via_token?: boolean
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          parsed?: Json | null
          patient_id?: string
          request_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_bytes?: number | null
          uploaded_by_user_id?: string | null
          uploaded_via_token?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients_export"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "lab_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_test_templates: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          items: Json
          name: string
          notes: string | null
          org_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          items?: Json
          name: string
          notes?: string | null
          org_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          items?: Json
          name?: string
          notes?: string | null
          org_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lab_upload_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          request_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          request_id: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          request_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_upload_tokens_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "lab_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      mente_assessments: {
        Row: {
          answers_json: Json
          created_at: string
          created_by: string
          id: string
          issued_at: string | null
          org_id: string
          patient_id: string
          risk_band: string
          score_breakdown: Json
          score_total: number
          tool: string
        }
        Insert: {
          answers_json: Json
          created_at?: string
          created_by: string
          id?: string
          issued_at?: string | null
          org_id: string
          patient_id: string
          risk_band: string
          score_breakdown: Json
          score_total: number
          tool: string
        }
        Update: {
          answers_json?: Json
          created_at?: string
          created_by?: string
          id?: string
          issued_at?: string | null
          org_id?: string
          patient_id?: string
          risk_band?: string
          score_breakdown?: Json
          score_total?: number
          tool?: string
        }
        Relationships: []
      }
      mente_sessions: {
        Row: {
          created_at: string
          created_by: string
          id: string
          note_json: Json
          org_id: string
          patient_id: string
          signed_at: string | null
          signed_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          note_json: Json
          org_id: string
          patient_id: string
          signed_at?: string | null
          signed_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          note_json?: Json
          org_id?: string
          patient_id?: string
          signed_at?: string | null
          signed_by?: string | null
        }
        Relationships: []
      }
      modules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          route: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          name: string
          route?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          route?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      note_embeddings: {
        Row: {
          content: string
          created_at: string
          dim: number | null
          embedding: string | null
          id: string
          model: string | null
          note_id: string
          org_id: string
          patient_id: string
          provider: string | null
        }
        Insert: {
          content: string
          created_at?: string
          dim?: number | null
          embedding?: string | null
          id?: string
          model?: string | null
          note_id: string
          org_id: string
          patient_id: string
          provider?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          dim?: number | null
          embedding?: string | null
          id?: string
          model?: string | null
          note_id?: string
          org_id?: string
          patient_id?: string
          provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_embeddings_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: true
            referencedRelation: "patient_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_embeddings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_embeddings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_my_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_embeddings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_embeddings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_embeddings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients_export"
            referencedColumns: ["id"]
          },
        ]
      }
      note_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          name: string
          org_id: string | null
          owner_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          name: string
          org_id?: string | null
          owner_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          name?: string
          org_id?: string | null
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_my_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      notify_inbound: {
        Row: {
          body: string | null
          created_at: string
          from: string | null
          id: number
          message_sid: string | null
          provider: string
          to: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          from?: string | null
          id?: never
          message_sid?: string | null
          provider: string
          to?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          from?: string | null
          id?: never
          message_sid?: string | null
          provider?: string
          to?: string | null
        }
        Relationships: []
      }
      notify_status: {
        Row: {
          created_at: string
          error_code: string | null
          id: number
          message_sid: string | null
          provider: string
          status: string | null
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          id?: never
          message_sid?: string | null
          provider: string
          status?: string | null
        }
        Update: {
          created_at?: string
          error_code?: string | null
          id?: never
          message_sid?: string | null
          provider?: string
          status?: string | null
        }
        Relationships: []
      }
      org_bank_settings: {
        Row: {
          low_balance_threshold_cents: number
          notify_channel: string | null
          notify_to: string | null
          org_id: string
          updated_at: string
        }
        Insert: {
          low_balance_threshold_cents?: number
          notify_channel?: string | null
          notify_to?: string | null
          org_id: string
          updated_at?: string
        }
        Update: {
          low_balance_threshold_cents?: number
          notify_channel?: string | null
          notify_to?: string | null
          org_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      org_disclaimers: {
        Row: {
          kind: string
          org_id: string
          text: string
        }
        Insert: {
          kind: string
          org_id: string
          text: string
        }
        Update: {
          kind?: string
          org_id?: string
          text?: string
        }
        Relationships: []
      }
      org_features: {
        Row: {
          created_at: string
          equilibrio: boolean
          feature_id: string
          mente: boolean
          org_id: string
          pulso: boolean
          sonrisa: boolean
          source: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          equilibrio?: boolean
          feature_id: string
          mente?: boolean
          org_id: string
          pulso?: boolean
          sonrisa?: boolean
          source?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          equilibrio?: boolean
          feature_id?: string
          mente?: boolean
          org_id?: string
          pulso?: boolean
          sonrisa?: boolean
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_features_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_features_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_features_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_my_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_invoices: {
        Row: {
          amount_due_cents: number | null
          created_at: string
          currency: string | null
          hosted_invoice_url: string | null
          id: string
          invoice_pdf: string | null
          org_id: string
          period_end: string | null
          period_start: string | null
          status: string | null
          stripe_invoice_id: string | null
        }
        Insert: {
          amount_due_cents?: number | null
          created_at?: string
          currency?: string | null
          hosted_invoice_url?: string | null
          id?: string
          invoice_pdf?: string | null
          org_id: string
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stripe_invoice_id?: string | null
        }
        Update: {
          amount_due_cents?: number | null
          created_at?: string
          currency?: string | null
          hosted_invoice_url?: string | null
          id?: string
          invoice_pdf?: string | null
          org_id?: string
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stripe_invoice_id?: string | null
        }
        Relationships: []
      }
      org_ledger_transactions: {
        Row: {
          amount_cents: number
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          id: string
          meta: Json | null
          org_id: string
          stripe_charge_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          type: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          meta?: Json | null
          org_id: string
          stripe_charge_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          type: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          meta?: Json | null
          org_id?: string
          stripe_charge_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          type?: string
        }
        Relationships: []
      }
      org_members: {
        Row: {
          created_at: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          org_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_my_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          org_id: string
          stripe_customer_id: string | null
          stripe_status: string | null
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          org_id: string
          stripe_customer_id?: string | null
          stripe_status?: string | null
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          org_id?: string
          stripe_customer_id?: string | null
          stripe_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "v_my_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          org_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_my_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_personal: boolean
          name: string
          owner_user_id: string | null
          slug: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_personal?: boolean
          name: string
          owner_user_id?: string | null
          slug?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_personal?: boolean
          name?: string
          owner_user_id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      patient_appointments: {
        Row: {
          cal_uid: string
          created_at: string
          end: string
          id: string
          last_webhook_at: string | null
          meeting_url: string | null
          metadata: Json | null
          patient_id: string
          start: string
          status: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          cal_uid: string
          created_at?: string
          end: string
          id?: string
          last_webhook_at?: string | null
          meeting_url?: string | null
          metadata?: Json | null
          patient_id: string
          start: string
          status?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          cal_uid?: string
          created_at?: string
          end?: string
          id?: string
          last_webhook_at?: string | null
          meeting_url?: string | null
          metadata?: Json | null
          patient_id?: string
          start?: string
          status?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients_export"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_conditions: {
        Row: {
          concept_id: string
          created_at: string
          id: string
          patient_id: string
        }
        Insert: {
          concept_id: string
          created_at?: string
          id?: string
          patient_id: string
        }
        Update: {
          concept_id?: string
          created_at?: string
          id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_conditions_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concept_dictionary"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_file_access_log: {
        Row: {
          action: string
          by_user: string | null
          created_at: string
          id: string
          ip: string | null
          path: string
          patient_id: string
          user_agent: string | null
        }
        Insert: {
          action: string
          by_user?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          path: string
          patient_id: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          by_user?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          path?: string
          patient_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_file_access_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_file_access_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_file_access_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients_export"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_file_versions: {
        Row: {
          checksum_sha256: string | null
          created_at: string
          group_key: string
          id: string
          name: string
          path: string
          patient_id: string
          size_bytes: number
          uploaded_by: string | null
          version: number
        }
        Insert: {
          checksum_sha256?: string | null
          created_at?: string
          group_key: string
          id?: string
          name: string
          path: string
          patient_id: string
          size_bytes?: number
          uploaded_by?: string | null
          version: number
        }
        Update: {
          checksum_sha256?: string | null
          created_at?: string
          group_key?: string
          id?: string
          name?: string
          path?: string
          patient_id?: string
          size_bytes?: number
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "patient_file_versions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_file_versions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_file_versions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients_export"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_files: {
        Row: {
          bucket: string
          created_at: string
          file_name: string
          id: string
          mime_type: string | null
          org_id: string | null
          path: string
          patient_id: string
          size: number | null
          user_id: string
        }
        Insert: {
          bucket?: string
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          org_id?: string | null
          path: string
          patient_id: string
          size?: number | null
          user_id: string
        }
        Update: {
          bucket?: string
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          org_id?: string | null
          path?: string
          patient_id?: string
          size?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_files_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_files_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_files_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients_export"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_labels: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          label: string
          org_id: string
          patient_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          label: string
          org_id: string
          patient_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          org_id?: string
          patient_id?: string
        }
        Relationships: []
      }
      patient_medications: {
        Row: {
          created_at: string
          id: string
          name: string
          patient_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          patient_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          patient_id?: string
        }
        Relationships: []
      }
      patient_note_versions: {
        Row: {
          action: string
          after_contenido: string | null
          after_titulo: string | null
          before_contenido: string | null
          before_titulo: string | null
          created_at: string
          edited_by: string | null
          id: string
          note_id: string
          patient_id: string
          reason: string | null
        }
        Insert: {
          action: string
          after_contenido?: string | null
          after_titulo?: string | null
          before_contenido?: string | null
          before_titulo?: string | null
          created_at?: string
          edited_by?: string | null
          id?: string
          note_id: string
          patient_id: string
          reason?: string | null
        }
        Update: {
          action?: string
          after_contenido?: string | null
          after_titulo?: string | null
          before_contenido?: string | null
          before_titulo?: string | null
          created_at?: string
          edited_by?: string | null
          id?: string
          note_id?: string
          patient_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_note_versions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "patient_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_note_versions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_note_versions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_note_versions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients_export"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_notes: {
        Row: {
          contenido: string | null
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          org_id: string | null
          patient_id: string
          search: unknown | null
          titulo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contenido?: string | null
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          org_id?: string | null
          patient_id: string
          search?: unknown | null
          titulo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contenido?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          org_id?: string | null
          patient_id?: string
          search?: unknown | null
          titulo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients_export"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_notes_audit: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          diff: Json | null
          id: number
          note_id: string
          reason: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          diff?: Json | null
          id?: number
          note_id: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          diff?: Json | null
          id?: number
          note_id?: string
          reason?: string | null
        }
        Relationships: []
      }
      patient_panels: {
        Row: {
          active: boolean
          created_at: string
          org_id: string
          patient_id: string
          provider_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          org_id: string
          patient_id: string
          provider_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          org_id?: string
          patient_id?: string
          provider_id?: string
        }
        Relationships: []
      }
      patient_permissions: {
        Row: {
          can_edit_notes: boolean
          can_manage_files: boolean
          can_read: boolean
          can_share: boolean
          created_at: string
          created_by: string | null
          id: string
          patient_id: string
          user_id: string
        }
        Insert: {
          can_edit_notes?: boolean
          can_manage_files?: boolean
          can_read?: boolean
          can_share?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id: string
          user_id: string
        }
        Update: {
          can_edit_notes?: boolean
          can_manage_files?: boolean
          can_read?: boolean
          can_share?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_permissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_permissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_permissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients_export"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_providers: {
        Row: {
          created_at: string
          org_id: string
          patient_id: string
          provider_id: string
        }
        Insert: {
          created_at?: string
          org_id: string
          patient_id: string
          provider_id: string
        }
        Update: {
          created_at?: string
          org_id?: string
          patient_id?: string
          provider_id?: string
        }
        Relationships: []
      }
      patient_share_access: {
        Row: {
          at: string
          id: number
          ip: string | null
          share_id: string
          user_agent: string | null
        }
        Insert: {
          at?: string
          id?: never
          ip?: string | null
          share_id: string
          user_agent?: string | null
        }
        Update: {
          at?: string
          id?: never
          ip?: string | null
          share_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_share_access_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "patient_shares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_share_access_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "v_patient_share_access"
            referencedColumns: ["share_id"]
          },
        ]
      }
      patient_shares: {
        Row: {
          can_edit: boolean
          created_at: string
          grantee_email: string | null
          id: string
          org_id: string | null
          owner_id: string
          patient_id: string
          permission: Database["public"]["Enums"]["permission_level"]
          revoked_at: string | null
          shared_with_email: string | null
          shared_with_user_id: string | null
        }
        Insert: {
          can_edit?: boolean
          created_at?: string
          grantee_email?: string | null
          id?: string
          org_id?: string | null
          owner_id: string
          patient_id: string
          permission?: Database["public"]["Enums"]["permission_level"]
          revoked_at?: string | null
          shared_with_email?: string | null
          shared_with_user_id?: string | null
        }
        Update: {
          can_edit?: boolean
          created_at?: string
          grantee_email?: string | null
          id?: string
          org_id?: string | null
          owner_id?: string
          patient_id?: string
          permission?: Database["public"]["Enums"]["permission_level"]
          revoked_at?: string | null
          shared_with_email?: string | null
          shared_with_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_shares_patient_fk"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_shares_patient_fk"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_shares_patient_fk"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients_export"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_shares_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_shares_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_shares_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients_export"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_tags: {
        Row: {
          created_at: string
          patient_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          patient_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          patient_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_tags_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_tags_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_tags_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients_export"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_task_templates: {
        Row: {
          content: Json
          created_at: string
          created_by: string
          id: string
          module: string
          org_id: string
          title: string
        }
        Insert: {
          content?: Json
          created_at?: string
          created_by: string
          id?: string
          module: string
          org_id: string
          title: string
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string
          id?: string
          module?: string
          org_id?: string
          title?: string
        }
        Relationships: []
      }
      patient_tasks: {
        Row: {
          assigned_by: string
          content: Json
          created_at: string
          due_date: string | null
          id: string
          module: string
          org_id: string
          patient_id: string
          status: string
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          content?: Json
          created_at?: string
          due_date?: string | null
          id?: string
          module: string
          org_id: string
          patient_id: string
          status?: string
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          content?: Json
          created_at?: string
          due_date?: string | null
          id?: string
          module?: string
          org_id?: string
          patient_id?: string
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "patient_task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          birthdate: string | null
          created_at: string
          deleted_at: string | null
          edad: number | null
          email: string | null
          full_name: string
          genero: string | null
          id: string
          nombre: string | null
          org_id: string | null
          phone: string | null
          photo_url: string | null
          search: unknown | null
          sex: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birthdate?: string | null
          created_at?: string
          deleted_at?: string | null
          edad?: number | null
          email?: string | null
          full_name: string
          genero?: string | null
          id?: string
          nombre?: string | null
          org_id?: string | null
          phone?: string | null
          photo_url?: string | null
          search?: unknown | null
          sex?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birthdate?: string | null
          created_at?: string
          deleted_at?: string | null
          edad?: number | null
          email?: string | null
          full_name?: string
          genero?: string | null
          id?: string
          nombre?: string | null
          org_id?: string | null
          phone?: string | null
          photo_url?: string | null
          search?: unknown | null
          sex?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prescription_items: {
        Row: {
          dose: string | null
          drug: string
          duration: string | null
          frequency: string | null
          id: string
          instructions: string | null
          prescription_id: string
          route: string | null
        }
        Insert: {
          dose?: string | null
          drug: string
          duration?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          prescription_id: string
          route?: string | null
        }
        Update: {
          dose?: string | null
          drug?: string
          duration?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          prescription_id?: string
          route?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_templates: {
        Row: {
          active: boolean
          created_at: string
          doctor_id: string | null
          id: string
          items: Json
          name: string
          org_id: string
          specialty: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          doctor_id?: string | null
          id?: string
          items?: Json
          name: string
          org_id: string
          specialty?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          doctor_id?: string | null
          id?: string
          items?: Json
          name?: string
          org_id?: string
          specialty?: string | null
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          created_at: string
          diagnosis: string | null
          doctor_id: string
          id: string
          issued_at: string
          notes: string | null
          org_id: string
          patient_id: string
          signature_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          diagnosis?: string | null
          doctor_id: string
          id?: string
          issued_at?: string
          notes?: string | null
          org_id: string
          patient_id: string
          signature_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string
          id?: string
          issued_at?: string
          notes?: string | null
          org_id?: string
          patient_id?: string
          signature_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pulso_measurements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          measured_at: string | null
          note: string | null
          org_id: string
          patient_id: string
          type: string
          unit: string | null
          value: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          measured_at?: string | null
          note?: string | null
          org_id: string
          patient_id: string
          type: string
          unit?: string | null
          value: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          measured_at?: string | null
          note?: string | null
          org_id?: string
          patient_id?: string
          type?: string
          unit?: string | null
          value?: number
        }
        Relationships: []
      }
      pulso_targets: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          org_id: string
          patient_id: string
          target_high: number | null
          target_low: number | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          org_id: string
          patient_id: string
          target_high?: number | null
          target_low?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string
          patient_id?: string
          target_high?: number | null
          target_low?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      referral_templates: {
        Row: {
          body: Json
          created_at: string
          doctor_id: string | null
          id: string
          name: string
          org_id: string
          specialty: string | null
        }
        Insert: {
          body?: Json
          created_at?: string
          doctor_id?: string | null
          id?: string
          name: string
          org_id: string
          specialty?: string | null
        }
        Update: {
          body?: Json
          created_at?: string
          doctor_id?: string | null
          id?: string
          name?: string
          org_id?: string
          specialty?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          org_id: string
          patient_id: string
          plan: string | null
          reason: string | null
          summary: string | null
          to_doctor_name: string | null
          to_specialty: string | null
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          org_id: string
          patient_id: string
          plan?: string | null
          reason?: string | null
          summary?: string | null
          to_doctor_name?: string | null
          to_specialty?: string | null
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          org_id?: string
          patient_id?: string
          plan?: string | null
          reason?: string | null
          summary?: string | null
          to_doctor_name?: string | null
          to_specialty?: string | null
        }
        Relationships: []
      }
      rehab_sessions: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          id: string
          patient_id: string
          soap: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          patient_id: string
          soap: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          patient_id?: string
          soap?: Json
          updated_at?: string
        }
        Relationships: []
      }
      reminder_logs: {
        Row: {
          created_at: string
          error: string | null
          external_id: string | null
          id: number
          meta: Json | null
          org_id: string | null
          payload: Json | null
          provider: string
          provider_sid: string | null
          reminder_id: string
          status: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          external_id?: string | null
          id?: number
          meta?: Json | null
          org_id?: string | null
          payload?: Json | null
          provider?: string
          provider_sid?: string | null
          reminder_id: string
          status: string
        }
        Update: {
          created_at?: string
          error?: string | null
          external_id?: string | null
          id?: number
          meta?: Json | null
          org_id?: string | null
          payload?: Json | null
          provider?: string
          provider_sid?: string | null
          reminder_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_logs_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_prefs: {
        Row: {
          channels_priority: string[]
          days_of_week: number[]
          max_retries: number
          org_id: string
          provider_id: string
          retry_backoff_min: number
          tz: string
          updated_at: string
          window_end: string
          window_start: string
        }
        Insert: {
          channels_priority?: string[]
          days_of_week?: number[]
          max_retries?: number
          org_id: string
          provider_id: string
          retry_backoff_min?: number
          tz?: string
          updated_at?: string
          window_end?: string
          window_start?: string
        }
        Update: {
          channels_priority?: string[]
          days_of_week?: number[]
          max_retries?: number
          org_id?: string
          provider_id?: string
          retry_backoff_min?: number
          tz?: string
          updated_at?: string
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      reminder_queue: {
        Row: {
          assignment_id: string | null
          attempt_count: number
          channel: string
          created_at: string
          id: string
          last_error: string | null
          next_attempt_at: string | null
          org_id: string
          patient_id: string
          payload: Json
          provider_id: string
          sent_at: string | null
          status: string
          template_slug: string
        }
        Insert: {
          assignment_id?: string | null
          attempt_count?: number
          channel: string
          created_at?: string
          id?: string
          last_error?: string | null
          next_attempt_at?: string | null
          org_id: string
          patient_id: string
          payload?: Json
          provider_id: string
          sent_at?: string | null
          status?: string
          template_slug: string
        }
        Update: {
          assignment_id?: string | null
          attempt_count?: number
          channel?: string
          created_at?: string
          id?: string
          last_error?: string | null
          next_attempt_at?: string | null
          org_id?: string
          patient_id?: string
          payload?: Json
          provider_id?: string
          sent_at?: string | null
          status?: string
          template_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_queue_assignment_fk"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "work_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_templates: {
        Row: {
          active: boolean
          body: string
          channel: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          org_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          body: string
          channel: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          org_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          org_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          address: string
          appointment_at: string | null
          appointment_id: string | null
          attempts: number
          cancel_reason: string | null
          cancelled_at: string | null
          channel: string
          confirmed_at: string | null
          contact_id: string | null
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          last_attempt_at: string | null
          last_inbound_message: string | null
          max_attempts: number
          next_run_at: string
          org_id: string
          patient_id: string | null
          payload: Json | null
          send_at: string | null
          sent_at: string | null
          status: string
          template_id: string | null
          to_addr: string | null
          updated_at: string
        }
        Insert: {
          address: string
          appointment_at?: string | null
          appointment_id?: string | null
          attempts?: number
          cancel_reason?: string | null
          cancelled_at?: string | null
          channel: string
          confirmed_at?: string | null
          contact_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_attempt_at?: string | null
          last_inbound_message?: string | null
          max_attempts?: number
          next_run_at?: string
          org_id: string
          patient_id?: string | null
          payload?: Json | null
          send_at?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          to_addr?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          appointment_at?: string | null
          appointment_id?: string | null
          attempts?: number
          cancel_reason?: string | null
          cancelled_at?: string | null
          channel?: string
          confirmed_at?: string | null
          contact_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_attempt_at?: string | null
          last_inbound_message?: string | null
          max_attempts?: number
          next_run_at?: string
          org_id?: string
          patient_id?: string | null
          payload?: Json | null
          send_at?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          to_addr?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "reminder_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders_templates: {
        Row: {
          body: string
          channel: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string
          specialty: string | null
          updated_at: string
          updated_by: string | null
          variables: string[]
        }
        Insert: {
          body: string
          channel: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          specialty?: string | null
          updated_at?: string
          updated_by?: string | null
          variables?: string[]
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          specialty?: string | null
          updated_at?: string
          updated_by?: string | null
          variables?: string[]
        }
        Relationships: []
      }
      report_schedules: {
        Row: {
          at_hour: number
          at_minute: number
          channel: string
          created_at: string
          created_by: string | null
          dow: number[] | null
          frequency: string
          id: string
          is_active: boolean
          last_run_at: string | null
          last_sent_at: string | null
          name: string
          org_id: string
          params: Json
          report: string
          schedule_kind: string
          scope: string
          target: string
          tz: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          at_hour?: number
          at_minute?: number
          channel: string
          created_at?: string
          created_by?: string | null
          dow?: number[] | null
          frequency: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          last_sent_at?: string | null
          name: string
          org_id: string
          params?: Json
          report: string
          schedule_kind: string
          scope: string
          target: string
          tz?: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          at_hour?: number
          at_minute?: number
          channel?: string
          created_at?: string
          created_by?: string | null
          dow?: number[] | null
          frequency?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          last_sent_at?: string | null
          name?: string
          org_id?: string
          params?: Json
          report?: string
          schedule_kind?: string
          scope?: string
          target?: string
          tz?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string
          id: string
          name: string
          org_id: string | null
          owner_id: string
          payload: Json
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          org_id?: string | null
          owner_id: string
          payload: Json
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          org_id?: string | null
          owner_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_searches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_my_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_views: {
        Row: {
          created_at: string
          filters: Json
          id: string
          name: string
          org_id: string
          scope: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters: Json
          id?: string
          name: string
          org_id: string
          scope: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          org_id?: string
          scope?: string
          user_id?: string
        }
        Relationships: []
      }
      sonrisa_quote_items: {
        Row: {
          created_at: string
          description: string
          id: string
          qty: number
          quote_id: string
          treatment_id: string | null
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          qty: number
          quote_id: string
          treatment_id?: string | null
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          qty?: number
          quote_id?: string
          treatment_id?: string | null
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "sonrisa_quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "sonrisa_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sonrisa_quote_items_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "sonrisa_treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      sonrisa_quotes: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          id: string
          notes: string | null
          org_id: string
          patient_id: string
          signature_data_url: string | null
          signed_at: string | null
          signed_by: string | null
          status: string
          total_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          notes?: string | null
          org_id: string
          patient_id: string
          signature_data_url?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          total_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          notes?: string | null
          org_id?: string
          patient_id?: string
          signature_data_url?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          total_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      sonrisa_treatments: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          default_price_cents: number
          id: string
          name: string
          org_id: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          default_price_cents?: number
          id?: string
          name: string
          org_id: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          default_price_cents?: number
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: []
      }
      tag_permissions: {
        Row: {
          can_read: boolean
          can_write: boolean
          created_at: string
          id: string
          org_id: string
          role: string
          tag_id: string
        }
        Insert: {
          can_read?: boolean
          can_write?: boolean
          created_at?: string
          id?: string
          org_id: string
          role: string
          tag_id: string
        }
        Update: {
          can_read?: boolean
          can_write?: boolean
          created_at?: string
          id?: string
          org_id?: string
          role?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_permissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_permissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_my_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_permissions_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          kind: string
          name: string
          org_id: string | null
          owner_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          kind?: string
          name: string
          org_id?: string | null
          owner_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          kind?: string
          name?: string
          org_id?: string | null
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_my_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_prefs: {
        Row: {
          current_org_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          current_org_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          current_org_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_prefs_current_org_id_fkey"
            columns: ["current_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_prefs_current_org_id_fkey"
            columns: ["current_org_id"]
            isOneToOne: false
            referencedRelation: "v_my_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      work_assignments: {
        Row: {
          created_at: string
          details: Json
          due_at: string | null
          id: string
          last_done_at: string | null
          module: string
          org_id: string
          patient_id: string
          provider_id: string
          status: string
          template_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          details?: Json
          due_at?: string | null
          id?: string
          last_done_at?: string | null
          module: string
          org_id: string
          patient_id: string
          provider_id: string
          status?: string
          template_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          details?: Json
          due_at?: string | null
          id?: string
          last_done_at?: string | null
          module?: string
          org_id?: string
          patient_id?: string
          provider_id?: string
          status?: string
          template_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_assignments_template_fk"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "work_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      work_items: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          id: string
          org_id: string
          patient_id: string
          status: Database["public"]["Enums"]["work_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          org_id: string
          patient_id: string
          status?: Database["public"]["Enums"]["work_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          org_id?: string
          patient_id?: string
          status?: Database["public"]["Enums"]["work_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_my_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients_export"
            referencedColumns: ["id"]
          },
        ]
      }
      work_templates: {
        Row: {
          content: Json
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          module: string
          org_id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          module: string
          org_id: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          module?: string
          org_id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      agreements_accepted_unique: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          accepted_role: Database["public"]["Enums"]["agreement_role"] | null
          contract_type: Database["public"]["Enums"]["agreement_type"] | null
          created_at: string | null
          created_by: string | null
          id: string | null
          ip_addr: string | null
          name_snapshot: Json | null
          org_id: string | null
          patient_id: string | null
          specialist_id: string | null
          status: Database["public"]["Enums"]["agreement_status"] | null
          template_id: string | null
          template_version: number | null
          token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          accepted_role?: Database["public"]["Enums"]["agreement_role"] | null
          contract_type?: Database["public"]["Enums"]["agreement_type"] | null
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          ip_addr?: string | null
          name_snapshot?: Json | null
          org_id?: string | null
          patient_id?: string | null
          specialist_id?: string | null
          status?: Database["public"]["Enums"]["agreement_status"] | null
          template_id?: string | null
          template_version?: number | null
          token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          accepted_role?: Database["public"]["Enums"]["agreement_role"] | null
          contract_type?: Database["public"]["Enums"]["agreement_type"] | null
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          ip_addr?: string | null
          name_snapshot?: Json | null
          org_id?: string | null
          patient_id?: string | null
          specialist_id?: string | null
          status?: Database["public"]["Enums"]["agreement_status"] | null
          template_id?: string | null
          template_version?: number | null
          token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agreements_acceptances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agreements_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      org_ledger_balances: {
        Row: {
          balance_cents: number | null
          org_id: string | null
        }
        Relationships: []
      }
      reminders_daily_stats: {
        Row: {
          cancelled: number | null
          confirmed: number | null
          day: string | null
          delivered: number | null
          failed: number | null
          no_show: number | null
          org_id: string | null
          sent: number | null
        }
        Relationships: []
      }
      reminders_logs_view: {
        Row: {
          assignment_id: string | null
          attempt_count: number | null
          channel: string | null
          created_at: string | null
          id: string | null
          last_error: string | null
          next_attempt_at: string | null
          org_id: string | null
          payload: Json | null
          sent_at: string | null
          status: string | null
          template_slug: string | null
        }
        Insert: {
          assignment_id?: string | null
          attempt_count?: number | null
          channel?: string | null
          created_at?: string | null
          id?: string | null
          last_error?: string | null
          next_attempt_at?: string | null
          org_id?: string | null
          payload?: Json | null
          sent_at?: string | null
          status?: string | null
          template_slug?: string | null
        }
        Update: {
          assignment_id?: string | null
          attempt_count?: number | null
          channel?: string | null
          created_at?: string | null
          id?: string | null
          last_error?: string | null
          next_attempt_at?: string | null
          org_id?: string | null
          payload?: Json | null
          sent_at?: string | null
          status?: string | null
          template_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminder_queue_assignment_fk"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "work_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      v_my_orgs: {
        Row: {
          created_at: string | null
          id: string | null
          is_personal: boolean | null
          name: string | null
          role: string | null
          slug: string | null
        }
        Relationships: []
      }
      v_org_features: {
        Row: {
          equilibrio: boolean | null
          mente: boolean | null
          org_id: string | null
          pulso: boolean | null
          sonrisa: boolean | null
          updated_at: string | null
        }
        Insert: {
          equilibrio?: boolean | null
          mente?: boolean | null
          org_id?: string | null
          pulso?: boolean | null
          sonrisa?: boolean | null
          updated_at?: string | null
        }
        Update: {
          equilibrio?: boolean | null
          mente?: boolean | null
          org_id?: string | null
          pulso?: boolean | null
          sonrisa?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_features_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_features_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_my_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      v_patient_share_access: {
        Row: {
          access_at: string | null
          expires_at: string | null
          ip: string | null
          org_id: string | null
          patient_id: string | null
          revoked_at: string | null
          share_created_at: string | null
          share_id: string | null
          token: string | null
          user_agent: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_shares_patient_fk"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_shares_patient_fk"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_shares_patient_fk"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients_export"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_shares_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_shares_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_shares_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patients_export"
            referencedColumns: ["id"]
          },
        ]
      }
      v_patients: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          dob: string | null
          gender: string | null
          id: string | null
          name: string | null
          org_id: string | null
          tags: string[] | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          dob?: never
          gender?: never
          id?: string | null
          name?: string | null
          org_id?: string | null
          tags?: never
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          dob?: never
          gender?: never
          id?: string | null
          name?: string | null
          org_id?: string | null
          tags?: never
        }
        Relationships: []
      }
      v_patients_export: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          edad: number | null
          genero: string | null
          id: string | null
          nombre: string | null
          tags: string | null
          user_id: string | null
        }
        Relationships: []
      }
      v_reminders_logs: {
        Row: {
          attempts: number | null
          channel: string | null
          created_at: string | null
          id: string | null
          last_attempt_at: string | null
          org_id: string | null
          patient_id: string | null
          status: string | null
          target: string | null
          template: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      agreements_is_patient_cleared: {
        Args: { p_org: string; p_patient: string; p_specialist: string }
        Returns: boolean
      }
      auth_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      bank_flow: {
        Args:
          | { p_from: string; p_group?: string; p_org_id: string; p_to: string }
          | { p_from: string; p_org_id: string; p_to: string }
        Returns: {
          expense_cents: number
          income_cents: number
          net_cents: number
          period: string
        }[]
      }
      bank_pl: {
        Args: { p_from: string; p_org_id: string; p_to: string }
        Returns: {
          category: string
          kind: string
          total_cents: number
        }[]
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      can_revoke_document: {
        Args: { p_doc_id: string; p_doc_type: string }
        Returns: boolean
      }
      delete_note_with_reason: {
        Args: { p_note_id: string; p_reason: string }
        Returns: undefined
      }
      ensure_document_folio: {
        Args: { p_doc_id: string; p_doc_type: string }
        Returns: {
          created_at: string
          doc_id: string
          doc_type: string
          folio: string | null
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          verify_code: string | null
        }
      }
      ensure_personal_org_for: {
        Args: { email?: string; uid: string }
        Returns: string
      }
      ensure_rx_folio: {
        Args: { p_id: string; p_org_id: string; p_prefix?: string }
        Returns: string
      }
      generate_work_for_appointment: {
        Args: { p_appt: string }
        Returns: undefined
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_min_role: {
        Args: { p_min: string; p_org: string }
        Returns: boolean
      }
      has_role: {
        Args: { roles: string[] }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      immutable_unaccent: {
        Args: { "": string }
        Returns: string
      }
      is_member: {
        Args: { org: string }
        Returns: boolean
      }
      is_member_of: {
        Args: { org: string }
        Returns: boolean
      }
      is_member_of_org: {
        Args:
          | {
              p_min_role?: Database["public"]["Enums"]["org_role"]
              p_org: string
            }
          | { p_min_role?: string; p_org: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      jwt_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      list_file_versions: {
        Args: { p_group_key: string; p_patient_id: string }
        Returns: {
          checksum_sha256: string
          created_at: string
          name: string
          path: string
          size_bytes: number
          version: number
        }[]
      }
      list_latest_files: {
        Args: { p_patient_id: string }
        Returns: {
          created_at: string
          group_key: string
          name: string
          path: string
          size_bytes: number
          version: number
        }[]
      }
      log_audit: {
        Args:
          | {
              _action: string
              _data: Json
              _entity: string
              _entity_id: string
              _patient_id: string
            }
          | {
              p_action: string
              p_entity: string
              p_entity_id: string
              p_payload: Json
            }
        Returns: undefined
      }
      log_file_access: {
        Args: {
          p_action: string
          p_ip: string
          p_path: string
          p_patient_id: string
          p_ua: string
        }
        Returns: undefined
      }
      metrics_new_patients_by_month: {
        Args: { months?: number; p_org?: string }
        Returns: {
          month_start: string
          total: number
        }[]
      }
      metrics_notes_by_month: {
        Args: { months?: number; p_org?: string }
        Returns: {
          month_start: string
          total: number
        }[]
      }
      metrics_patients_by_tag: {
        Args: { p_from?: string; p_org?: string; p_to?: string }
        Returns: {
          tag_id: string
          tag_name: string
          total: number
        }[]
      }
      next_file_version: {
        Args: { p_group_key: string; p_patient_id: string }
        Returns: number
      }
      norm_text: {
        Args: { p: string }
        Returns: string
      }
      org_role_rank: {
        Args: { r: string }
        Returns: number
      }
      patient_has_explicit_permission: {
        Args: { p_kind: string; p_patient_id: string }
        Returns: boolean
      }
      patient_has_tag_permission: {
        Args: { p_kind: string; p_patient_id: string }
        Returns: boolean
      }
      patient_labels_summary: {
        Args: { p_org_id: string }
        Returns: {
          label: string
          total: number
        }[]
      }
      patient_share_access_list: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_org_id: string
          p_patient_id: string
        }
        Returns: {
          access_at: string
          created_at: string
          expires_at: string
          ip: string
          revoked_at: string
          share_id: string
          status: string
          token: string
          total: number
          user_agent: string
        }[]
      }
      patient_share_allows: {
        Args: { p_action: string; p_patient: string }
        Returns: boolean
      }
      patients_autocomplete: {
        Args: { org: string; q: string; show_org?: boolean; uid: string }
        Returns: {
          id: string
          label: string
        }[]
      }
      patients_ids_by_tags: {
        Args: { mode?: string; tag_ids: string[] }
        Returns: {
          patient_id: string
        }[]
      }
      patients_search: {
        Args: {
          p_from?: string
          p_genero?: string
          p_include_deleted?: boolean
          p_limit?: number
          p_offset?: number
          p_org_id: string
          p_q?: string
          p_tags_all?: string[]
          p_tags_any?: string[]
          p_to?: string
        }
        Returns: {
          created_at: string
          deleted_at: string
          dob: string
          gender: string
          id: string
          name: string
          tags: string[]
          total: number
        }[]
      }
      patients_search_suggest: {
        Args: {
          p_limit?: number
          p_org_id: string
          p_provider_id?: string
          p_q: string
          p_scope?: string
        }
        Returns: {
          email: string
          full_name: string
          id: string
          phone: string
          score: number
        }[]
      }
      patients_suggest: {
        Args: {
          limit_n?: number
          only_mine?: boolean
          org: string
          provider: string
          q: string
        }
        Returns: {
          display_name: string
          patient_id: string
        }[]
      }
      patients_with_label_search: {
        Args: {
          p_label: string
          p_limit?: number
          p_offset?: number
          p_org_id: string
        }
        Returns: {
          created_at: string
          dob: string
          gender: string
          id: string
          name: string
          total: number
        }[]
      }
      recalc_quote_total: {
        Args: { p_quote_id: string }
        Returns: undefined
      }
      reminders_logs_search: {
        Args: {
          p_channel?: string[]
          p_date_field?: string
          p_from?: string
          p_limit?: number
          p_offset?: number
          p_org_id: string
          p_q?: string
          p_status?: string[]
          p_to?: string
        }
        Returns: {
          attempts: number
          channel: string
          created_at: string
          id: string
          last_attempt_at: string
          patient_id: string
          status: string
          target: string
          template: string
          total: number
        }[]
      }
      revoke_document: {
        Args: { p_doc_id: string; p_doc_type: string; p_reason?: string }
        Returns: {
          created_at: string
          doc_id: string
          doc_type: string
          folio: string | null
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          verify_code: string | null
        }
      }
      role_at_least: {
        Args:
          | {
              actual: Database["public"]["Enums"]["org_role"]
              min_required: Database["public"]["Enums"]["org_role"]
            }
          | { min_role: string; org: string }
        Returns: boolean
      }
      role_rank: {
        Args: { role: string }
        Returns: number
      }
      search_all: {
        Args:
          | { p_limit?: number; p_offset?: number; p_org?: string; q: string }
          | { q: string }
        Returns: {
          patient_id: string
        }[]
      }
      search_all_plus: {
        Args:
          | {
              p_from?: string
              p_genero?: string
              p_limit?: number
              p_offset?: number
              p_org?: string
              p_patient_ids?: string[]
              p_to?: string
              q: string
            }
          | { payload: Json }
        Returns: {
          patient_id: string
        }[]
      }
      search_notes_files: {
        Args: { p_limit?: number; p_org: string; p_query: number[] }
        Returns: {
          id: string
          kind: string
          name: string
          patient_id: string
          ref: string
          score: number
          snippet: string
        }[]
      }
      seed_bank_defaults: {
        Args: { p_org: string }
        Returns: undefined
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      unaccent: {
        Args: { "": string }
        Returns: string
      }
      unaccent_init: {
        Args: { "": unknown }
        Returns: unknown
      }
      update_note_with_reason: {
        Args: {
          p_contenido: string
          p_note_id: string
          p_reason: string
          p_titulo: string
        }
        Returns: {
          contenido: string | null
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          org_id: string | null
          patient_id: string
          search: unknown | null
          titulo: string | null
          updated_at: string
          user_id: string
        }
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      agreement_role: "specialist" | "patient" | "platform"
      agreement_status: "pending" | "accepted" | "revoked"
      agreement_type:
        | "specialist_patient"
        | "specialist_platform"
        | "patient_platform"
      lab_status:
        | "requested"
        | "awaiting_upload"
        | "uploaded"
        | "reviewed"
        | "cancelled"
      org_role: "owner" | "admin" | "member" | "external"
      permission_level: "read" | "write"
      work_status: "open" | "done"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agreement_role: ["specialist", "patient", "platform"],
      agreement_status: ["pending", "accepted", "revoked"],
      agreement_type: [
        "specialist_patient",
        "specialist_platform",
        "patient_platform",
      ],
      lab_status: [
        "requested",
        "awaiting_upload",
        "uploaded",
        "reviewed",
        "cancelled",
      ],
      org_role: ["owner", "admin", "member", "external"],
      permission_level: ["read", "write"],
      work_status: ["open", "done"],
    },
  },
} as const
