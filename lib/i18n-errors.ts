/**
 * Traducción y normalización de errores comunes (Supabase/Red/JS) a mensajes en español.
 * Úsalo en pantallas de login/reset/update y también en el Error Boundary global.
 */
function errToString(e: unknown): string {
  if (e == null) return "Ocurrió un error inesperado.";
  if (typeof e === "string") return e;
  if (typeof e === "object") {
    const any = e as any;
    if (any.message) return String(any.message);
    if (any.error_description) return String(any.error_description);
    if (any.error) return String(any.error);
  }
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export function toSpanishError(e: unknown): string {
  const msg = errToString(e);

  // Casos comunes de Supabase/Auth o de red
  if (/Invalid login credentials/i.test(msg)) return "Credenciales inválidas.";
  if (/Email not confirmed/i.test(msg)) return "Tu correo aún no está verificado. Revisa tu bandeja de entrada.";
  if (/provider is not enabled/i.test(msg))
    return "El proveedor (Google) no está habilitado. Actívalo en Supabase → Authentication → Providers → Google.";
  if (/No active session|No se encontró sesión activa|session.*not.*found/i.test(msg))
    return "No se encontró una sesión activa. Vuelve a iniciar sesión.";
  if (/Password should be at least/i.test(msg)) return "La contraseña es demasiado corta. Prueba con 8 o más caracteres.";
  if (/New password should be different/i.test(msg)) return "La nueva contraseña debe ser diferente a la anterior.";

  // Caso reportado por ti
  if (/stack depth limit exceeded/i.test(msg)) {
    return [
      "Se excedió la profundidad de la pila (stack depth limit exceeded).",
      "Posibles causas:",
      "• Demasiadas llamadas anidadas o recursión sin condición de parada.",
      "• Un efecto (useEffect) que se re-ejecuta en bucle por dependencias mal definidas.",
      "Sugerencias:",
      "• Revisa las dependencias de tus efectos (useEffect) y evita setState dentro del render.",
      "• Aísla la operación en un handler o usa useMemo/useCallback.",
    ].join("\n");
  }

  // Errores de red típicos
  if (/Failed to fetch|NetworkError|TypeError: fetch/i.test(msg))
    return "No se pudo conectar con el servidor. Verifica tu red e inténtalo de nuevo.";

  // Fallback: muestra el mensaje original si no lo reconocemos
  return msg || "Ocurrió un error inesperado.";
}
