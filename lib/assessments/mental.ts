export type PHQ9Answers = { [k: string]: number };
export type GAD7Answers = { [k: string]: number };
export type AUDITCAnswers = { [k: string]: number };

export type ScoreResult = {
  tool: "phq9" | "gad7" | "auditc";
  total: number;
  breakdown: Record<string, number>;
  risk_band: "low" | "med" | "high";
  severity: string;
  flags?: Record<string, boolean>;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function scorePHQ9(a: PHQ9Answers): ScoreResult {
  const keys = Array.from({ length: 9 }, (_, i) => `q${i + 1}`);
  const vals = keys.map((k) => clamp(Number(a[k] ?? 0), 0, 3));
  const total = vals.reduce((s, x) => s + x, 0);

  let severity = "mínima";
  if (total >= 20) severity = "severa";
  else if (total >= 15) severity = "moderadamente severa";
  else if (total >= 10) severity = "moderada";
  else if (total >= 5) severity = "leve";

  const item9 = clamp(Number(a.q9 ?? 0), 0, 3);
  const risk_band: "low" | "med" | "high" =
    item9 >= 1 || total >= 20 ? "high" : total >= 10 ? "med" : "low";

  return {
    tool: "phq9",
    total,
    breakdown: Object.fromEntries(keys.map((k, i) => [k, vals[i]])),
    risk_band,
    severity,
    flags: { item9_positive: item9 >= 1 },
  };
}

export function scoreGAD7(a: GAD7Answers): ScoreResult {
  const keys = Array.from({ length: 7 }, (_, i) => `q${i + 1}`);
  const vals = keys.map((k) => clamp(Number(a[k] ?? 0), 0, 3));
  const total = vals.reduce((s, x) => s + x, 0);

  let severity = "mínima";
  if (total >= 15) severity = "severa";
  else if (total >= 10) severity = "moderada";
  else if (total >= 5) severity = "leve";

  const risk_band: "low" | "med" | "high" = total >= 15 ? "high" : total >= 10 ? "med" : "low";

  return {
    tool: "gad7",
    total,
    breakdown: Object.fromEntries(keys.map((k, i) => [k, vals[i]])),
    risk_band,
    severity,
  };
}

export function scoreAUDITC(a: AUDITCAnswers): ScoreResult {
  const keys = ["q1", "q2", "q3"];
  const vals = keys.map((k) => clamp(Number(a[k] ?? 0), 0, 4));
  const total = vals.reduce((s, x) => s + x, 0);

  let severity = "bajo";
  if (total >= 6) severity = "alto";
  else if (total >= 3) severity = "moderado";

  const risk_band: "low" | "med" | "high" = total >= 6 ? "high" : total >= 3 ? "med" : "low";

  return {
    tool: "auditc",
    total,
    breakdown: Object.fromEntries(keys.map((k, i) => [k, vals[i]])),
    risk_band,
    severity,
  };
}

export function scoreAny(
  tool: "phq9" | "gad7" | "auditc",
  answers: Record<string, number>,
): ScoreResult {
  if (tool === "phq9") return scorePHQ9(answers);
  if (tool === "gad7") return scoreGAD7(answers);
  return scoreAUDITC(answers);
}
