export type GAD7Answer = 0 | 1 | 2 | 3;

export function gad7Score(answers: GAD7Answer[]): { total: number; severity: string } {
  const total = answers.reduce((a, b) => a + b, 0);
  const severity =
    total <= 4 ? "Mínimo" : total <= 9 ? "Leve" : total <= 14 ? "Moderado" : "Severo";
  return { total, severity };
}
