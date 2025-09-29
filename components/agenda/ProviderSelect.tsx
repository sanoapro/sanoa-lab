"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function ProviderSelect({
  value,
  onChange,
}: {
  value?: string;
  onChange: (providerId: string) => void;
}) {
  const supa = getSupabaseBrowser();
  const [me, setMe] = useState<string>("");

  useEffect(() => {
    supa.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setMe(data.user.id);
    });
  }, [supa]);

  return (
    <div className="flex items-center gap-2">
      <input
        className="border rounded px-3 py-2 w-[360px]"
        placeholder="UUID de profesional"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        aria-label="UUID del profesional"
      />
      <button
        type="button"
        className="border rounded px-3 py-2"
        onClick={() => me && onChange(me)}
        title="Usar mi usuario"
      >
        Usar mi usuario
      </button>
    </div>
  );
}
