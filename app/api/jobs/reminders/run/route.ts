import { NextResponse } from 'next/server';
import { runReminderBatch } from '@/lib/reminders/runner';

export const runtime = 'nodejs';

export async function POST(req: Request){
  try{
    const { org_id, limit } = await req.json().catch(()=>({}));
    const res = await runReminderBatch(org_id, limit || 20);
    return NextResponse.json({ ok:true, ...res });
  }catch(e:any){
    return NextResponse.json({ ok:false, error: String(e?.message||e) }, { status: 500 });
  }
}

// GET para pruebas rápidas
export async function GET(){
  try{
    const res = await runReminderBatch(undefined, 10);
    return NextResponse.json({ ok:true, ...res });
  }catch(e:any){
    return NextResponse.json({ ok:false, error: String(e?.message||e) }, { status: 500 });
  }
}
