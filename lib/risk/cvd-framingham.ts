export type Sex = 'M'|'F';

export function cvdRisk({
  age, sex, smoker, totalChol, hdl, sbp, treated
}:{
  age:number; sex:Sex; smoker:boolean; totalChol:number; hdl:number; sbp:number; treated:boolean;
}): { riskPct:number; band:string } {
  // Aproximación simple (demo) para UI; no usar como herramienta diagnóstica.
  let points = 0;
  points += Math.floor((age-20)/5);
  points += smoker ? 4 : 0;
  points += treated ? Math.floor((sbp-120)/10) : Math.floor((sbp-130)/10);
  points += Math.floor((totalChol-160)/20);
  points -= Math.floor((hdl-40)/10);
  if (sex === 'F') points -= 1;

  const riskPct = Math.max(1, Math.min(30, 1 + points));
  const band = riskPct < 5 ? 'Bajo' : riskPct < 10 ? 'Límite' : riskPct < 20 ? 'Intermedio' : 'Alto';
  return { riskPct, band };
}
