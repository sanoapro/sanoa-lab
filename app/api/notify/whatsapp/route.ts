import { NextResponse } from 'next/server';
import { sendTwilioWhatsApp } from '@/lib/notify/twilio';

export const runtime = 'nodejs';

export async function POST(req: Request){
  try{
    const { to, body } = await req.json();
    if (!to || !body) return NextResponse.json({ error:'Faltan parámetros' }, { status: 400 });
    const res = await sendTwilioWhatsApp(to, body);
    return NextResponse.json({ ok:true, sid: res.sid });
  }catch(e:any){
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 });
  }
}
