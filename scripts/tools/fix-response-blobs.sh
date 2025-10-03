#!/usr/bin/env bash
set -euo pipefail

# Cambia esto si tus rutas PDF están fuera de "app"
ROOT="app"

echo "Buscando y reemplazando constructores Response/NextResponse con Blob..."

# ---- NextResponse(Buffer.from(...), ...) -> NextResponse(new Blob([...]), ...)
files1=$(rg -l 'new\s+NextResponse\(\s*Buffer\.from\(' "$ROOT" || true)
if [ -n "${files1:-}" ]; then
  echo "[1] Corrigiendo NextResponse(Buffer.from(...)) en:"
  echo "$files1"
  perl -0777 -i.bak -pe 's/new\s+NextResponse\(\s*Buffer\.from\(([^)]+)\)\s*,/new NextResponse(new Blob([\1]),/g' $files1
fi

# ---- NextResponse(bytes, ...) -> NextResponse(new Blob([bytes]), ...)
files2=$(rg -l 'new\s+NextResponse\(\s*[a-zA-Z_]\w*\s*,' "$ROOT" || true)
if [ -n "${files2:-}" ]; then
  echo "[2] Corrigiendo NextResponse(<variable>, ...) en:"
  echo "$files2"
  perl -0777 -i.bak -pe 's/new\s+NextResponse\(\s*([a-zA-Z_]\w*)\s*,/new NextResponse(new Blob([\1]),/g' $files2
fi

# ---- NextResponse(bytes) -> NextResponse(new Blob([bytes]))
files2b=$(rg -l 'new\s+NextResponse\(\s*[a-zA-Z_]\w*\s*\)' "$ROOT" || true)
if [ -n "${files2b:-}" ]; then
  echo "[2b] Corrigiendo NextResponse(<variable>) en:"
  echo "$files2b"
  perl -0777 -i.bak -pe 's/new\s+NextResponse\(\s*([a-zA-Z_]\w*)\s*\)/new NextResponse(new Blob([\1]))/g' $files2b
fi

# ---- Response(Buffer.from(...), ...) -> Response(new Blob([...]), ...)
files3=$(rg -l 'new\s+Response\(\s*Buffer\.from\(' "$ROOT" || true)
if [ -n "${files3:-}" ]; then
  echo "[3] Corrigiendo Response(Buffer.from(...)) en:"
  echo "$files3"
  perl -0777 -i.bak -pe 's/new\s+Response\(\s*Buffer\.from\(([^)]+)\)\s*,/new Response(new Blob([\1]),/g' $files3
fi

# ---- Response(bytes, ...) -> Response(new Blob([bytes]), ...)
files4=$(rg -l 'new\s+Response\(\s*[a-zA-Z_]\w*\s*,' "$ROOT" || true)
if [ -n "${files4:-}" ]; then
  echo "[4] Corrigiendo Response(<variable>, ...) en:"
  echo "$files4"
  perl -0777 -i.bak -pe 's/new\s+Response\(\s*([a-zA-Z_]\w*)\s*,/new Response(new Blob([\1]),/g' $files4
fi

# ---- Response(bytes) -> Response(new Blob([bytes]))
files4b=$(rg -l 'new\s+Response\(\s*[a-zA-Z_]\w*\s*\)' "$ROOT" || true)
if [ -n "${files4b:-}" ]; then
  echo "[4b] Corrigiendo Response(<variable>) en:"
  echo "$files4b"
  perl -0777 -i.bak -pe 's/new\s+Response\(\s*([a-zA-Z_]\w*)\s*\)/new Response(new Blob([\1]))/g' $files4b
fi

echo "Listo. Revisa cambios con: git diff"
echo "Si todo OK, elimina backups .bak con: rg -l '\\.bak$' | xargs rm -f"
