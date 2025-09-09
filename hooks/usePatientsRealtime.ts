"use client";
import { useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

/** Llama a onChange (debounced) ante insert/update/delete en public.patients del usuario actual. */
export function usePatientsRealtime(onChange: () => void, debounceMs = 250) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    let active = true;
    let chan: ReturnType<typeof supabase.channel> | null = null;

    const debounced = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { if (active) onChange(); }, debounceMs);
    };

    (async () => {
      // opcional: filtrar por user_id del cliente
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id ?? "anon";
      const filter = u?.user?.id ? `user_id=eq.${u.user.id}` : undefined;

      chan = supabase
        .channel(`patients-${uid}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "patients", filter }, () => {
          debounced();
        })
        .subscribe();
    })();

    return () => {
      active = false;
      if (timer.current) clearTimeout(timer.current);
      if (chan) supabase.removeChannel(chan);
    };
  }, [onChange, debounceMs]);
}
