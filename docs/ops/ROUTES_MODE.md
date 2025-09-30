# Estándar de rutas — Next 15, MODE y respuestas

## Cookies/headers async
- **Siempre** `await` en `getSupabaseServer()` (usa `await cookies()`, `await headers()`).
- Rutas sin sesión: `createServiceClient()` → **no toca cookies** (sin warnings).

## MODE
- Añadir comentario sobre el modo arriba del handler:
  - `// MODE: session (user-scoped, cookies)`
  - `// MODE: service (no session, no cookies)`

## Handlers
- `export async function GET/POST/...` **siempre**.

## Validación mínima
- `org_id` obligatorio donde aplique.
- Jobs/webhooks: header `x-cron-key` válido.

## Respuestas
- Éxito: `{ ok: true, data?, meta? }`
- Error: `{ ok: false, error: { code, message } }` con `status` adecuado.

## CSV/Exports headers


Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="archivo.csv"


## 404 y not-found
- Eliminar `app/404.*`; usar `app/not-found.tsx` sin hooks de navegación.

## Checks útiles
