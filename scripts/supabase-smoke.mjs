import { createClient } from "@supabase/supabase-js";

const url     = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://mmeybpohqtpvaxuhipjr.supabase.co";
const anon    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tZXlicG9ocXRwdmF4dWhpcGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NTI5NDAsImV4cCI6MjA3MjQyODk0MH0.v6fU9AIDVyvH7gk3_OxiTubXDmXm8-kREP8hiPnZ8Qw";
const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tZXlicG9ocXRwdmF4dWhpcGpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njg1Mjk0MCwiZXhwIjoyMDcyNDI4OTQwfQ.Td8gJFOF_O1d0nDVLG207VqM6LkfXFHyWM2SwGuerEQ";

const mask = (s) => s ? `${s.slice(0,6)}…${s.slice(-4)} (${s.length} chars)` : "(missing)";

console.log("URL:     ", url);
console.log("Anon:    ", mask(anon));
console.log("Service: ", mask(service));

if (!url || !anon || !service) {
  console.error("\n❌ Falta al menos una variable (URL/ANON/SERVICE). Expórtalas o pásalas inline.\n");
  process.exit(1);
}

const admin = createClient(url, service, { auth: { persistSession: false } });
const pub   = createClient(url, anon);

try {
  // Service Role: debería funcionar aunque RLS sea estricto
  const { data: d1, error: e1 } = await admin.from("org_features").select("org_id").limit(1);
  console.log("[Service] org_features:", e1 ? e1.message : `ok (${d1?.length ?? 0} filas)`);

  // Anon: puede fallar si RLS lo impide (es normal)
  const { data: d2, error: e2 } = await pub.from("org_features").select("org_id").limit(1);
  console.log("[Anon]    org_features:", e2 ? e2.message : `ok (${d2?.length ?? 0} filas)`);
} catch (err) {
  console.error("\nUnexpected error:", err);
  process.exit(1);
}
