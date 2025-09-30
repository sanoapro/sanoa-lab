export type ToothStatus = "sano" | "caries" | "restaurado" | "ausente";

export type DentalChart = Record<
  string, // número de pieza en FDI (ej. "11", "21", "36", "48")
  { status: ToothStatus; notes?: string }
>;

// Piezas adultas (FDI)
export const adultTeeth = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
];
