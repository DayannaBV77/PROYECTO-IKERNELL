#!/usr/bin/env bash
# =============================================================================
# Carga de datos de prueba completos para IKernell.
#
#   ./scripts/poblar-base-de-datos.sh
# =============================================================================
set -euo pipefail

CONTENEDOR="${IKERNELL_CONTENEDOR:-ikernell-postgres}"
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

CLAVE=$(sed -n 's/^IKERNELL_DB_PASSWORD=//p' "$RAIZ/.env" 2>/dev/null)
USUARIO=$(sed -n 's/^IKERNELL_DB_USUARIO=//p' "$RAIZ/.env" 2>/dev/null); USUARIO="${USUARIO:-ikernell}"
BASE=$(sed -n 's/^IKERNELL_DB_NOMBRE=//p' "$RAIZ/.env" 2>/dev/null); BASE="${BASE:-ikernell}"

echo ">> Cargando datos de semilla en la base de datos '$BASE'..."

podman exec -i -e PGPASSWORD="$CLAVE" "$CONTENEDOR" psql -h 127.0.0.1 -U "$USUARIO" -d "$BASE" < "$RAIZ/scripts/poblar-base-de-datos.sql"

echo ">> Semilla de datos cargada exitosamente."
echo ">> Resumen de tablas y filas:"
"$RAIZ/scripts/tablas.sh"
