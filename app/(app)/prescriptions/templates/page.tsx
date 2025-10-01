import Link from "next/link";

export const metadata = { title: "Plantillas de receta" };

type PrescriptionTemplate = {
  id: string | number;
  name?: string | null;
  description?: string | null;
};

async function fetchTemplates(): Promise<PrescriptionTemplate[]> {
  try {
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/prescriptions/templates`,
      { cache: "no-store" },
    );
    if (!r.ok) {
      return [];
    }
    const data = (await r.json()) as PrescriptionTemplate[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function Page() {
  const data = await fetchTemplates();

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">
        <span className="emoji">💊</span> Plantillas
      </h1>
      {!data.length ? (
        <div className="glass-card bubble">No hay plantillas aún.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {data.map((t) => (
            <Link
              key={t.id}
              href={`/prescriptions?template=${t.id}`}
              className="glass-card bubble hover-glow"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{t.name ?? `Plantilla #${t.id}`}</div>
                <span className="emoji">➡️</span>
              </div>
              {t.description ? (
                <p className="mt-1 text-sm text-contrast/80">{t.description}</p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
