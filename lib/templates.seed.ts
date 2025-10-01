export type RxTemplate = {
  specialty: string;
  title: string;
  body: string;
  notes?: string | null;
  is_reference?: boolean;
};

export const SEED_TEMPLATES: RxTemplate[] = [
  // ===== Medicina Familiar / General =====
  {
    specialty: "Medicina Familiar",
    title: "💊 Paracetamol 500 mg VO c/8h × 3–5 días",
    body: "Paracetamol 500 mg VO cada 8 horas por 3 a 5 días. No exceder 3 g/día.",
    notes: "Evitar en hepatopatía severa.",
  },
  {
    specialty: "Medicina Familiar",
    title: "💊 Ibuprofeno 400 mg VO c/8h PRN dolor",
    body: "Ibuprofeno 400 mg VO cada 8 horas según dolor, por 3–5 días con alimento.",
    notes: "Precaución en gastritis/úlcera; evitar en ERC avanzada.",
  },
  {
    specialty: "Medicina Familiar",
    title: "💊 Amoxicilina 500 mg VO c/8h × 7 días",
    body: "Amoxicilina 500 mg VO cada 8 horas por 7 días.",
    notes: "Verificar alergia a penicilinas.",
  },
  {
    specialty: "Medicina Familiar",
    title: "💊 Amoxicilina/Ácido clavulánico 875/125 mg VO c/12h × 7 días",
    body: "Amoxi/Clav 875/125 mg VO cada 12 horas por 7 días.",
    notes: "Tomar con alimentos; vigilar diarrea.",
  },
  {
    specialty: "Medicina Familiar",
    title: "💊 Loratadina 10 mg VO cada 24 h",
    body: "Loratadina 10 mg VO cada 24 horas por 7–14 días.",
    notes: "Alternativa: Cetirizina 10 mg VO cada 24 h.",
  },

  // ===== Medicina Interna =====
  {
    specialty: "Medicina Interna",
    title: "💊 Metformina 850 mg VO c/12h con alimentos",
    body: "Metformina 850 mg VO cada 12 horas, iniciar con 850 mg/día y titular.",
    notes: "Suspender si TFG < 30 mL/min/1.73m².",
  },
  {
    specialty: "Medicina Interna",
    title: "💊 Losartán 50 mg VO cada 24 h",
    body: "Losartán 50 mg VO cada 24 horas; ajustar a TA objetivo.",
    notes: "Control TA y función renal/potasio.",
  },
  {
    specialty: "Medicina Interna",
    title: "💊 Atorvastatina 20 mg VO nocte",
    body: "Atorvastatina 20 mg VO por la noche.",
    notes: "Control de PFH a 6–8 semanas, vigilar mialgias.",
  },
  {
    specialty: "Medicina Interna",
    title: "💊 Omeprazol 20 mg VO cada 24 h × 4–8 semanas",
    body: "Omeprazol 20 mg VO cada 24 horas antes del desayuno; curso 4–8 semanas.",
    notes: "Revaluar necesidad en uso crónico.",
  },

  // ===== Pediatría =====
  {
    specialty: "Pediatría",
    title: "💊 Paracetamol 10–15 mg/kg/dosis VO c/6–8h",
    body: "Paracetamol 10–15 mg/kg/dosis VO cada 6–8 horas, máx 60 mg/kg/día.",
    notes: "Calcular por peso actual.",
  },
  {
    specialty: "Pediatría",
    title: "💊 Amoxicilina 80–90 mg/kg/día dividido c/8–12h × 7–10 días",
    body: "Amoxicilina 80–90 mg/kg/día VO dividido cada 8–12 horas por 7–10 días.",
    notes: "Otitis/sinusitis: usar dosis altas.",
  },

  // ===== Ginecología =====
  {
    specialty: "Ginecología",
    title: "💊 Ácido fólico 0.4 mg VO cada 24 h (preconcepción/1er trimestre)",
    body: "Ácido fólico 0.4 mg VO cada 24 horas.",
    notes: "Si antecedente de DTN: 4 mg/día.",
  },
  {
    specialty: "Ginecología",
    title: "💊 Nitrofurantoína 100 mg VO c/12h × 5 días (cistitis)",
    body: "Nitrofurantoína 100 mg VO cada 12 horas por 5 días.",
    notes: "Evitar en T3 embarazo o TFG baja; alternativa: Fosfomicina 3 g dosis única.",
  },

  // ===== Psiquiatría =====
  {
    specialty: "Psiquiatría",
    title: "💊 Sertralina 50 mg VO cada 24 h (iniciar 25 mg/día × 1 sem)",
    body: "Sertralina 25 mg/día VO por 7 días, luego 50 mg/día; titular según respuesta.",
    notes: "Monitorear ansiedad inicial, ideación.",
  },
  {
    specialty: "Psiquiatría",
    title: "💊 Quetiapina 25–50 mg VO nocte (insomnio asociado)",
    body: "Quetiapina 25–50 mg VO por la noche; ajustar a respuesta.",
    notes: "Vigilar sedación, metabólico.",
  },

  // ===== Cardiología =====
  {
    specialty: "Cardiología",
    title: "💊 Bisoprolol 2.5–5 mg VO cada 24 h",
    body: "Bisoprolol 2.5–5 mg VO cada 24 h; titular a FC/TA objetivo.",
    notes: "Precaución asma/BCO.",
  },
  {
    specialty: "Cardiología",
    title: "💊 AAS 81 mg VO cada 24 h (prevención secundaria)",
    body: "Ácido acetilsalicílico 81 mg VO cada 24 h.",
    notes: "Valorar sangrado GI; PPI si riesgo.",
  },

  // ===== Neumología =====
  {
    specialty: "Neumología",
    title: "💊 Salbutamol inhalador 2 puffs c/4–6h PRN",
    body: "Salbutamol MDI: 2 inhalaciones cada 4–6 h según síntomas.",
    notes: "Técnica con aerochamber; plan de acción.",
  },
  {
    specialty: "Neumología",
    title: "💊 Budesonida 200 mcg 1–2 puffs c/12h (control)",
    body: "Budesonida 200 mcg: 1–2 inhalaciones cada 12 h.",
    notes: "Enjuague bucal post-uso.",
  },

  // ===== Odontología =====
  {
    specialty: "Odontología",
    title: "💊 Amoxicilina 500 mg VO c/8h × 5–7 días (infección dental)",
    body: "Amoxicilina 500 mg VO cada 8 horas por 5–7 días.",
    notes: "Si alergia: Clindamicina 300 mg c/8h × 5–7 días.",
  },
  {
    specialty: "Odontología",
    title: "💊 Ibuprofeno 600 mg VO c/8h × 3 días (dolor post-procedimiento)",
    body: "Ibuprofeno 600 mg VO cada 8 horas por 3 días con alimento.",
    notes: "Proteger estómago si riesgo GI.",
  },

  // ===== Dermatología =====
  {
    specialty: "Dermatología",
    title: "💊 Hidrocortisona 1% tópica BID × 5–7 días",
    body: "Hidrocortisona 1% crema: aplicar capa fina 2 veces al día 5–7 días.",
    notes: "No usar en piel rota/infección.",
  },
  {
    specialty: "Dermatología",
    title: "💊 Clotrimazol 1% tópica BID × 2–4 semanas",
    body: "Clotrimazol 1% crema: aplicar 2 veces/día por 2–4 semanas.",
    notes: "Continuar 1 semana tras remisión.",
  },

  // ===== Referencias (no receta) =====
  {
    specialty: "Medicina Familiar",
    title: "📝 Referencia a Cardiología – sospecha HVI",
    body: "Paciente con HTA de difícil control y signos de HVI en ECG. Solicito valoración.",
    is_reference: true,
  },
  {
    specialty: "Medicina Familiar",
    title: "📝 Referencia a Psiquiatría – depresión moderada",
    body: "Paciente con PHQ-9 moderado, respuesta parcial a ISRS. Solicito co-manejo.",
    is_reference: true,
  },
];
