// lib/prescriptions/templates.seed.ts
type Rx = { specialty: "mente" | "pulso" | "equilibrio" | "sonrisa" | "general"; title: string; body: string };

const seeds: Rx[] = [
  // Mente
  { specialty: "mente", title: "Sertralina 50–100 mg cada 24 h",
    body: "Sertralina 50 mg VO cada mañana por 7 días; si tolera, subir a 100 mg/d. Revisión a 4–6 semanas. Advertir náusea inicial y disfunción sexual." },
  { specialty: "mente", title: "Fluoxetina 20 mg cada 24 h",
    body: "Fluoxetina 20 mg VO c/mañana. Reevaluar respuesta a 4–6 semanas. Precaución: ansiedad inicial, insomnio." },
  { specialty: "mente", title: "Quetiapina 25–100 mg nocte",
    body: "Quetiapina 25 mg VO nocte, titular hasta 100 mg si requiere. Advertir somnolencia." },
  { specialty: "mente", title: "Clonazepam PRN crisis de ansiedad (máx 14 días)",
    body: "Clonazepam 0.25–0.5 mg VO PRN ansiedad aguda, máximo 1 mg/d y 14 días. Riesgo dependencia, no mezclar con alcohol." },
  { specialty: "mente", title: "Trazodona 50–100 mg nocte",
    body: "Trazodona 50 mg VO nocte; si insomnio persiste, subir a 100 mg. Evitar en hipotensión ortostática." },

  // Pulso
  { specialty: "pulso", title: "Losartán 50 mg cada 24 h",
    body: "Losartán 50 mg VO c/24h. Control PA a 2–4 semanas. Vigilar K+ y función renal." },
  { specialty: "pulso", title: "Metformina 850 mg cada 12 h",
    body: "Metformina 850 mg VO c/12h con alimentos. Vigilar GI y eGFR. Meta HbA1c <7%." },
  { specialty: "pulso", title: "Atorvastatina 20 mg nocte",
    body: "Atorvastatina 20 mg VO nocte. Perfil lipídico a 6–8 semanas. Mialgias: considerar CK." },
  { specialty: "pulso", title: "Furosemida 20 mg PRN",
    body: "Furosemida 20 mg VO c/24–48h PRN edema. Control peso y electrolitos." },
  { specialty: "pulso", title: "Omeprazol 20 mg cada 24 h por 4–8 semanas",
    body: "Omeprazol 20 mg VO c/24h antes del desayuno por 4–8 semanas. Reevaluar." },

  // Equilibrio (hábitos/planes)
  { specialty: "equilibrio", title: "Plan de sueño 7–8 h",
    body: "Dormir 7–8 h. Rutina fija, sin pantallas 60 min antes, cuarto oscuro/fresco. Evitar cafeína tarde." },
  { specialty: "equilibrio", title: "Plan de ejercicio semanal",
    body: "150 min/sem aeróbico moderado + 2 sesiones/sem de fuerza. Progresión gradual." },
  { specialty: "equilibrio", title: "Plan nutrición plato saludable",
    body: "Mitad verduras, 1/4 proteína magra, 1/4 carbohid. Agua 2 L/d. 80/20 flexible." },
  { specialty: "equilibrio", title: "Respiración 4-7-8",
    body: "Respiración 4-7-8 por 5–10 min/día. 4 insp., 7 sostener, 8 exhalar. En estrés agudo." },
  { specialty: "equilibrio", title: "Estrategia antiestrés",
    body: "Micropausas 3×/día (2–3 min), caminar breve, estirar cuello/hombros. Mindfulness 5 min." },

  // Sonrisa (odontología)
  { specialty: "sonrisa", title: "Amoxicilina 500 mg c/8 h por 5–7 días",
    body: "Amoxicilina 500 mg VO c/8h x 5–7 días si infección (sin alergia a penicilina). Con alimentos." },
  { specialty: "sonrisa", title: "Ibuprofeno 400 mg c/8 h PRN dolor",
    body: "Ibuprofeno 400 mg VO c/8h PRN dolor (máx 1.2 g/d). Tomar con alimentos. Evitar en úlcera." },
  { specialty: "sonrisa", title: "Clorhexidina 0.12% enjuague",
    body: "Clorhexidina 0.12% 15 ml enjuague c/12h x 7–14 días. No ingerir, evitar alimentos/agua 30 min." },
  { specialty: "sonrisa", title: "Paracetamol 1 g c/8 h PRN",
    body: "Paracetamol 1 g VO c/8h PRN (máx 3 g/d). Evitar hepatotoxicidad." },
  { specialty: "sonrisa", title: "Naproxeno 500 mg inicial, luego 250 mg",
    body: "Naproxeno 500 mg VO inicial; luego 250 mg c/8–12h PRN. Con alimentos." },
];

export default seeds;
