import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(_: Request, { params }: { params: { path: string[] } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const key = params.path.join("/");
  const { data } = await supabase.storage.from("signatures").createSignedUrl(key.replace(/^signatures\//, ""), 60);
  if (!data?.signedUrl) return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(data.signedUrl, { status: 307 });
}
