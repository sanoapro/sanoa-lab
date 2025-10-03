import type { PrescriptionTemplateContent } from "@/lib/prescriptions/templates";
import type { ReferralTemplateContent } from "@/lib/referrals/templates";

type BaseTemplate = {
  slug: string;
  name: string;
  specialty: string;
  summary: string;
};

type PrescriptionCatalogItem = BaseTemplate & {
  type: "prescription";
  content: PrescriptionTemplateContent;
};

type ReferralCatalogItem = BaseTemplate & {
  type: "referral";
  content: ReferralTemplateContent;
};

export type CatalogTemplate = PrescriptionCatalogItem | ReferralCatalogItem;

export const CATALOG_TEMPLATES: CatalogTemplate[] = [
  {
    type: "prescription",
    slug: "cardiologia-hta-control",
    name: "Control de hipertensión arterial",
    specialty: "Cardiología",
    summary: "Ajuste antihipertensivo en paciente estable",
    content: {
      meta: { specialty: "Cardiología", summary: "Plan de control para hipertensión esencial" },
      notes: "Control tensional domiciliario y seguimiento en 4 semanas.",
      items: [
        {
          drug: "Losartán",
          dose: "50 mg",
          route: "VO",
          frequency: "Cada 12 h",
          duration: "30 días",
          instructions: "Tomar siempre a la misma hora.",
        },
        {
          drug: "Hidroclorotiazida",
          dose: "25 mg",
          route: "VO",
          frequency: "Cada 24 h",
          duration: "30 días",
          instructions: "Administrar por la mañana.",
        },
      ],
    },
  },
  {
    type: "prescription",
    slug: "cardiologia-insuficiencia-cardiaca",
    name: "Insuficiencia cardiaca estable",
    specialty: "Cardiología",
    summary: "Triple terapia guiada por guías",
    content: {
      meta: { specialty: "Cardiología", summary: "Bloqueo neurohormonal en IC clase II" },
      notes: "Ajustar dosis según tolerancia y creatinina. Laboratorio en 15 días.",
      items: [
        {
          drug: "Sacubitril/Valsartán",
          dose: "49/51 mg",
          route: "VO",
          frequency: "Cada 12 h",
          duration: "30 días",
        },
        {
          drug: "Carvedilol",
          dose: "12.5 mg",
          route: "VO",
          frequency: "Cada 12 h",
          duration: "30 días",
        },
        {
          drug: "Espironolactona",
          dose: "25 mg",
          route: "VO",
          frequency: "Cada 24 h",
          duration: "30 días",
        },
      ],
    },
  },
  {
    type: "prescription",
    slug: "medicina-interna-dm2-debut",
    name: "Diabetes tipo 2 – inicio de manejo",
    specialty: "Medicina Interna",
    summary: "Metformina + educación inicial",
    content: {
      meta: { specialty: "Medicina Interna", summary: "Inicio metformina en paciente con HbA1c < 9%" },
      notes: "Educación nutricional y plan de actividad física moderada. Control en 6 semanas.",
      items: [
        {
          drug: "Metformina liberación prolongada",
          dose: "500 mg",
          route: "VO",
          frequency: "Con cena",
          duration: "14 días",
          instructions: "Luego aumentar a 1000 mg con cena si se tolera.",
        },
      ],
    },
  },
  {
    type: "prescription",
    slug: "medicina-interna-hospital-post-covid",
    name: "Seguimiento post COVID moderado",
    specialty: "Medicina Interna",
    summary: "Rehabilitación respiratoria y soporte",
    content: {
      meta: { specialty: "Medicina Interna", summary: "Plan de soporte post egreso" },
      notes: "Reforzar ejercicios de expansión torácica y controlar saturación domiciliaria.",
      items: [
        {
          drug: "Budesonida/Formoterol inhalador",
          dose: "160/4.5 mcg",
          route: "Inhalado",
          frequency: "2 inhalaciones cada 12 h",
          duration: "30 días",
        },
        {
          drug: "Vitamina D3",
          dose: "4000 UI",
          route: "VO",
          frequency: "Cada 24 h",
          duration: "30 días",
        },
      ],
    },
  },
  {
    type: "prescription",
    slug: "neumologia-eacp-exacerbacion",
    name: "EPOC estable tras exacerbación",
    specialty: "Neumología",
    summary: "Triple terapia inhalada",
    content: {
      meta: { specialty: "Neumología", summary: "Control de síntomas post exacerbación" },
      notes: "Control en 4 semanas con espirometría si es posible.",
      items: [
        {
          drug: "Fluticasona/Umeclidinio/Vilanterol",
          dose: "100/62.5/25 mcg",
          route: "Inhalado",
          frequency: "1 inhalación cada 24 h",
          duration: "60 días",
        },
        {
          drug: "N-acetilcisteína",
          dose: "600 mg",
          route: "VO",
          frequency: "Cada 12 h",
          duration: "30 días",
        },
      ],
    },
  },
  {
    type: "prescription",
    slug: "pediatria-infeccion-respiratoria",
    name: "Infección respiratoria alta – pediatría",
    specialty: "Pediatría",
    summary: "Manejo sintomático y educación",
    content: {
      meta: { specialty: "Pediatría", summary: "Cuadro viral autolimitado" },
      notes: "Control si fiebre > 72 h o signos de dificultad respiratoria.",
      items: [
        {
          drug: "Paracetamol suspensión",
          dose: "15 mg/kg",
          route: "VO",
          frequency: "Cada 6 h PRN",
          duration: "5 días",
          instructions: "No exceder 4 dosis en 24 h.",
        },
        {
          drug: "Solución salina nasal",
          dose: "2-3 gotas",
          route: "Nasal",
          frequency: "Cada 4 h PRN",
          duration: "5 días",
        },
      ],
    },
  },
  {
    type: "prescription",
    slug: "pediatria-crup-leve",
    name: "Crup leve ambulatorio",
    specialty: "Pediatría",
    summary: "Dexametasona + humidificación",
    content: {
      meta: { specialty: "Pediatría", summary: "Paciente con escala Westley < 3" },
      notes: "Indicar signos de alarma y control telefónico en 24 h.",
      items: [
        {
          drug: "Dexametasona oral",
          dose: "0.6 mg/kg (máx 10 mg)",
          route: "VO",
          frequency: "Dosis única",
          duration: "1 día",
        },
        {
          drug: "Budesonida nebulizada",
          dose: "2 mg",
          route: "Nebulización",
          frequency: "Cada 12 h",
          duration: "48 h",
        },
      ],
    },
  },
  {
    type: "prescription",
    slug: "gineco-anticoncepcion-postparto",
    name: "Anticoncepción postparto",
    specialty: "Ginecología",
    summary: "Método progestágeno exclusivo",
    content: {
      meta: { specialty: "Ginecología", summary: "Paciente lactante a las 6 semanas" },
      notes: "Consejería en lactancia y signos de trombosis.",
      items: [
        {
          drug: "Desogestrel",
          dose: "75 mcg",
          route: "VO",
          frequency: "Cada 24 h",
          duration: "3 meses",
          instructions: "Tomar a la misma hora todos los días.",
        },
      ],
    },
  },
  {
    type: "prescription",
    slug: "gineco-sop-metabolico",
    name: "Síndrome de ovario poliquístico",
    specialty: "Endocrinología",
    summary: "Metformina + cambios de estilo de vida",
    content: {
      meta: { specialty: "Endocrinología", summary: "Manejo metabólico inicial" },
      notes: "Plan de reducción de peso gradual y control en 3 meses.",
      items: [
        {
          drug: "Metformina",
          dose: "850 mg",
          route: "VO",
          frequency: "Cada 12 h",
          duration: "90 días",
        },
        {
          drug: "Ácido fólico",
          dose: "5 mg",
          route: "VO",
          frequency: "Cada 24 h",
          duration: "90 días",
        },
      ],
    },
  },
  {
    type: "prescription",
    slug: "dermatologia-acne-moderado",
    name: "Acné inflamatorio moderado",
    specialty: "Dermatología",
    summary: "Retinoide tópico + antibiótico",
    content: {
      meta: { specialty: "Dermatología", summary: "Manejo combinado por 12 semanas" },
      notes: "Educar sobre fotoprotección y posibles irritaciones iniciales.",
      items: [
        {
          drug: "Adapaleno gel",
          dose: "Aplicar capa fina",
          route: "Tópico",
          frequency: "Noche",
          duration: "12 semanas",
        },
        {
          drug: "Peróxido de benzoilo",
          dose: "2.5%",
          route: "Tópico",
          frequency: "Mañana",
          duration: "12 semanas",
        },
        {
          drug: "Doxiciclina",
          dose: "100 mg",
          route: "VO",
          frequency: "Cada 24 h",
          duration: "8 semanas",
          instructions: "Tomar con abundante agua y evitar exposición solar directa.",
        },
      ],
    },
  },
  {
    type: "prescription",
    slug: "reumatologia-artritis-flare",
    name: "Artritis reumatoide – brote",
    specialty: "Reumatología",
    summary: "Corticoide puente + DMARD",
    content: {
      meta: { specialty: "Reumatología", summary: "Control de brote moderado" },
      notes: "Solicitar VSG, PCR y perfil hepático en 4 semanas.",
      items: [
        {
          drug: "Prednisona",
          dose: "10 mg",
          route: "VO",
          frequency: "Cada 24 h",
          duration: "14 días",
          instructions: "Reducir 2.5 mg cada 5 días según respuesta.",
        },
        {
          drug: "Metotrexato",
          dose: "15 mg",
          route: "VO",
          frequency: "1 vez por semana",
          duration: "12 semanas",
          instructions: "Administrar con 5 mg de ácido fólico al día siguiente.",
        },
      ],
    },
  },
  {
    type: "prescription",
    slug: "geriatria-fragilidad",
    name: "Síndrome de fragilidad",
    specialty: "Geriatría",
    summary: "Suplementos y prevención de caídas",
    content: {
      meta: { specialty: "Geriatría", summary: "Plan integral para fragilidad leve" },
      notes: "Recomendar programa de ejercicio supervisado y revisión de domicilio.",
      items: [
        {
          drug: "Vitamina D3",
          dose: "2000 UI",
          route: "VO",
          frequency: "Cada 24 h",
          duration: "90 días",
        },
        {
          drug: "Calcio elemental",
          dose: "600 mg",
          route: "VO",
          frequency: "Cada 12 h",
          duration: "90 días",
        },
        {
          drug: "Proteína en polvo",
          dose: "20 g",
          route: "VO",
          frequency: "Post ejercicio",
          duration: "90 días",
        },
      ],
    },
  },
  {
    type: "prescription",
    slug: "medicina-familiar-embarazo-sintomatico",
    name: "Síntomas digestivos en embarazo",
    specialty: "Medicina Familiar",
    summary: "Antiácidos y medidas higiénicas",
    content: {
      meta: { specialty: "Medicina Familiar", summary: "Ardor leve en segundo trimestre" },
      notes: "Reforzar medidas dietéticas y signos de alarma obstétrica.",
      items: [
        {
          drug: "Carbonato de calcio + magnesio",
          dose: "1 tableta",
          route: "VO",
          frequency: "Cada 8 h PRN",
          duration: "14 días",
        },
        {
          drug: "Doxilamina/Piridoxina",
          dose: "10/10 mg",
          route: "VO",
          frequency: "Cada 12 h",
          duration: "14 días",
        },
      ],
    },
  },
  // Referral templates
  {
    type: "referral",
    slug: "cardiologia-evaluacion-preoperatoria",
    name: "Evaluación preoperatoria cardiológica",
    specialty: "Cardiología",
    summary: "Valoración prequirúrgica paciente con factores de riesgo",
    content: {
      meta: { specialty: "Cardiología", summary: "Evaluación de riesgo cardiovascular" },
      to_specialty: "Cardiología",
      to_doctor_name: "Equipo de evaluación preoperatoria",
      reason: "Paciente con antecedente de hipertensión y diabetes que requiere valoración de riesgo previo a cirugía abdominal.",
      summary:
        "Control adecuado de cifras tensionales. No presenta angina ni disnea de esfuerzo. Electrocardiograma basal con cambios inespecíficos de repolarización.",
      plan:
        "Solicito valoración integral para definir necesidad de pruebas complementarias y optimizar manejo perioperatorio.",
    },
  },
  {
    type: "referral",
    slug: "neumologia-polisonografia",
    name: "Referencia a neumología – sospecha de SAHOS",
    specialty: "Neumología",
    summary: "Paciente con ronquido y somnolencia diurna",
    content: {
      meta: { specialty: "Neumología", summary: "Tamizaje positivo de apnea obstructiva" },
      to_specialty: "Neumología del sueño",
      to_doctor_name: "Clínica de trastornos del sueño",
      reason: "Ronquido intenso, pausas respiratorias observadas por la pareja y somnolencia diurna (Epworth 14).",
      summary:
        "IMC 31 kg/m², circunferencia de cuello 42 cm. HTA controlada. No antecedentes de insuficiencia cardiaca.",
      plan: "Solicito estudio de sueño y recomendaciones terapéuticas.",
    },
  },
  {
    type: "referral",
    slug: "endocrinologia-tiroides-nodulo",
    name: "Evaluación endocrinología – nódulo tiroideo",
    specialty: "Endocrinología",
    summary: "Paciente con nódulo TI-RADS 4",
    content: {
      meta: { specialty: "Endocrinología", summary: "Estudio citológico de tiroides" },
      to_specialty: "Endocrinología",
      to_doctor_name: "Consulta de tiroides",
      reason: "Ultrasonido detecta nódulo hipoecoico de 1.8 cm con bordes irregulares.",
      summary:
        "TSH dentro de rango. Sin antecedente familiar de cáncer tiroideo. No disfonía ni disfagia.",
      plan: "Solicito valoración para biopsia por aspiración y plan de seguimiento.",
    },
  },
  {
    type: "referral",
    slug: "neurologia-epilepsia-control",
    name: "Control de epilepsia",
    specialty: "Neurología",
    summary: "Paciente con crisis focales persistentes",
    content: {
      meta: { specialty: "Neurología", summary: "Ajuste de esquema antiepiléptico" },
      to_specialty: "Neurología",
      to_doctor_name: "Clínica de epilepsia",
      reason: "Dos crisis focales en el último mes pese a adherencia a tratamiento.",
      summary:
        "Actualmente en levetiracetam 1000 mg cada 12 h. Resonancia 2023 sin cambios. EEG con descargas temporales derechas.",
      plan: "Solicito ajuste terapéutico y evaluación de necesidad de estudios adicionales.",
    },
  },
  {
    type: "referral",
    slug: "traumatologia-rodilla-atleta",
    name: "Lesión meniscal en deportista",
    specialty: "Traumatología",
    summary: "Dolor de rodilla y bloqueo mecánico",
    content: {
      meta: { specialty: "Traumatología", summary: "Evaluación artroscópica" },
      to_specialty: "Traumatología deportiva",
      to_doctor_name: "Dr. Martínez",
      reason: "Paciente con dolor medial y bloqueo tras actividad de alto impacto.",
      summary:
        "RM reporta desgarro menisco medial grado III. No inestabilidad ligamentaria. Fisioterapia 6 semanas sin mejoría.",
      plan: "Solicito valoración quirúrgica y recomendaciones de rehabilitación.",
    },
  },
  {
    type: "referral",
    slug: "psiquiatria-depresion-resistente",
    name: "Depresión con respuesta parcial",
    specialty: "Psiquiatría",
    summary: "Seguimiento especializado por síntomas residuales",
    content: {
      meta: { specialty: "Psiquiatría", summary: "Optimización farmacológica" },
      to_specialty: "Psiquiatría",
      to_doctor_name: "Programa de trastornos del ánimo",
      reason: "Persisten síntomas depresivos pese a sertralina 100 mg/día y psicoterapia.",
      summary:
        "PHQ-9 actual 15. Niega ideación suicida. Buen soporte familiar. No consumo de sustancias.",
      plan: "Solicito evaluación para potencial augmentación y seguimiento conjunto.",
    },
  },
  {
    type: "referral",
    slug: "rehabilitacion-ictus-cronico",
    name: "Rehabilitación post ictus",
    specialty: "Medicina Física y Rehabilitación",
    summary: "Déficit motor residual a los 3 meses",
    content: {
      meta: { specialty: "Rehabilitación", summary: "Plan intensivo de fisioterapia" },
      to_specialty: "Rehabilitación neurológica",
      to_doctor_name: "Equipo interdisciplinario",
      reason: "Hemiparesia derecha y espasticidad braquial tras ACV isquémico.",
      summary:
        "Escala de Rankin modificada 3. Independiente para actividades básicas con ayuda parcial.",
      plan: "Solicito programa integral de fisioterapia, terapia ocupacional y fonoaudiología.",
    },
  },
  {
    type: "referral",
    slug: "gineco-oncologia-lesion-cervical",
    name: "Lesión cervical HSIL",
    specialty: "Ginecología Oncológica",
    summary: "Paciente con colposcopia sugestiva",
    content: {
      meta: { specialty: "Ginecología Oncológica", summary: "Evaluación para conización" },
      to_specialty: "Ginecología oncológica",
      to_doctor_name: "Unidad de patología cervical",
      reason: "Citología con HSIL y biopsia dirigida que confirma NIC 3.",
      summary:
        "Paciente de 34 años, G1P1, sin deseo reproductivo inmediato. VIH negativo.",
      plan: "Solicito valoración para tratamiento quirúrgico y seguimiento oncológico.",
    },
  },
  {
    type: "referral",
    slug: "nefrologia-proteinuria",
    name: "Proteinuria persistente",
    specialty: "Nefrología",
    summary: "Diabético con deterioro renal progresivo",
    content: {
      meta: { specialty: "Nefrología", summary: "Evaluación nefroprotección" },
      to_specialty: "Nefrología",
      to_doctor_name: "Clínica de enfermedad renal crónica",
      reason: "Proteinuria 1.2 g/24h pese a inhibidor SGLT2 y ARA II.",
      summary:
        "TFG 48 ml/min/1.73m². HbA1c 7.2%. Hipertensión controlada con tres fármacos.",
      plan: "Solicito valoración para optimización terapéutica y estudio etiológico.",
    },
  },
  {
    type: "referral",
    slug: "oftalmologia-diabetes-tamiz",
    name: "Tamizaje de retinopatía diabética",
    specialty: "Oftalmología",
    summary: "Paciente con 10 años de evolución de DM2",
    content: {
      meta: { specialty: "Oftalmología", summary: "Prevención de complicaciones visuales" },
      to_specialty: "Oftalmología",
      to_doctor_name: "Programa de retina",
      reason: "Necesita control anual de fondo de ojo.",
      summary:
        "Glucemias en ayunas 110-130 mg/dl. HTA controlada. Sin síntomas visuales actuales.",
      plan: "Solicito evaluación oftalmológica y registro fotográfico de retina.",
    },
  },
  {
    type: "referral",
    slug: "hematologia-anemia-ferropenica",
    name: "Anemia ferropénica refractaria",
    specialty: "Hematología",
    summary: "Paciente con intolerancia a hierro oral",
    content: {
      meta: { specialty: "Hematología", summary: "Considerar hierro intravenoso" },
      to_specialty: "Hematología",
      to_doctor_name: "Clínica de anemia",
      reason: "Persistencia de Hb 9 g/dl y ferritina 8 ng/ml pese a 3 meses de hierro oral.",
      summary:
        "Endoscopia alta sin hallazgos. Colonoscopia pendiente. No signos de hemorragia activa.",
      plan: "Solicito valoración para infusión de hierro y estudio adicional.",
    },
  },
  {
    type: "referral",
    slug: "urologia-hiperplasia-prostatica",
    name: "Hiperplasia prostática sintomática",
    specialty: "Urología",
    summary: "Paciente con IPSS severo pese a tratamiento médico",
    content: {
      meta: { specialty: "Urología", summary: "Evaluación intervencionista" },
      to_specialty: "Urología",
      to_doctor_name: "Dr. López",
      reason: "Síntomas urinarios moderados-severos con tamsulosina y dutasteride.",
      summary:
        "Próstata 65 g en ultrasonido, PSA 3.2 ng/ml. Residuo posmiccional 120 ml.",
      plan: "Solicito valoración para terapia quirúrgica mínimamente invasiva.",
    },
  },
  {
    type: "referral",
    slug: "alergologia-anafilaxia-evaluacion",
    name: "Estudio de alergia alimentaria",
    specialty: "Alergología",
    summary: "Historia de reacción anafiláctica a mariscos",
    content: {
      meta: { specialty: "Alergología", summary: "Confirmar alérgenos específicos" },
      to_specialty: "Alergología",
      to_doctor_name: "Clínica de alergias",
      reason: "Reacción anafiláctica hace 6 semanas posterior a ingesta de camarones.",
      summary:
        "Se administró adrenalina IM. Actualmente en evitación estricta. Porta autoinyector.",
      plan: "Solicito pruebas cutáneas/específicas y plan de acción personalizado.",
    },
  },
  {
    type: "referral",
    slug: "odontologia-implantes-diabetes",
    name: "Evaluación odontología – implantes",
    specialty: "Odontología",
    summary: "Paciente diabético con pérdida dentaria múltiple",
    content: {
      meta: { specialty: "Odontología", summary: "Plan integral de rehabilitación" },
      to_specialty: "Odontología rehabilitadora",
      to_doctor_name: "Dr. Herrera",
      reason: "Rehabilitación con implantes en maxilar superior.",
      summary:
        "Diabetes controlada (HbA1c 6.8%). Higiene oral adecuada. Radiografía panorámica adjunta.",
      plan: "Solicito planificación protésica y tiempos quirúrgicos.",
    },
  },
];

export function getCatalogByType(type: CatalogTemplate["type"]) {
  return CATALOG_TEMPLATES.filter((tpl: any) => tpl.type === type);
}
