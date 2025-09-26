import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request){
  const supa = await createClient();
  try{
    const { id, patient_id, chart, note } = await req.json();
    if (!patient_id || !chart) {
      return NextResponse.json({ error:'Faltan parámetros' }, { status:400 });
    }

    const q = id
      ? supa.from('dental_charts').update({ chart, note }).eq('id', id).select('*').single()
      : supa.from('dental_charts').insert({ patient_id, chart, note }).select('*').single();

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status:400 });

    return NextResponse.json({ ok:true, data });
  }catch(e:any){
    return NextResponse.json({ error: String(e?.message||e) }, { status:400 });
  }
}
