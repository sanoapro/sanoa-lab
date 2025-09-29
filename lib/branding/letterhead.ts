import type { SupabaseClient } from "@supabase/supabase-js";

/** Intenta resolver un membrete del bucket 'letterheads' con el user_id. */
export async function getUserLetterheadURL(
  supa: SupabaseClient,
  userId: string
): Promise<string | null> {
  try {
    const bucket = supa.storage.from("letterheads");
    const tryKeys = [`${userId}.png`, `${userId}.jpg`, `${userId}.jpeg`, `${userId}.webp`];
    for (const key of tryKeys) {
      const { data, error } = await bucket.createSignedUrl(key, 60);
      if (!error && data?.signedUrl) return data.signedUrl;
    }
    return null;
  } catch {
    return null;
  }
}

/** Bloque HTML del membrete (imagen si existe, de lo contrario texto con datos del especialista/organización). */
export function renderLetterheadHTML(opts: {
  specialistName: string;
  specialty?: string | null;
  orgName?: string | null;
  letterheadUrl?: string | null;
}) {
  const { specialistName, specialty, orgName, letterheadUrl } = opts;
  if (letterheadUrl) {
    return `
      <div style="margin-bottom:16px; border-bottom:1px solid #e5e7eb; padding-bottom:12px;">
        <img src="${letterheadUrl}" alt="Membrete" style="max-width:100%; height:auto;"/>
      </div>
    `;
  }
  return `
    <div style="margin-bottom:16px; border-bottom:1px solid #e5e7eb; padding-bottom:8px;">
      <div style="font-weight:700; font-size:18px;">${escapeHtml(specialistName)}</div>
      ${
        specialty
          ? `<div style="color:#334155; font-size:13px;">${escapeHtml(specialty)}</div>`
          : ""
      }
      ${
        orgName
          ? `<div style="color:#475569; font-size:12px; margin-top:4px;">${escapeHtml(orgName)}</div>`
          : ""
      }
    </div>
  `;
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
