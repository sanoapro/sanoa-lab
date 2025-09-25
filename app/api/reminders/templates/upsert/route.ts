import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request){
  const supa = createClient();
  try{
    const { id, org_id, name, channel, body, active = true } = await req.json();
    if (!org_id || !name || !channel || !body) {
      return NextResponse.json({ error:'Faltan parámetros' }, { status: 400 });
    }
    const payload = { org_id, name, channel, body, active };
    const q = id
      ? supa.from('reminder_templates').update(payload).eq('id', id).select('*').single()
      : supa.from('reminder_templates').insert(payload).select('*').single();
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok:true, data });
  }catch(e:any){
    return NextResponse.json({ error: String(e?.message||e) }, { status: 400 });
  }
}
