export const metadata = { title: "Riesgo de pacientes" };

async function fetchRisk() {
  const r = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/reports/agenda/risk/patients/json`,
    { cache: "no-store" }
  );
  if (!r.ok) return { items: [] };
  return r.json();
}

export default async function Page() {
  const data = await fetchRisk();
  const items = data?.items ?? [];

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">
        <span className="emoji">🚦</span> Riesgo de pacientes
      </h1>

      {!items.length ? (
        <div className="glass-card bubble text-center py-10 space-y-2">
          <div className="text-4xl">
            <span className="emoji">🫗</span>
          </div>
          <h3 className="text-lg font-semibold">Sin datos de riesgo</h3>
          <p className="text-sm text-contrast/80">
            Cuando registres mediciones y notas clínicas recientes, aparecerán aquí con semáforo de riesgo.
          </p>
          <div className="pt-2">
            <a className="glass-btn" href="/pulso">
              <span className="emoji">➕</span> Añadir mediciones
            </a>
          </div>
        </div>
      ) : (
        <div className="glass-card bubble overflow-x-auto">
          <table className="min-w-[700px] w-full">
            <thead>
              <tr className="text-left">
                <th className="py-2">Paciente</th>
                <th>Riesgo</th>
                <th>Última actualización</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it: any) => (
                <tr key={it.patient_id} className="border-t border-white/10">
                  <td className="py-2">{it.name ?? "Paciente"}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background:
                          it.risk_score >= 0.7
                            ? "rgba(244,63,94,.18)"
                            : it.risk_score >= 0.4
                            ? "rgba(250,204,21,.18)"
                            : "rgba(34,197,94,.18)",
                      }}
                    >
                      <span className="emoji">
                        {it.risk_score >= 0.7 ? "🔴" : it.risk_score >= 0.4 ? "🟡" : "🟢"}
                      </span>
                      {(it.risk_score * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td>{it.updated_at ? new Date(it.updated_at).toLocaleString() : "—"}</td>
                  <td>
                    <a className="glass-btn" href={`/pacientes/${it.patient_id}`}>
                      <span className="emoji">🔎</span> Ver
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
