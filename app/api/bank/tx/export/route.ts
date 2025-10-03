// MODE: session (user-scoped, cookies)
// Ruta: /api/bank/tx/export  → CSV con filtros (igual que /api/bank/tx)
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

function parseMulti(q: URLSearchParams, key: string): string[] | undefined {
  const vals = q
    .getAll(key)
    .flatMap((v: string) =>
      v
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean),
    );
  return vals.length ? Array.from(new Set(vals)) : undefined;
}

function csvEscape(val: unknown): string {
  if (val === null || typeof val === "undefined") return "";
  const s = String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// Tipado de filas
type BankTxRow = {
  id: string;
  date: string; // YYYY-MM-DD
  amount_cents: number;
  currency: string | null;
  status: string;
  account_id: string;
  category_id: string | null;
  method: string | null;
  memo: string | null;
  tags: string[] | null;
  created_at: string; // ISO
};

export async function GET(req: NextRequest) {
  // MODE: session
  try {
    const supa = await getSupabaseServer();
    const { data: userRes } = await supa.auth.getUser();
    if (!userRes?.user) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } },
        { status: 401 },
      );
    }

    const url = new URL(req.url);
    const q = url.searchParams;
    const org_id = q.get("org_id") ?? "";
    if (!org_id)
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Falta org_id" } },
        { status: 400 },
      );

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

    // 1) Conteo seguro para evitar respuestas gigantes
    let countQ = supa
      .from("bank_tx")
      .select("*", { count: "exact", head: true })
      .eq("org_id", org_id);
    if (from) countQ = countQ.gte("date", from);
    if (to) countQ = countQ.lte("date", to);
    if (text) countQ = countQ.ilike("memo", `%${text}%`);
    if (status?.length) countQ = countQ.in("status", status);
    if (accounts?.length) countQ = countQ.in("account_id", accounts);
    if (categories?.length) countQ = countQ.in("category_id", categories);
    if (methods?.length) countQ = countQ.in("method", methods);
    if (typeof min === "number") countQ = countQ.gte("amount_cents", min);
    if (typeof max === "number") countQ = countQ.lte("amount_cents", max);
    if (tagsAny?.length) countQ = countQ.overlaps("tags", tagsAny);
    if (tagsAll?.length) countQ = countQ.contains("tags", tagsAll);

    const { count, error: countErr } = await countQ;
    if (countErr)
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: countErr.message } },
        { status: 400 },
      );

    const MAX = 5000;
    if ((count ?? 0) > MAX) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "TOO_MANY_ROWS",
            message: `Demasiados registros (${count}). Refina tus filtros o reduce el rango. Límite: ${MAX}.`,
          },
        },
        { status: 400 },
      );
    }

    // 2) Consulta final (orden por fecha asc)
    let query = supa
      .from("bank_tx")
      .select(
        "id,date,amount_cents,currency,status,account_id,category_id,method,memo,tags,created_at",
      )
      .eq("org_id", org_id)
      .order("date", { ascending: true });

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

    const { data, error } = await query.limit(MAX).returns<BankTxRow[]>();
    if (error)
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: error.message } },
        { status: 400 },
      );

    const header = [
      "id",
      "date",
      "amount_cents",
      "currency",
      "status",
      "account_id",
      "category_id",
      "method",
      "memo",
      "tags",
      "created_at",
    ];

    const rows: string[][] = (data ?? []).map((r: BankTxRow): string[] => [
      r.id,
      r.date,
      String(r.amount_cents),
      (r.currency ?? "mxn").toUpperCase(),
      r.status,
      r.account_id,
      r.category_id ?? "",
      r.method ?? "",
      r.memo ?? "",
      Array.isArray(r.tags) ? r.tags.join("|") : "",
      r.created_at,
    ]);

    const csvLines: string[] = [
      header.map(csvEscape).join(","),
      ...rows.map((line: string[]) => line.map(csvEscape).join(",")),
    ];
    const csv = csvLines.join("\n");

    const filename = `bank_tx_${org_id}_${new Date().toISOString().slice(0, 10)}.csv`;
    return new Response(new Blob([csv]), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: msg } },
      { status: 500 },
    );
  }
}
