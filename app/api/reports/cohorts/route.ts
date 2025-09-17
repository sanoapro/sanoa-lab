import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  const org = String(searchParams.get("org") || "");
  if (!org) return NextResponse.json({ error: "org requerida" }, { status: 400 });
  const { data, error } = await supabase.rpc("reports_cohort_retention", { p_org: org });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ cohorts: data || [] });
}
