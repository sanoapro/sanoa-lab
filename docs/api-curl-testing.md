# Guía rápida para probar APIs con curl

Esta guía recopila los pasos mínimos para verificar la mayoría de los endpoints ubicados en `app/api/*`.

## 1. Autenticarse y capturar cookies de Supabase

1. Arranca el servidor local con `pnpm dev`.
2. Inicia sesión mediante la interfaz web o la ruta de autenticación que corresponda (por ejemplo, email/password).
3. Abre las herramientas de desarrollo del navegador y copia el valor de la cookie `sb:token`.
4. Exporta la cookie para reutilizarla en la terminal:

```bash
export SUPABASE_SESSION='sb:token=<valor_copiado>'
```

## 2. Armar una petición tipo

```bash
curl -X POST http://localhost:3000/api/agenda/appointments/create \
  -H 'Content-Type: application/json' \
  -H "Cookie: ${SUPABASE_SESSION}" \
  -d '{
    "org_id": "<uuid>",
    "provider_id": "<uuid>",
    "patient_id": "<uuid>",
    "starts_at": "2025-02-06T14:00:00.000Z",
    "duration_min": 30,
    "tz": "America/Mexico_City",
    "location": "Consultorio 2",
    "notes": "Primera consulta",
    "schedule_reminders": true
  }'
```

## 3. Verificar autorizaciones

- Las rutas GET generalmente aceptan filtros en la query; revisa cada `route.ts` para conocer parámetros soportados.
- Las rutas POST/PUT/PATCH utilizan `zod` para validar el cuerpo. Examina el esquema para conocer campos obligatorios.
- Ante respuestas `401`, confirma que la cookie no haya expirado y que el middleware de Supabase no haya bloqueado la sesión.

## 4. Documentar los hallazgos

Registra:

- Payload enviado.
- Código de estado y cuerpo de la respuesta.
- Logs relevantes (`logs/*`, consola del navegador o terminal).

Con esta información, el equipo puede reproducir incidencias y priorizar correcciones.
