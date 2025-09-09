"use client";
import { useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

/** Llama a onChange cuando cambian notas de un patient_id. */
export function useNotesRealtime(patientId: string, onChange: () => void, debounceMs = 250) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!patientId) return;
    const supabase = getSupabaseBrowser();
    let active = true;
    let chan: ReturnType<typeof supabase.channel> | null = null;

    const debounced = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { if (active) onChange(); }, debounceMs);
    };

    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id ?? "anon";
      // Filtramos por patient_id; (opcional) también por user_id:
      // const filter = `patient_id=eq.${patientId},user_id=eq.${u?.user?.id}`
      const filter = `patient_id=eq.${patientId}`;

      chan = supabase
        .channel(`patient-notes-${patientId}-${uid}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "patient_notes", filter }, () => {
          debounced();
        })
        .subscribe();
    })();

    return () => {
      active = false;
      if (timer.current) clearTimeout(timer.current);
      if (chan) supabase.removeChannel(chan);
    };
  }, [patientId, onChange, debounceMs]);
}
