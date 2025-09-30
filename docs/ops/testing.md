# Testing local con pnpm

Esta guía resume el flujo recomendado para instalar dependencias y ejecutar la batería de pruebas automatizadas en el proyecto.

## 1. Instalar dependencias

```bash
pnpm install
```

El comando analiza `pnpm-lock.yaml`, descarga cualquier paquete faltante y prepara los scripts definidos en `package.json`. Si recibes un `ERR_PNPM_FETCH_403`, revisa que tus credenciales para el registro privado estén configuradas; el instalador te indicará qué ámbito requiere autenticación.

## 2. Ejecutar las pruebas

```bash
pnpm test
```

El script encadenado realiza las siguientes tareas:

1. Corre `tsc --project tsconfig.tests.json` para emitir JavaScript CommonJS dentro de `tmp/test-dist/`.
2. Lanza `node --test tmp/test-dist/__tests__/agenda.test.js`, que valida las funciones de `lib/reports/agenda.ts`.
3. Elimina `tmp/test-dist/` al finalizar para dejar el árbol limpio.

## 3. Opciones adicionales

- Modo observación: `pnpm test -- --watch` recompila y reejecuta al guardar cambios.
- Mantener artefactos de compilación: `pnpm exec tsc --project tsconfig.tests.json` genera `tmp/test-dist/` sin borrarlo, útil para depuración manual.
