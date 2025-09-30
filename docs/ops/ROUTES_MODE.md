# ROUTES_MODE — Matriz de endpoints → MODE (session/service)

> Estándar: Next 15 (cookies async), handlers `export async`, helpers:
> - MODE **session** → `const supa = await getSupabaseServer()` (lee cookies; respeta RLS `auth.uid()`).
> - MODE **service** → `const svc = createServiceClient()` (NO cookies; uso con `x-cron-key`/firma).

## Clínico — Prescriptions (Recetas) → **session**
- /api/prescriptions/check-interactions      (GET/POST)
- /api/prescriptions/[id]/json               (GET)
- /api/prescriptions/[id]/pdf                (GET) → Headers PDF
- /api/prescriptions/create                  (POST) → zod payload
- /api/prescriptions/templates               (GET/POST?) plantillas por org
- /api/prescriptions/from-template           (POST)

## Clínico — Discharges (Altas) → **session**
- /api/discharges/[id]/json                  (GET)
- /api/discharges/[id]/pdf                   (GET) → Headers PDF
- /api/discharges/create                     (POST)
- /api/discharges                            (GET) listado + paginación

## Clínico — Referrals (Referencias) → **session**
- /api/referrals/[id]                        (GET/DELETE?)
- /api/referrals/[id]/json                   (GET) *(si existe)*
- /api/referrals/create                      (POST)
- /api/referrals/templates                   (GET)

## Clínico — Forms → **session**
- /api/forms/templates                       (GET/POST?)
- /api/forms/responses                       (GET/POST?)

## Agenda → **session** (lectura/escritura de usuario)
- /api/agenda/appointments/*                 (GET/POST/PATCH)
- /api/agenda/availability/*                 (GET)

## Integraciones / Jobs / Webhooks → **service**
- /api/integrations/jotform/webhook          (POST) → validar firma/`x-cron-key`
- /api/integrations/twilio/*                 (POST) → validar firma Twilio
- /api/cal/bookings                          (POST) → firma Cal.com
- /api/jobs/*                                (POST) → `x-cron-key` requerido
- /api/notify/*                              (POST) → `x-cron-key` / firma proveedor

## Files / Storage / Export
- /api/files/*                               (**session**) lectura/gestión user-scoped
- /api/storage/letterheads/*                 (**session**) firma temporal + headers
- /api/storage/signatures/*                  (**session**) firma temporal + headers
- /api/export/*                              (**session**) CSV/XLSX con headers correctos

## Bank (MVP)
- /api/bank/tx*                              (**session**)
- /api/bank/rules*                           (**session**)
- /api/bank/budgets*                         (**session**)
- /api/bank/report/*                         (**session**)
- /api/bank/alerts/run                       (**service**) `x-cron-key`

## Reports
- /api/reports/*                             (**session**) excepto:
- /api/reports/daily-summary/send            (**service**) `x-cron-key`

## Docs / Utilidades
- /api/docs/verify                           (**service**) (consulta pública controlada)
- /api/docs/ensure-folio                     (**service**) folios seguros

---

### Reglas fijas del proyecto
- Siempre `export async function GET/POST/...`.
- MODE comentado en la primera línea del handler.
- Respuestas JSON:
  - Éxito: `{ ok: true, data?, meta? }`
  - Error: `{ ok: false, error: { code, message } }` + `status`.
- En **service**: nunca leer cookies; validar `x-cron-key` o firma del proveedor.
- CSV/PDF: `Content-Type` y `Content-Disposition` correctos (filename).
