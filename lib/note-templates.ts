export type NoteTemplateKey = "SOAP" | "DARE";

export function getTemplate(key: NoteTemplateKey) {
  if (key === "SOAP") {
    return {
      titulo: "Nota SOAP",
      contenido:
`S - Subjetivo:
- Motivo de consulta:
- Síntomas/Relato del paciente:

O - Objetivo:
- Observaciones clínicas:
- Resultados/mediciones relevantes:

A - Análisis:
- Impresión clínica / hipótesis:

P - Plan:
- Intervenciones / Tareas:
- Seguimiento / Próxima cita:`
    };
  }
  // DARE
  return {
    titulo: "Nota DARE",
    contenido:
`D - Datos:
- Hechos/mediciones:

A - Análisis:
- Interpretación/hipótesis:

R - Respuesta:
- Intervención realizada / reacción:

E - Evaluación:
- Resultados/efectos / próximos pasos:`
  };
}
