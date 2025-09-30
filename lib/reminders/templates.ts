export function renderTemplate(body: string, ctx: Record<string, any>) {
  return body.replace(/\{(\w+)\}/g, (_, k) => (ctx?.[k] ?? "").toString());
}
