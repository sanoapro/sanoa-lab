// MODE: session (user-scoped, cookies)
// Ruta: /api/bank/tx
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type DB = Database;
type Tx = DB["public"]["Tables"]["bank_tx"]["Row"];

function parseMulti(q: URLSearchParams, key: string): string[] | undefined {
  const vals = q.getAll(key).flatMap(v => v.split(",").map(s => s.trim()).filter(Boolean));
  return vals.length ? Array.from(new Set(vals)) : undefined;
}

export async function GET(req: NextRequest) {
  // MODE: session (user-scoped, cookies)
  try {
    const supa = await getSupabaseServer();
    const { data: userRes } = await supa.auth.getUser();
    if (!userRes?.user) {
      return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } }, { status: 401 });
    }

    const url = new URL(req.url);
    const q = url.searchParams;
    const org_id = q.get("org_id") ?? "";
    if (!org_id) return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "Falta org_id" } }, { status: 400 });

    const page = Math.max(1, Number(q.get("page") ?? "1"));
    const pageSize = Math.min(200, Math.max(1, Number(q.get("pageSize") ?? "50")));

    const from = q.get("from") ?? undefined;
    const to = q.get("to") ?? undefined;
    const text = q.get("q") ?? undefined;
    const status = parseMulti(q, "status");
    const accounts = parseMulti(q, "account");
    const categories = parseMulti(q, "category");
    const methods = parseMulti(q, "method");
    const tagsAny = parseMulti(q, "tagsAny");
    const tagsAll = parseMulti(q, "tagsAll");
    const min = q.get("min") ? Number(q.get("min")) : undefined;
    const max = q.get("max") ? Number(q.get("max")) : undefined;
    const orderBy = q.get("orderBy") ?? "date";
    const orderDir = (q.get("orderDir") ?? "desc").toLowerCase() === "asc" ? { ascending: true } : { ascending: false };

    let query = supa.from("bank_tx").select("*", { count: "exact" }).eq("org_id", org_id);

    if (from) query = query.gte("date", from);
    if (to) query = query.lte("date", to);
    if (text) query = query.ilike("memo", `%${text}%`);
    if (status?.length) query = query.in("status", status);
    if (accounts?.length) query = query.in("account_id", accounts);
    if (categories?.length) query = query.in("category_id", categories);
    if (methods?.length) query = query.in("method", methods);
    if (typeof min === "number") query = query.gte("amount_cents", min);
    if (typeof max === "number") query = query.lte("amount_cents", max);
    if (tagsAny?.length) query = query.overlaps("tags", tagsAny);
    if (tagsAll?.length) query = query.contains("tags", tagsAll);

    const orderable = new Set(["date", "amount_cents", "created_at"]);
    const orderCol = orderable.has(orderBy) ? orderBy : "date";
    query = query.order(orderCol as "date", orderDir);

    const fromIdx = (page - 1) * pageSize;
    const toIdx = fromIdx + pageSize - 1;

    const { data, error, count } = await query.range(fromIdx, toIdx);
    if (error) return NextResponse.json({ ok: false, error: { code: "DB_ERROR", message: error.message } }, { status: 400 });

    return NextResponse.json({ ok: true, data, meta: { page, pageSize, total: count ?? 0 } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // MODE: session (user-scoped, cookies)
  try {
    const supa = await getSupabaseServer();
    const { data: userRes } = await supa.auth.getUser();
    if (!userRes?.user) {
      return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const org_id: string | undefined = body?.org_id;
    const items: Partial<Tx>[] | undefined = body?.items;

    if (!org_id || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "org_id e items requeridos." } }, { status: 400 });
    }

    const cleaned = items.map(it => ({
      org_id,
      account_id: it.account_id!,
      date: it.date!,
      amount_cents: it.amount_cents!,
      currency: it.currency ?? "mxn",
      category_id: it.category_id ?? null,
      memo: it.memo ?? null,
      method: it.method ?? null,
      tags: it.tags ?? null,
      status: it.status ?? "pending"
    }));

    const { data, error } = await supa.from("bank_tx").insert(cleaned).select("*");
    if (error) return NextResponse.json({ ok: false, error: { code: "DB_ERROR", message: error.message } }, { status: 400 });

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } }, { status: 500 });
  }
}
