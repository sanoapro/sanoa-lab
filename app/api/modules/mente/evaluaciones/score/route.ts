import { NextResponse } from "next/server";
import { phq9Score } from "@/lib/evals/phq9";
import { gad7Score } from "@/lib/evals/gad7";

export async function POST(req: Request) {
  try {
    const { type, answers } = await req.json();
    if (type === "phq9") return NextResponse.json({ ok: true, type, ...phq9Score(answers) });
    if (type === "gad7") return NextResponse.json({ ok: true, type, ...gad7Score(answers) });
    return NextResponse.json({ ok: false, error: "Tipo no soportado" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 400 });
  }
}
