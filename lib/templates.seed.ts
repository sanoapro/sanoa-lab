// lib/prescriptions/seed-templates.ts

export type SeedTemplate =
  | {
      id: string;
      name: string;
      specialty?: string;
      is_reference?: boolean;
      is_active?: boolean;
      content: {
        /** Plantilla de texto libre (rápida) */
        text: string;
        notes?: string | null;
      };
    }
  | {
      id: string;
      name: string;
      specialty?: string;
      is_reference?: boolean;
      is_active?: boolean;
      content: {
        /** Plantilla estructurada (ítems de Rx) */
        title?: string;
        diagnosis?: string;
        notes?: string | null;
        items: Array<{
          drug_name: string;
          dose: string;
          route: string;
          frequency: string;
          duration: string;
          instructions?: string;
        }>;
      };
    };

/**
 * Nota de compatibilidad:
 * - Las plantillas “rápidas” usan content.text (fácil de imprimir o editar como bloque).
 * - Las plantillas “estructuradas” usan content.items (útil para UIs con campos separados).
 * Tu capa de persistencia puede almacenar `content` como JSON (tipo `jsonb`) sin problemas.
 */

export const SEED_TEMPLATES: SeedTemplate[] = [
  // ======= ESTRUCTURADAS (con items) – mantengo las del branch "main" =======
  {
    id: "3d500560-4fde-4a46-8792-b8fcb6b10f41",
    name: "Control de hipertensión arterial",
    specialty: "Medicina Interna",
    is_active: true,
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
  },
  {
    id: "33a388e2-ee0d-4b0d-94ed-90fb643a397a",
    name: "Control de diabetes tipo 2",
    specialty: "Medicina Interna",
    is_active: true,
    content: {
      title: "Plan de tratamiento para DM2",
      diagnosis: "Diabetes mellitus tipo 2 sin complicaciones",
      notes:
        "Monitoreo de glucosa capilar en ayunas y registro diario de valores.",
      items: [
        {
          drug_name: "Metformina 850 mg",
          dose: "1 tableta",
          route: "VO",
          frequency: "cada 12 h",
          duration: "Continuo",
          instructions:
            "Tomar con alimentos para reducir efectos gastrointestinales.",
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
  },
  {
    id: "a2d29c26-7ee6-4f44-8833-bc3e89765c84",
    name: "Infección respiratoria alta",
    specialty: "Medicina Familiar",
    is_active: true,
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
  },

  // ======= RÁPIDAS (texto libre) – integro las del branch "codex" =======
  // ===== Medicina Familiar / General =====
  {
    id: "9e2c9e5b-9a8a-4e0b-9d6a-0f2c0a01a001",
    name: "Paracetamol 500 mg VO c/8h × 3–5 días",
    specialty: "Medicina Familiar",
    content: {
      text: "Paracetamol 500 mg VO cada 8 horas por 3 a 5 días. No exceder 3 g/día.",
      notes: "Evitar en hepatopatía severa.",
    },
  },
  {
    id: "9e2c9e5b-9a8a-4e0b-9d6a-0f2c0a01a002",
    name: "Ibuprofeno 400 mg VO c/8h PRN dolor",
    specialty: "Medicina Familiar",
    content: {
      text: "Ibuprofeno 400 mg VO cada 8 horas según dolor, por 3–5 días con alimento.",
      notes: "Precaución en gastritis/úlcera; evitar en ERC avanzada.",
    },
  },
  {
    id: "9e2c9e5b-9a8a-4e0b-9d6a-0f2c0a01a003",
    name: "Amoxicilina 500 mg VO c/8h × 7 días",
    specialty: "Medicina Familiar",
    content: {
      text: "Amoxicilina 500 mg VO cada 8 horas por 7 días.",
      notes: "Verificar alergia a penicilinas.",
    },
  },
  {
    id: "9e2c9e5b-9a8a-4e0b-9d6a-0f2c0a01a004",
    name: "Amoxi/Clav 875/125 mg VO c/12h × 7 días",
    specialty: "Medicina Familiar",
    content: {
      text: "Amoxi/Clav 875/125 mg VO cada 12 horas por 7 días.",
      notes: "Tomar con alimentos; vigilar diarrea.",
    },
  },
  {
    id: "9e2c9e5b-9a8a-4e0b-9d6a-0f2c0a01a005",
    name: "Loratadina 10 mg VO cada 24 h",
    specialty: "Medicina Familiar",
    content: {
      text: "Loratadina 10 mg VO cada 24 horas por 7–14 días.",
      notes: "Alternativa: Cetirizina 10 mg VO cada 24 h.",
    },
  },

  // ===== Medicina Interna =====
  {
    id: "b3c6b103-1c49-4e9e-b5a1-1b1a0a01b001",
    name: "Metformina 850 mg VO c/12h con alimentos",
    specialty: "Medicina Interna",
    content: {
      text: "Metformina 850 mg VO cada 12 horas, iniciar con 850 mg/día y titular.",
      notes: "Suspender si TFG < 30 mL/min/1.73m².",
    },
  },
  {
    id: "b3c6b103-1c49-4e9e-b5a1-1b1a0a01b002",
    name: "Losartán 50 mg VO cada 24 h",
    specialty: "Medicina Interna",
    content: {
      text: "Losartán 50 mg VO cada 24 horas; ajustar a TA objetivo.",
      notes: "Control TA y función renal/potasio.",
    },
  },
  {
    id: "b3c6b103-1c49-4e9e-b5a1-1b1a0a01b003",
    name: "Atorvastatina 20 mg VO nocte",
    specialty: "Medicina Interna",
    content: {
      text: "Atorvastatina 20 mg VO por la noche.",
      notes: "Control de PFH a 6–8 semanas, vigilar mialgias.",
    },
  },
  {
    id: "b3c6b103-1c49-4e9e-b5a1-1b1a0a01b004",
    name: "Omeprazol 20 mg VO cada 24 h × 4–8 semanas",
    specialty: "Medicina Interna",
    content: {
      text: "Omeprazol 20 mg VO cada 24 horas antes del desayuno; curso 4–8 semanas.",
      notes: "Revaluar necesidad en uso crónico.",
    },
  },

  // ===== Pediatría =====
  {
    id: "c6a4b2f9-0a12-4f3f-9b7d-2a2c0a01c001",
    name: "Paracetamol 10–15 mg/kg/dosis VO c/6–8h",
    specialty: "Pediatría",
    content: {
      text: "Paracetamol 10–15 mg/kg/dosis VO cada 6–8 horas, máx 60 mg/kg/día.",
      notes: "Calcular por peso actual.",
    },
  },
  {
    id: "c6a4b2f9-0a12-4f3f-9b7d-2a2c0a01c002",
    name: "Amoxicilina 80–90 mg/kg/día dividido c/8–12h × 7–10 días",
    specialty: "Pediatría",
    content: {
      text: "Amoxicilina 80–90 mg/kg/día VO dividido cada 8–12 horas por 7–10 días.",
      notes: "Otitis/sinusitis: usar dosis altas.",
    },
  },

  // ===== Ginecología =====
  {
    id: "d7e5f8a1-3b24-4a7f-9c3d-3a3c0a01d001",
    name: "Ácido fólico 0.4 mg VO cada 24 h",
    specialty: "Ginecología",
    content: {
      text: "Ácido fólico 0.4 mg VO cada 24 horas.",
      notes: "Si antecedente de DTN: 4 mg/día.",
    },
  },
  {
    id: "d7e5f8a1-3b24-4a7f-9c3d-3a3c0a01d002",
    name: "Nitrofurantoína 100 mg VO c/12h × 5 días (cistitis)",
    specialty: "Ginecología",
    content: {
      text: "Nitrofurantoína 100 mg VO cada 12 horas por 5 días.",
      notes:
        "Evitar en T3 embarazo o TFG baja; alternativa: Fosfomicina 3 g dosis única.",
    },
  },

  // ===== Psiquiatría =====
  {
    id: "e8f9a0b2-4c35-4b8f-9d4e-4a4d0a01e001",
    name: "Sertralina 50 mg VO cada 24 h (iniciar 25 mg/día × 1 sem)",
    specialty: "Psiquiatría",
    content: {
      text: "Sertralina 25 mg/día VO por 7 días, luego 50 mg/día; titular según respuesta.",
      notes: "Monitorear ansiedad inicial, ideación.",
    },
  },
  {
    id: "e8f9a0b2-4c35-4b8f-9d4e-4a4d0a01e002",
    name: "Quetiapina 25–50 mg VO nocte (insomnio asociado)",
    specialty: "Psiquiatría",
    content: {
      text: "Quetiapina 25–50 mg VO por la noche; ajustar a respuesta.",
      notes: "Vigilar sedación, metabólico.",
    },
  },

  // ===== Cardiología =====
  {
    id: "fa0b1c23-5d46-4c9f-9e5f-5a5e0a01f001",
    name: "Bisoprolol 2.5–5 mg VO cada 24 h",
    specialty: "Cardiología",
    content: {
      text: "Bisoprolol 2.5–5 mg VO cada 24 h; titular a FC/TA objetivo.",
      notes: "Precaución asma/BCO.",
    },
  },
  {
    id: "fa0b1c23-5d46-4c9f-9e5f-5a5e0a01f002",
    name: "AAS 81 mg VO cada 24 h (prevención secundaria)",
    specialty: "Cardiología",
    content: {
      text: "Ácido acetilsalicílico 81 mg VO cada 24 h.",
      notes: "Valorar sangrado GI; PPI si riesgo.",
    },
  },

  // ===== Neumología =====
  {
    id: "0b1c2d34-6e57-4daf-9f6e-6b6e0a010001",
    name: "Salbutamol inhalador 2 puffs c/4–6h PRN",
    specialty: "Neumología",
    content: {
      text: "Salbutamol MDI: 2 inhalaciones cada 4–6 h según síntomas.",
      notes: "Técnica con aerochamber; plan de acción.",
    },
  },
  {
    id: "0b1c2d34-6e57-4daf-9f6e-6b6e0a010002",
    name: "Budesonida 200 mcg 1–2 puffs c/12h (control)",
    specialty: "Neumología",
    content: {
      text: "Budesonida 200 mcg: 1–2 inhalaciones cada 12 h.",
      notes: "Enjuague bucal post-uso.",
    },
  },

  // ===== Odontología =====
  {
    id: "1c2d3e45-7f68-4eb0-9f7f-7c7f0a010001",
    name: "Amoxicilina 500 mg VO c/8h × 5–7 días (infección dental)",
    specialty: "Odontología",
    content: {
      text: "Amoxicilina 500 mg VO cada 8 horas por 5–7 días.",
      notes: "Si alergia: Clindamicina 300 mg c/8h × 5–7 días.",
    },
  },
  {
    id: "1c2d3e45-7f68-4eb0-9f7f-7c7f0a010002",
    name: "Ibuprofeno 600 mg VO c/8h × 3 días (dolor post-procedimiento)",
    specialty: "Odontología",
    content: {
      text: "Ibuprofeno 600 mg VO cada 8 horas por 3 días con alimento.",
      notes: "Proteger estómago si riesgo GI.",
    },
  },

  // ===== Dermatología =====
  {
    id: "2d3e4f56-8079-4fc1-9f80-8d8f0a010001",
    name: "Hidrocortisona 1% tópica BID × 5–7 días",
    specialty: "Dermatología",
    content: {
      text:
        "Hidrocortisona 1% crema: aplicar capa fina 2 veces al día 5–7 días.",
      notes: "No usar en piel rota/infección.",
    },
  },
  {
    id: "2d3e4f56-8079-4fc1-9f80-8d8f0a010002",
    name: "Clotrimazol 1% tópica BID × 2–4 semanas",
    specialty: "Dermatología",
    content: {
      text:
        "Clotrimazol 1% crema: aplicar 2 veces/día por 2–4 semanas.",
      notes: "Continuar 1 semana tras remisión.",
    },
  },

  // ===== Referencias (no receta) =====
  {
    id: "4e5f6071-928a-40d2-9f91-9e9f0a010001",
    name: "Referencia a Cardiología – sospecha HVI",
    specialty: "Medicina Familiar",
    is_reference: true,
    content: {
      text:
        "Paciente con HTA de difícil control y signos de HVI en ECG. Solicito valoración.",
      notes: null,
    },
  },
  {
    id: "4e5f6071-928a-40d2-9f91-9e9f0a010002",
    name: "Referencia a Psiquiatría – depresión moderada",
    specialty: "Medicina Familiar",
    is_reference: true,
    content: {
      text:
        "Paciente con PHQ-9 moderado, respuesta parcial a ISRS. Solicito co-manejo.",
      notes: null,
    },
  },
];
