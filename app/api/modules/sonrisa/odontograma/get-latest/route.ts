import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request){
  const supa = await createClient();
  const { searchParams } = new URL(req.url);
  const patient_id = searchParams.get('patient_id');
  if (!patient_id) return NextResponse.json({ error:'Falta patient_id' }, { status:400 });

  const { data, error } = await supa
    .from('dental_charts')
    .select('*')
    .eq('patient_id', patient_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status:400 });
  return NextResponse.json({ ok:true, data });
}
