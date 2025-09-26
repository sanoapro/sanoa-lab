import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request){
  const supa = await createClient();
  try{
    const { id, patient_id, date, soap } = await req.json();
    if (!patient_id || !soap) {
      return NextResponse.json({ error:'Faltan parámetros' }, { status:400 });
    }
    const payload: any = { soap };
    if (date) payload.date = date;

    const q = id
      ? supa.from('rehab_sessions').update(payload).eq('id', id).select('*').single()
      : supa.from('rehab_sessions').insert({ patient_id, ...payload }).select('*').single();

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status:400 });

    return NextResponse.json({ ok:true, data });
  }catch(e:any){
    return NextResponse.json({ error: String(e?.message||e) }, { status:400 });
  }
}
