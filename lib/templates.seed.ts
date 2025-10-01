export type SeedTemplate = {
  id: string;
  name: string;
  content: {
    title: string;
    diagnosis?: string;
    notes?: string;
    items: Array<{
      drug_name: string;
      dose: string;
      route: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
  };
  is_active?: boolean;
};

export const SEED_TEMPLATES: SeedTemplate[] = [
  {
    id: "3d500560-4fde-4a46-8792-b8fcb6b10f41",
    name: "Control de hipertensión arterial",
    content: {
      title: "Seguimiento de hipertensión",
      diagnosis: "Hipertensión arterial esencial",
      notes:
        "Recordar automonitoreo de presión arterial y cita de seguimiento en 4 semanas.",
      items: [
        {
          drug_name: "Losartán 50 mg",
          dose: "1 tableta",
          route: "VO",
          frequency: "cada 12 h",
          duration: "Continuo",
          instructions: "Tomar con agua, preferentemente a la misma hora.",
        },
        {
          drug_name: "Hidroclorotiazida 25 mg",
          dose: "1/2 tableta",
          route: "VO",
          frequency: "cada 24 h",
          duration: "Continuo",
          instructions: "Administrar por la mañana para evitar nicturia.",
        },
      ],
    },
    is_active: true,
  },
  {
    id: "33a388e2-ee0d-4b0d-94ed-90fb643a397a",
    name: "Control de diabetes tipo 2",
    content: {
      title: "Plan de tratamiento para DM2",
      diagnosis: "Diabetes mellitus tipo 2 sin complicaciones",
      notes: "Monitoreo de glucosa capilar en ayunas y registro diario de valores.",
      items: [
        {
          drug_name: "Metformina 850 mg",
          dose: "1 tableta",
          route: "VO",
          frequency: "cada 12 h",
          duration: "Continuo",
          instructions: "Tomar con alimentos para reducir efectos gastrointestinales.",
        },
        {
          drug_name: "Glimepirida 2 mg",
          dose: "1 tableta",
          route: "VO",
          frequency: "cada 24 h",
          duration: "Continuo",
          instructions: "Ingerir antes del desayuno.",
        },
      ],
    },
    is_active: true,
  },
  {
    id: "a2d29c26-7ee6-4f44-8833-bc3e89765c84",
    name: "Infección respiratoria alta",
    content: {
      title: "Tratamiento sintomático de IRA",
      diagnosis: "Faringitis viral",
      notes: "Indicar reposo relativo e hidratación adecuada.",
      items: [
        {
          drug_name: "Paracetamol 500 mg",
          dose: "1 tableta",
          route: "VO",
          frequency: "cada 8 h",
          duration: "5 días",
          instructions: "No exceder 4 g al día.",
        },
        {
          drug_name: "Ibuprofeno 400 mg",
          dose: "1 tableta",
          route: "VO",
          frequency: "cada 8 h",
          duration: "5 días",
          instructions: "Tomar después de alimentos.",
        },
        {
          drug_name: "Loratadina 10 mg",
          dose: "1 tableta",
          route: "VO",
          frequency: "cada 24 h",
          duration: "7 días",
          instructions: "Evitar conducir si provoca somnolencia.",
        },
      ],
    },
    is_active: true,
  },
];
