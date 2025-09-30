## Visión general

Este repositorio contiene una plataforma clínica construida con Next.js (App Router) que expone tanto una interfaz web como
docenas de rutas API en `app/api`. La aplicación se integra con Supabase para autenticación/sesiones y depende de scripts de
monorepo administrados con `pnpm`.

## Flujo local recomendado

1. Instala las dependencias:

   ```bash
   pnpm install
   ```

2. Levanta el servidor de desarrollo (puerto `3000` por defecto):

   ```bash
   pnpm dev
   ```

3. Ejecuta la batería de calidad antes/después de cambios para detectar errores de linting, tipos o pruebas:

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   ```

4. Para builds de producción:

   ```bash
   pnpm build
   pnpm start
   ```

## Guía de pruebas con `curl`

Cada carpeta dentro de `app/api/*` representa un módulo (agenda, patients, reports, etc.) con sus rutas anidadas. La siguiente
lista describe un flujo general para validar endpoints manualmente:

1. **Autenticación**. Inicia sesión desde la app o usa la ruta de Supabase correspondiente y reutiliza las cookies de sesión en
   cada petición. Ejemplo:

   ```bash
   curl -i http://localhost:3000/api/auth/callback \
     -H 'Content-Type: application/json' \
     -d '{"email": "usuario@example.com", "password": "<tu_password>"}'
   ```

   Copia el header `Set-Cookie` y pásalo en las siguientes llamadas:

   ```bash
   export SESSION_COOKIE='sb:token=<valor>'
   ```

2. **Invocar rutas protegidas**. La mayoría de módulos requieren cabecera `Cookie` además de `Content-Type`. Un ejemplo para
   crear una cita en agenda:

   ```bash
   curl -X POST http://localhost:3000/api/agenda/appointments/create \
     -H 'Content-Type: application/json' \
     -H "Cookie: ${SESSION_COOKIE}" \
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

3. **Iterar por módulo**. Para descubrir todas las rutas disponibles puedes listar los archivos `route.ts`:

   ```bash
   find app/api -name 'route.ts'
   ```

   Cada archivo contiene validaciones y cuerpo de respuesta, lo que te permite construir el payload adecuado para tus pruebas.

4. **Registrar errores**. Anota el payload usado, la respuesta HTTP y cualquier mensaje para que el equipo pueda reproducir y
   corregir rápidamente.

## Consejos para depuración

- Consulta `logs/` y `tmp/` (si existen) para rastrear ejecuciones locales previas.
- El middleware de Supabase se ubica en `middleware.ts` e interfiere en rutas autenticadas; revisa sus logs si recibes códigos
  `401` inesperados.
- Usa `pnpm test -- --watch` o `pnpm lint -- --fix` para agilizar la iteración durante la corrección de errores.

## Recursos adicionales

- [Documentación de Next.js](https://nextjs.org/docs)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [pnpm CLI](https://pnpm.io/cli) para administración de dependencias y scripts.
