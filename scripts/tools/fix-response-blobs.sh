#!/usr/bin/env bash
set -euo pipefail

# Directorio base a revisar (ajústalo si necesitas)
ROOT="app"

echo "Buscando y reemplazando constructores Response/NextResponse con Blob..."

# --- NextResponse(Buffer.from(...)) -> NextResponse(new Blob([...] ), ... )
files1=$(rg -l 'new\s+NextResponse\(\s*Buffer\.from\(' "$ROOT" || true)
if [ -n "${files1:-}" ]; then
  echo "Corrigiendo NextResponse(Buffer.from(...)) en:"
  echo "$files1"
  perl -0777 -i.bak -pe 's/new\s+NextResponse\(\s*Buffer\.from\(([^)]+)\)\s*,/new NextResponse(new Blob([\1]),/g' $files1
fi

# --- NextResponse(bytes|pdfBytes|... ,) -> NextResponse(new Blob([bytes]), ... )
files2=$(rg -l 'new\s+NextResponse\(\s*[a-zA-Z_]\w*\s*,' "$ROOT" || true)
if [ -n "${files2:-}" ]; then
  echo "Corrigiendo NextResponse(<variable>, ...) en:"
  echo "$files2"
  perl -0777 -i.bak -pe 's/new\s+NextResponse\(\s*([a-zA-Z_]\w*)\s*,/new NextResponse(new Blob([\1]),/g' $files2
fi

# --- Response(Buffer.from(...)) -> Response(new Blob([...] ), ... )
files3=$(rg -l 'new\s+Response\(\s*Buffer\.from\(' "$ROOT" || true)
if [ -n "${files3:-}" ]; then
  echo "Corrigiendo Response(Buffer.from(...)) en:"
  echo "$files3"
  perl -0777 -i.bak -pe 's/new\s+Response\(\s*Buffer\.from\(([^)]+)\)\s*,/new Response(new Blob([\1]),/g' $files3
fi

# --- Response(bytes|pdfBytes|... ,) -> Response(new Blob([bytes]), ... )
files4=$(rg -l 'new\s+Response\(\s*[a-zA-Z_]\w*\s*,' "$ROOT" || true)
if [ -n "${files4:-}" ]; then
  echo "Corrigiendo Response(<variable>, ...) en:"
  echo "$files4"
  perl -0777 -i.bak -pe 's/new\s+Response\(\s*([a-zA-Z_]\w*)\s*,/new Response(new Blob([\1]),/g' $files4
fi

echo "Listo. Revisa cambios con: git diff"
echo "Si todo OK, puedes borrar backups .bak con: rg -l \"\\.bak$\" | xargs rm -f"
