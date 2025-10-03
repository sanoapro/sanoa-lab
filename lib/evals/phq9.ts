export type PHQ9Answer = 0 | 1 | 2 | 3;

export function phq9Score(answers: PHQ9Answer[]): { total: number; severity: string } {
  // Tipamos el acumulador a number y coaccionamos explícitamente
  const total = answers.reduce<number>((a: any, b: any) => a + Number(b), 0);
  const severity =
    total <= 4
      ? "Mínimo"
      : total <= 9
        ? "Leve"
        : total <= 14
          ? "Moderado"
          : total <= 19
            ? "Moderadamente severo"
            : "Severo";
  return { total, severity };
}
