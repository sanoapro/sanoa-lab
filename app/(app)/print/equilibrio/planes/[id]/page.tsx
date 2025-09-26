import { createClient } from '@/lib/supabase/server';
import AccentHeader from '@/components/ui/AccentHeader';

export default async function PrintPlan({ params }:{ params:{ id:string } }){
  const supa = await createClient();
  const { data } = await supa.from('exercise_plans').select('*').eq('id', params.id).single();
  const plan = data?.plan || { items: [] };

  return (
    <div className="p-8 print:p-0 max-w-2xl mx-auto text-sm">
      <AccentHeader emoji="🧘">Plan de ejercicios</AccentHeader>
      <div className="opacity-70 mb-4">{data?.title || 'Sin título'} · Paciente: {data?.patient_id}</div>
      <ol className="list-decimal ml-6 space-y-1">
        {(plan.items||[]).map((it:any, idx:number)=>(
          <li key={idx}>
            {it.name} — {it.sets}×{it.reps} · {it.freqPerWeek}/sem{it.notes ? ` · ${it.notes}` : ''}
          </li>
        ))}
      </ol>
    </div>
  );
}
