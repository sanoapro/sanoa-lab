# Rutas y MODE (service vs session)

Este proyecto usa Next 15 (cookies/headers asíncronos). Regla de oro:

- **MODE: session (user-scoped, cookies)**
  - Usa `const supa = await getSupabaseServer()`
  - Solo cuando las consultas dependen de `auth.uid()` y RLS del usuario.
  - Handlers SIEMPRE `export async function`.

- **MODE: service (no session, no cookies)**
  - Usa `const svc = createServiceClient()`
  - Para jobs, webhooks, crons, búsquedas públicas controladas por filtros (`is_public = true`, etc.).
  - Nunca lee cookies. Handlers `export async function`.

### Respuestas

- Éxito: `{ ok: true, data?, meta? }`
- Error: `{ ok: false, error: { code, message } }` con `status` apropiado.

### CSV / Exports

- Headers:
  - `Content-Type: text/csv; charset=utf-8`
  - `Content-Disposition: attachment; filename="archivo.csv"`

### Checks útiles

```bash
# Endpoints async
rg -n 'export function (GET|POST|PUT|PATCH|DELETE)\(' app/api | wc -l
rg -n 'export async function (GET|POST|PUT|PATCH|DELETE)\(' app/api | wc -l

# Sin usos peligrosos:
rg -n 'const\s+\w+\s*=\s*getSupabaseServer\(\)' app/ lib/

# Cookies directas:
rg -n 'cookies\(\)\.get\('
```
