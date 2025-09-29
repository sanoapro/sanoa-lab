export type MeasurementType =
  | "bp_sys"   // Presión arterial sistólica (mmHg)
  | "bp_dia"   // Presión arterial diastólica (mmHg)
  | "hr"       // Frecuencia cardiaca (lpm)
  | "bmi"      // Índice de masa corporal (kg/m2)
  | "weight"   // Peso (kg)
  | "height"   // Talla (cm)
  | "glucose"  // Glucosa capilar (mg/dL)
  | "hba1c"    // Hemoglobina glucosilada (%)
  | "ldl"      // LDL (mg/dL)
  | "hdl"      // HDL (mg/dL)
  | "tg";      // Triglicéridos (mg/dL)

export const MEASUREMENT_META: Record<MeasurementType, { label: string; unit: string }> = {
  bp_sys:  { label: "TA Sistólica", unit: "mmHg" },
  bp_dia:  { label: "TA Diastólica", unit: "mmHg" },
  hr:      { label: "Frecuencia cardiaca", unit: "lpm" },
  bmi:     { label: "IMC", unit: "kg/m²" },
  weight:  { label: "Peso", unit: "kg" },
  height:  { label: "Talla", unit: "cm" },
  glucose: { label: "Glucosa", unit: "mg/dL" },
  hba1c:   { label: "HbA1c", unit: "%" },
  ldl:     { label: "LDL", unit: "mg/dL" },
  hdl:     { label: "HDL", unit: "mg/dL" },
  tg:      { label: "Triglicéridos", unit: "mg/dL" },
};

export function bandByTarget(
  _type: MeasurementType,
  value: number,
  target?: { low?: number | null; high?: number | null }
): "low"|"in"|"high"|"na" {
  if (!target) return "na";
  const lo = typeof target.low === "number" ? target.low : undefined;
  const hi = typeof target.high === "number" ? target.high : undefined;
  if (typeof lo === "number" && value < lo) return "low";
  if (typeof hi === "number" && value > hi) return "high";
  if (typeof lo !== "number" && typeof hi !== "number") return "na";
  return "in";
}
