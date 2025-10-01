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

  // ===== Top 20 por especialidad — Lote 1 =====
  // ===== Mente (Psiquiatría/Psicología) =====
  {
    id: "b0b74294-d439-4d45-9143-a2c4f8f4d7c1",
    name: "Mente — Sertralina 50–100 mg c/24 h",
    specialty: "Psiquiatría / Psicología",
    content: {
      text:
        "Sertralina 50–100 mg VO cada 24 horas. Ajustar dosis según respuesta clínica y tolerancia. Indicado para depresión y trastornos de ansiedad.",
      notes: "Controlar síntomas y efectos adversos a las 4–6 semanas.",
    },
  },
  {
    id: "a934e669-76a4-4df6-a442-140a89458d6a",
    name: "Mente — Fluoxetina 20 mg c/24 h",
    specialty: "Psiquiatría / Psicología",
    content: {
      text:
        "Fluoxetina 20 mg VO cada 24 horas. Administrar por la mañana. Primera línea para depresión mayor y trastorno de ansiedad generalizada.",
      notes: "Evaluar riesgo de interacciones (inhibidor CYP2D6).",
    },
  },
  {
    id: "50a9d8f8-29d5-45b3-9dbf-2933cbe2ef0d",
    name: "Mente — Quetiapina 25–100 mg nocte",
    specialty: "Psiquiatría / Psicología",
    content: {
      text:
        "Quetiapina 25–100 mg VO nocte. Titular según respuesta para insomnio asociado a ansiedad. Vigilar sedación y aumento de peso.",
      notes: "Control metabólico cada 3–6 meses.",
    },
  },
  {
    id: "1fe0ad32-6305-4a50-a3b1-66459a612c80",
    name: "Mente — Clonazepam 0.25–1 mg PRN",
    specialty: "Psiquiatría / Psicología",
    content: {
      text:
        "Clonazepam 0.25–1 mg VO según necesidad para crisis de ansiedad. Uso máximo 14 días. Evitar suspensión abrupta.",
      notes: "Precaución en adultos mayores y depresión respiratoria.",
    },
  },
  {
    id: "ce62118a-f864-4b7d-b4d6-73368bd64e2f",
    name: "Mente — Trazodona 50–100 mg nocte",
    specialty: "Psiquiatría / Psicología",
    content: {
      text:
        "Trazodona 50–100 mg VO nocte. Útil para insomnio asociado a depresión o ansiedad. Ajustar según respuesta y tolerancia.",
      notes: "Advertir sobre hipotensión ortostática y priapismo.",
    },
  },

  // ===== Pulso (Medicina Interna) =====
  {
    id: "e42fd32f-5d22-4a96-857d-4f0d3a1d1f90",
    name: "Pulso — Losartán 50 mg c/24 h",
    specialty: "Medicina Interna",
    content: {
      text:
        "Losartán 50 mg VO cada 24 horas. Ajustar a 100 mg si no alcanza meta tensional. Monitorizar función renal y potasio.",
      notes: "Suspender en embarazo o hiperpotasemia.",
    },
  },
  {
    id: "ef314814-efb8-4a75-84dc-8f5f2a13d910",
    name: "Pulso — Metformina 850 mg c/12 h",
    specialty: "Medicina Interna",
    content: {
      text:
        "Metformina 850 mg VO cada 12 horas con alimentos. Indicado para diabetes tipo 2. Revisar función renal antes de iniciar y periódicamente.",
      notes: "Suspender si TFG < 30 ml/min/1.73m².",
    },
  },
  {
    id: "8b274d22-94e9-4544-8655-bb6c15659950",
    name: "Pulso — Atorvastatina 20 mg nocte",
    specialty: "Medicina Interna",
    content: {
      text:
        "Atorvastatina 20 mg VO nocte. Indicada para dislipidemia o prevención cardiovascular. Ajustar según metas de LDL.",
      notes: "Controlar transaminasas al inicio y si hay síntomas musculares.",
    },
  },
  {
    id: "7263b173-c2cd-4a6c-bb5f-f1e3562092d6",
    name: "Pulso — Furosemida 20 mg c/24–48 h PRN",
    specialty: "Medicina Interna",
    content: {
      text:
        "Furosemida 20 mg VO cada 24–48 horas según edema. Ajustar de acuerdo con respuesta y peso diario.",
      notes: "Vigilar electrólitos y función renal.",
    },
  },
  {
    id: "4a6fb5bc-7bad-4d85-9142-63c02319a5f9",
    name: "Pulso — Omeprazol 20 mg c/24 h",
    specialty: "Medicina Interna",
    content: {
      text:
        "Omeprazol 20 mg VO cada 24 horas durante 4–8 semanas. Administrar en ayunas. Reevaluar necesidad tras el ciclo inicial.",
      notes: "Uso prolongado puede asociarse a hipomagnesemia y fracturas.",
    },
  },

  // ===== Equilibrio (Hábitos y estilo de vida) =====
  {
    id: "9b2fd465-9f8e-46a3-8a7f-8fe7f5e315e0",
    name: "Equilibrio — Plan de sueño",
    specialty: "Hábitos y Bienestar",
    content: {
      text:
        "Plan de sueño: objetivo 7–8 horas por noche. Implementar higiene digital (sin pantallas 60 min antes de dormir) y rutina fija de despertar y descanso.",
      notes: "Registrar horario en agenda y revisar adherencia semanal.",
    },
  },
  {
    id: "cf4c23c0-28a9-4a86-98c2-5cb1b1f912c8",
    name: "Equilibrio — Plan de ejercicio",
    specialty: "Hábitos y Bienestar",
    content: {
      text:
        "Plan de ejercicio: 150 minutos semanales de actividad aeróbica moderada + 2 sesiones de fuerza. Incluir calentamiento y enfriamiento.",
      notes: "Revaluar intensidad cada 4 semanas.",
    },
  },
  {
    id: "0d661d63-7f0f-4041-8d0e-5dc74f951a26",
    name: "Equilibrio — Plan de nutrición",
    specialty: "Hábitos y Bienestar",
    content: {
      text:
        "Plan de nutrición: aplicar plato saludable (½ vegetales, ¼ proteína, ¼ carbohidratos integrales), estrategia 80/20 y consumo de agua 2 L/día.",
      notes: "Registrar diario de alimentos y reforzar educación nutricional.",
    },
  },
  {
    id: "d6f04014-c17c-4a3f-8083-eed96ec08c07",
    name: "Equilibrio — Plan de respiración 4-7-8",
    specialty: "Hábitos y Bienestar",
    content: {
      text:
        "Plan de respiración: practicar técnica 4-7-8 durante 5–10 minutos al día. Inhalar 4 segundos, sostener 7 segundos y exhalar 8 segundos.",
      notes: "Sugerir práctica en un ambiente tranquilo, preferiblemente al despertar y antes de dormir.",
    },
  },
  {
    id: "34546cfa-8f32-44e1-8afb-fb575f5e1fe1",
    name: "Equilibrio — Plan de reducción de estrés",
    specialty: "Hábitos y Bienestar",
    content: {
      text:
        "Plan de reducción de estrés: incorporar micro-pausas conscientes tres veces al día. Realizar estiramientos suaves y respiraciones profundas.",
      notes: "Configurar recordatorios automáticos para favorecer la adherencia.",
    },
  },

  // ===== Sonrisa (Odontología) =====
  {
    id: "3df10493-4f16-4a0e-8cc2-2a3a9ab90063",
    name: "Sonrisa — Amoxicilina 500 mg c/8 h",
    specialty: "Odontología",
    content: {
      text:
        "Amoxicilina 500 mg VO cada 8 horas por 5–7 días en infecciones odontogénicas, siempre que no existan alergias a penicilinas.",
      notes: "Indicar completar el ciclo aun si hay mejoría temprana.",
    },
  },
  {
    id: "23ffbfab-eac8-4ed1-9b4d-775132f57f14",
    name: "Sonrisa — Ibuprofeno 400 mg PRN",
    specialty: "Odontología",
    content: {
      text:
        "Ibuprofeno 400 mg VO cada 8 horas según dolor dental o inflamación. Tomar después de alimentos.",
      notes: "Evitar en úlcera péptica activa o insuficiencia renal avanzada.",
    },
  },
  {
    id: "552d506a-7c02-4cc1-8e90-3aaf1406bfb9",
    name: "Sonrisa — Clorhexidina 0.12% enjuague",
    specialty: "Odontología",
    content: {
      text:
        "Clorhexidina enjuague 0.12%: utilizar 15 ml sin diluir cada 12 horas durante 7–14 días. Mantener 30 segundos y no enjuagar con agua posterior.",
      notes: "Advertir sobre posible tinción dental transitoria.",
    },
  },
  {
    id: "ee2cb2ed-bd98-49a9-8e2f-737e0f720c71",
    name: "Sonrisa — Paracetamol 1 g PRN",
    specialty: "Odontología",
    content: {
      text:
        "Paracetamol 1 g VO cada 8 horas según dolor. Máximo 3 g al día salvo indicación distinta. Compatible con lactancia.",
      notes: "Evitar exceder dosis diaria en hepatopatía.",
    },
  },
  {
    id: "0a55fba3-2f75-4ea1-9d97-4d17f0cbb2fb",
    name: "Sonrisa — Naproxeno 500/250 mg",
    specialty: "Odontología",
    content: {
      text:
        "Naproxeno 500 mg VO dosis inicial, continuar con 250 mg VO cada 8–12 horas según dolor. Administrar con alimentos.",
      notes: "Contraindicado en úlcera péptica activa o insuficiencia renal severa.",
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
