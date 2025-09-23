import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

function safePath(input: string | null): string {
  // Evita open-redirect: solo paths internos que empiezan por "/" y no por "//"
  if (!input || !input.startsWith("/") || input.startsWith("//")) return "/dashboard";
  return input;
}

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = safePath(url.searchParams.get("next"));

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        const msg = typeof error === "object" && (error as any)?.message ? (error as any).message : String(error);
        const login = new URL("/login", url.origin);
        login.searchParams.set("error", msg);
        return NextResponse.redirect(login);
      }
    } else {
      // Si no hay code, redirigimos a login con un aviso
      const login = new URL("/login", url.origin);
      login.searchParams.set("error", "No se recibió el código de inicio de sesión.");
      return NextResponse.redirect(login);
    }
  } catch (e: any) {
    const login = new URL("/login", url.origin);
    login.searchParams.set("error", e?.message || "No se pudo completar el inicio de sesión.");
    return NextResponse.redirect(login);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

export const POST = GET;
