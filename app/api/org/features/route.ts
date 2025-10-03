// app/api/org/features/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type OrgFeatureRow = { feature_id: string };

export async function GET(req: Request) {
  const supa = await createClient();
  const { searchParams } = new URL(req.url);
  const org_id = searchParams.get("org_id");

  if (!org_id) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Falta org_id" } },
      { status: 400 },
    );
  }

  const { data, error } = await supa
    .from("org_features")
    .select("feature_id")
    .eq("org_id", org_id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 },
    );
  }

  const features = (data ?? []).map((row: OrgFeatureRow) => row.feature_id);
  return NextResponse.json({ ok: true, features });
}
