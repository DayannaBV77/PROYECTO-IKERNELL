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
HOST=$(sed -n 's/^IKERNELL_DB_HOST=//p' "$RAIZ/.env" 2>/dev/null); HOST="${HOST:-localhost}"
PUERTO=$(sed -n 's/^IKERNELL_DB_PUERTO=//p' "$RAIZ/.env" 2>/dev/null); PUERTO="${PUERTO:-5432}"

echo ">> Cargando datos de semilla en la base de datos '$BASE'..."

if command -v podman >/dev/null 2>&1 && podman ps --format '{{.Names}}' 2>/dev/null | grep -qx "$CONTENEDOR"; then
	podman exec -i -e PGPASSWORD="$CLAVE" "$CONTENEDOR" psql -h 127.0.0.1 -U "$USUARIO" -d "$BASE" < "$RAIZ/scripts/poblar-base-de-datos.sql"
else
	PGPASSWORD="$CLAVE" psql -h "$HOST" -p "$PUERTO" -U "$USUARIO" -d "$BASE" < "$RAIZ/scripts/poblar-base-de-datos.sql"
fi

echo ">> Semilla de datos cargada exitosamente."
echo ">> Resumen de tablas y filas:"
"$RAIZ/scripts/tablas.sh"
