import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  const specialty = String(searchParams.get("specialty") || "");
  if (!specialty) {
    return NextResponse.json({ error: "specialty requerida" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("form_templates")
    .select("*")
    .eq("specialty", specialty)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("[templates:list]", error);
    return NextResponse.json({ error: "No se pudo listar plantillas" }, { status: 500 });
  }
  return NextResponse.json({ templates: data });
}
