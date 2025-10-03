export type CsvRow = Record<string, unknown>;

/**
 * Convierte un arreglo de filas a CSV.
 * - Si no pasas headers, los deduce de las claves de todas las filas.
 */
export function toCSV<T extends CsvRow>(rows: T[], headers?: string[]): string {
  if (!rows?.length) return "";

  const cols = headers && headers.length
    ? headers
    : Array.from(
        rows.reduce((set: any, r: any) => {
          for (const k of Object.keys(r ?? {})) set.add(k);
          return set;
        }, new Set<string>())
      );

  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };

  const lines: string[] = [cols.join(",")];
  for (const r of rows) {
    lines.push(cols.map((h: any) => esc((r as CsvRow)[h] ?? "")).join(","));
  }
  return lines.join("\n");
}

/**
 * Descarga un CSV en el browser. NO usar en server.
 */
export function downloadCSV<T extends CsvRow>(
  rows: T[],
  filename: any = "export.csv",
  headers?: string[],
) {
  const csv = toCSV(rows, headers);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
