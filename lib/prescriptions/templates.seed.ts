// lib/prescriptions/templates.seed.ts
export type SeedTemplate = {
  id: string;
  specialty: string;
  title: string;
  body: string;
};

const seeds: SeedTemplate[] = [
  {
    id: "seed-mente-1",
    specialty: "mente",
    title: "Sertralina 50 mg cada 24h",
    body: "Sertralina 50 mg VO cada 24 horas. Iniciar con 25 mg durante 7 días y aumentar a 50 mg si es bien tolerado. Reevaluar en 4 semanas.",
  },
  {
    id: "seed-pulso-1",
    specialty: "pulso",
    title: "Enalapril 10 mg cada 12h",
    body: "Enalapril 10 mg VO cada 12 horas. Control de presión arterial semanal durante el primer mes. Suspender si TAS < 100 mmHg persistente.",
  },
  {
    id: "seed-equilibrio-1",
    specialty: "equilibrio",
    title: "Meclizina 25 mg cada 8h",
    body: "Meclizina 25 mg VO cada 8 horas según vértigo. Limitar a 5 días. Evitar conducir mientras esté en tratamiento.",
  },
  {
    id: "seed-sonrisa-1",
    specialty: "sonrisa",
    title: "Clorhexidina enjuague",
    body: "Clorhexidina 0.12% enjuague bucal 15 ml dos veces al día durante 14 días. No ingerir. Evitar alimentos pigmentados inmediatamente después.",
  },
  {
    id: "seed-general-1",
    specialty: "general",
    title: "Paracetamol 500 mg cada 8h",
    body: "Paracetamol 500 mg VO cada 8 horas por 3 a 5 días. No exceder 3 g al día. Hidratación adecuada.",
  },
];

export default seeds;
