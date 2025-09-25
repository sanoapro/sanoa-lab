export function track(event: string, properties?: Record<string, any>) {
  // Stub: no hace nada si no hay backend configurado.
  // Deja el import estable para cuando conectemos Segment.
  if (process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY) {
    // Aquí podríamos hacer fetch al colector si decides activarlo.
  }
  return;
}
