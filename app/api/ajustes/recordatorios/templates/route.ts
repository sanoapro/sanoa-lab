import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request){
  const supa = createClient();
  const { searchParams } = new URL(req.url);
  const org_id = searchParams.get('org_id');
  if (!org_id) return NextResponse.json({ error:'Falta org_id' }, { status: 400 });
  const { data, error } = await supa
    .from('reminder_templates')
    .select('*')
    .eq('org_id', org_id)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok:true, data: data || [] });
}
