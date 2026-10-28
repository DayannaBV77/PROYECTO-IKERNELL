#!/usr/bin/env bash
# =============================================================================
# Atajo para mirar las tablas sin pasar por pgAdmin.
#
#   ./scripts/tablas.sh              lista las tablas con su numero de filas
#   ./scripts/tablas.sh trabajador   muestra el contenido de una tabla
#   ./scripts/tablas.sh -d etapa     describe las columnas de una tabla
#   ./scripts/tablas.sh -c "SQL"     ejecuta una consulta cualquiera
# =============================================================================
set -uo pipefail

CONTENEDOR="${IKERNELL_CONTENEDOR:-ikernell-postgres}"
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# La clave sale de .env, la misma que usa la aplicacion.
CLAVE=$(sed -n 's/^IKERNELL_DB_PASSWORD=//p' "$RAIZ/.env" 2>/dev/null)
USUARIO=$(sed -n 's/^IKERNELL_DB_USUARIO=//p' "$RAIZ/.env" 2>/dev/null); USUARIO="${USUARIO:-ikernell}"
BASE=$(sed -n 's/^IKERNELL_DB_NOMBRE=//p' "$RAIZ/.env" 2>/dev/null); BASE="${BASE:-ikernell}"
HOST=$(sed -n 's/^IKERNELL_DB_HOST=//p' "$RAIZ/.env" 2>/dev/null); HOST="${HOST:-localhost}"
PUERTO=$(sed -n 's/^IKERNELL_DB_PUERTO=//p' "$RAIZ/.env" 2>/dev/null); PUERTO="${PUERTO:-5432}"

psql_() {
	if command -v podman >/dev/null 2>&1 && podman ps --format '{{.Names}}' 2>/dev/null | grep -qx "$CONTENEDOR"; then
		podman exec -e PGPASSWORD="$CLAVE" "$CONTENEDOR" psql -h 127.0.0.1 -U "$USUARIO" -d "$BASE" "$@"
	else
		PGPASSWORD="$CLAVE" psql -h "$HOST" -p "$PUERTO" -U "$USUARIO" -d "$BASE" "$@"
	fi
}

case "${1:-}" in
	"")
		# relname/n_live_tup da un conteo aproximado y barato; para las cifras
		# exactas de una tabla concreta se usa el modo de contenido.
		psql_ -c "
			SELECT relname AS tabla, n_live_tup AS filas
			  FROM pg_stat_user_tables
			 ORDER BY relname;"
		;;
	-d) shift; psql_ -c "\d ${1:?falta el nombre de la tabla}" ;;
	-c) shift; psql_ -c "${1:?falta la consulta}" ;;
	-*) echo "Opcion desconocida: $1"; exit 1 ;;
	*)  psql_ -c "SELECT * FROM ${1} LIMIT 50;" ;;
esac
