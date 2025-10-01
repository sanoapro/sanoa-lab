import Link from "next/link";

async function getTemplates() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/prescriptions/templates`, { cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}

export default async function Page() {
  const items = await getTemplates();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold"><span className="emoji">💊</span> Plantillas de receta</h1>

      <div className="glass-card">
        <div className="flex items-center justify-between">
          <p className="text-contrast text-sm">Crea y reutiliza tus plantillas de receta.</p>
          <Link href="/prescriptions/new" className="glass-btn"><span className="emoji">➕</span> Nueva</Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((t: any) => (
          <div key={t.id} className="glass-card bubble">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{t.name ?? "Sin título"}</h3>
                <p className="text-sm text-contrast">{t.note ?? ""}</p>
              </div>
              <Link href={`/prescriptions/from-template?id=${t.id}`} className="glass-btn">
                <span className="emoji">🧾</span> Usar
              </Link>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="glass-card">Aún no tienes plantillas.</div>}
      </div>
    </div>
  );
}
