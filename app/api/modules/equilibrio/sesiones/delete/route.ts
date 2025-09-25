import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request){
  const supa = createClient();
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error:'Falta id' }, { status:400 });

  const { error } = await supa.from('rehab_sessions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status:400 });
  return NextResponse.json({ ok:true });
}
