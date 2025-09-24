import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function supaServer() {
  const cookieStore = cookies(); // ← ¡OJO! aquí sí es await en Server Actions, pero en helper no.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! /* solo si este helper es backend puro; si no, usa anon */,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
      headers: {
        get: (name: string) => headers().get(name) ?? undefined,
      },
    }
  );
}
