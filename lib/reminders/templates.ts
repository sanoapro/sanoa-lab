export function renderTemplate(body: string, ctx: Record<string, any>) {
  return body.replace(/\{(\w+)\}/g, (_: any, k: any) => (ctx?.[k] ?? "").toString());
}
