export function toSpanishError(err: unknown): string {
  const msg = (typeof err === "string" ? err : (err as any)?.message) ?? "";
  const s = msg.toLowerCase();

  if (s.includes("invalid login credentials")) return "Credenciales inválidas. Revisa tu correo y contraseña.";
  if (s.includes("unsupported provider")) return "Proveedor no habilitado. Activa el proveedor en la consola de Supabase.";
  if (s.includes("stack depth limit exceeded")) {
    return "Se excedió el límite de profundidad del motor de base de datos.";
  }
  return msg || "Ocurrió un error inesperado.";
}

export function hintFor(msg: string): string | undefined {
  const s = msg.toLowerCase();
  if (s.includes("stack depth limit exceeded")) {
    return "Suele ocurrir con filtros muy complejos. Prueba reduciendo criterios, acotando fechas o quitando comodines.";
  }
  return undefined;
}
