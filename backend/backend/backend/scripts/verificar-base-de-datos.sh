#!/usr/bin/env bash
# =============================================================================
# Verificacion de la conexion con PostgreSQL y de que los datos SE PERSISTEN.
#
# Se divide en dos partes porque fallan por motivos distintos:
#
#   PARTE 1 - la base de datos, sin la aplicacion. Si esto falla, el problema
#             es el servidor o las credenciales, no el backend.
#   PARTE 2 - la aplicacion de punta a punta: entra, escribe por la API,
#             comprueba en SQL que la fila existe de verdad y la borra.
#
# La parte 2 se salta sola si el backend no esta arriba, para que el script
# siga siendo util antes de arrancarlo.
#
#   ./scripts/verificar-base-de-datos.sh
# =============================================================================
set -uo pipefail

AZUL='\033[0;34m'; VERDE='\033[0;32m'; ROJO='\033[0;31m'; AMARILLO='\033[0;33m'; FIN='\033[0m'
FALLOS=0

ok()      { echo -e "  ${VERDE}OK${FIN}    $1"; }
fallo()   { echo -e "  ${ROJO}FALLO${FIN} $1"; FALLOS=$((FALLOS + 1)); }
aviso()   { echo -e "  ${AMARILLO}AVISO${FIN} $1"; }
titulo()  { echo -e "\n${AZUL}$1${FIN}"; }

# --- Credenciales: salen de .env, igual que las lee la aplicacion -----------
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV="$RAIZ/.env"

if [[ -f "$ENV" ]]; then
	# Se lee con 'while read' y no con 'source': .env es un archivo de
	# propiedades, no un script, y ejecutarlo con source interpretaria como
	# ordenes cualquier caracter especial de la contrasena.
	while IFS='=' read -r clave valor; do
		[[ "$clave" =~ ^[[:space:]]*# || -z "$clave" ]] && continue
		clave="${clave// /}"
		case "$clave" in
			IKERNELL_DB_HOST|IKERNELL_DB_PUERTO|IKERNELL_DB_NOMBRE|IKERNELL_DB_USUARIO|IKERNELL_DB_PASSWORD)
				printf -v "$clave" '%s' "$valor" ;;
		esac
	done < "$ENV"
else
	echo -e "${ROJO}No existe $ENV. Copie la plantilla: cp .env.example .env${FIN}"
	exit 1
fi

HOST="${IKERNELL_DB_HOST:-localhost}"
PUERTO="${IKERNELL_DB_PUERTO:-5432}"
BASE="${IKERNELL_DB_NOMBRE:-ikernell}"
USUARIO="${IKERNELL_DB_USUARIO:-ikernell}"
CLAVE="${IKERNELL_DB_PASSWORD:-}"
API="${IKERNELL_API:-http://localhost:8080}"
CONTENEDOR="${IKERNELL_CONTENEDOR:-ikernell-postgres}"

# psql se ejecuta dentro del contenedor si esta corriendo, o contra el servidor
# local directamente. PGPASSWORD evita que pida la clave de forma interactiva.
psql_() {
	if command -v podman >/dev/null 2>&1 && podman ps --format '{{.Names}}' 2>/dev/null | grep -qx "$CONTENEDOR"; then
		podman exec -e PGPASSWORD="$CLAVE" "$CONTENEDOR" \
			psql -h 127.0.0.1 -U "$USUARIO" -d "$BASE" -tAc "$1" 2>&1
	else
		PGPASSWORD="$CLAVE" psql -h "$HOST" -p "$PUERTO" -U "$USUARIO" -d "$BASE" -tAc "$1" 2>&1
	fi
}

echo -e "${AZUL}=========================================================${FIN}"
echo -e "${AZUL} Verificacion de base de datos - IKernell${FIN}"
echo -e "${AZUL}=========================================================${FIN}"
echo "  Servidor : $HOST:$PUERTO/$BASE"
echo "  Usuario  : $USUARIO"
echo "  API      : $API"

# =============================================================================
titulo "PARTE 1 - Base de datos"
# =============================================================================

if command -v podman >/dev/null 2>&1 && podman ps --format '{{.Names}}' 2>/dev/null | grep -qx "$CONTENEDOR"; then
	ok "Contenedor '$CONTENEDOR' corriendo."
else
	ok "Usando servidor PostgreSQL directo en $HOST:$PUERTO."
fi

VERSION=$(psql_ "SELECT version();")
if [[ "$VERSION" == PostgreSQL* ]]; then
	ok "Autenticacion correcta: ${VERSION%% on *}"
else
	fallo "No se pudo autenticar. Respuesta: $VERSION"
	echo -e "        Revise IKERNELL_DB_PASSWORD en .env"
	exit 1
fi

MIGRACIONES=$(psql_ "SELECT COUNT(*) FROM flyway_schema_history WHERE success = TRUE;")
ESQUEMA=$(psql_ "SELECT MAX(version::int) FROM flyway_schema_history WHERE success = TRUE;")
if [[ "$MIGRACIONES" =~ ^[0-9]+$ ]] && (( MIGRACIONES > 0 )); then
	ok "Flyway: $MIGRACIONES migraciones aplicadas (esquema en version $ESQUEMA)."
else
	fallo "No hay migraciones aplicadas. Arranque el backend una vez para crearlas."
fi

FALLIDAS=$(psql_ "SELECT COUNT(*) FROM flyway_schema_history WHERE success = FALSE;")
if [[ "$FALLIDAS" == "0" ]]; then
	ok "Ninguna migracion fallida."
else
	fallo "$FALLIDAS migraciones fallidas: 'flyway repair' o recrear el volumen."
fi

TABLAS=$(psql_ "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
ok "Tablas en el esquema public: $TABLAS"

# Escritura y lectura directas, sin pasar por la aplicacion. Separa un problema
# de permisos del usuario de un problema del backend.
PRUEBA=$(psql_ "CREATE TEMP TABLE prueba_escritura (dato TEXT);
                INSERT INTO prueba_escritura VALUES ('ok');
                SELECT dato FROM prueba_escritura;")
if [[ "$PRUEBA" == *ok* ]]; then
	ok "El usuario '$USUARIO' puede crear tablas y escribir."
else
	fallo "El usuario no puede escribir: $PRUEBA"
fi

# =============================================================================
titulo "PARTE 2 - Backend de punta a punta"
# =============================================================================

if ! curl -s -f -o /dev/null --max-time 5 "$API/api/auth/csrf"; then
	aviso "El backend no responde en $API; se omite la parte 2."
	echo -e "        Arranquelo con: ${AMARILLO}JAVA_HOME=/usr/lib/jvm/java-25 ./mvnw spring-boot:run${FIN}"
	titulo "RESULTADO"
	(( FALLOS == 0 )) && { echo -e "  ${VERDE}La base de datos esta lista.${FIN}"; exit 0; }
	echo -e "  ${ROJO}$FALLOS comprobacion(es) fallida(s).${FIN}"; exit 1
fi
ok "El backend responde en $API"

GALLETAS=$(mktemp); trap 'rm -f "$GALLETAS"' EXIT
token() {
	curl -s -b "$GALLETAS" -c "$GALLETAS" "$API/api/auth/csrf" \
		| sed -n 's/.*"token":"\([^"]*\)".*/\1/p'
}

CORREO="${IKERNELL_CORREO:-coordinador@ikernell.com}"
CLAVE_APP="${IKERNELL_CLAVE:-Dev12345}"

RESPUESTA=$(curl -s -b "$GALLETAS" -c "$GALLETAS" -X POST "$API/api/auth/login" \
	-H "Content-Type: application/json" -H "X-XSRF-TOKEN: $(token)" \
	-d "{\"correoCorporativo\":\"$CORREO\",\"password\":\"$CLAVE_APP\"}")
if [[ "$RESPUESTA" == *trabajadorId* ]]; then
	ok "Inicio de sesion correcto como $CORREO"
else
	fallo "No se pudo iniciar sesion: $RESPUESTA"
	titulo "RESULTADO"; echo -e "  ${ROJO}$FALLOS comprobacion(es) fallida(s).${FIN}"; exit 1
fi

# El token CSRF cambia al iniciar sesion, porque la sesion es otra.
DIAG=$(curl -s -b "$GALLETAS" "$API/api/diagnostico/base-de-datos")
if [[ "$DIAG" == *'"conectada":true'* ]]; then
	ok "La aplicacion esta conectada a la base de datos."
	# Las comillas del JSON se extraen con sed y no con python embebido: dentro
	# de un script de shell, el escapado de comillas en python se vuelve ilegible.
	echo "        motor  : $(sed -n 's/.*"motor":"\([^"]*\)".*/\1/p' <<< "$DIAG")"
	echo "        url    : $(sed -n 's/.*"url":"\([^"]*\)".*/\1/p' <<< "$DIAG")"
	echo "        esquema: version $(sed -n 's/.*"versionEsquema":"\([^"]*\)".*/\1/p' <<< "$DIAG")"
	echo "        pool   : $(sed -n 's/.*"pool":{\([^}]*\)}.*/\1/p' <<< "$DIAG")"
else
	fallo "El diagnostico no respondio como se esperaba: $DIAG"
fi

# --- La prueba que importa: escribir por la API y confirmarlo en SQL --------
IDENT="$(date +%s | tail -c 11)"
CREACION=$(curl -s -b "$GALLETAS" -c "$GALLETAS" -X POST "$API/api/trabajadores" \
	-H "Content-Type: application/json" -H "X-XSRF-TOKEN: $(token)" \
	-d "{\"identificacion\":\"$IDENT\",\"nombre\":\"Prueba\",\"apellido\":\"Conexion\",
	     \"fechaNacimiento\":\"1990-01-01\",\"direccion\":\"Calle 10 # 5-20, Bogota\",
	     \"profesion\":\"Ingeniero de sistemas\",\"especialidadDesarrollo\":\"Backend\",
	     \"tipoTrabajador\":\"DESARROLLADOR\"}")

if [[ "$CREACION" == *'"id":'* ]]; then
	ok "La API acepto la insercion (identificacion $IDENT)."
else
	fallo "La API rechazo la insercion: $CREACION"
fi

EN_BASE=$(psql_ "SELECT COUNT(*) FROM trabajador WHERE identificacion = '$IDENT';")
if [[ "$EN_BASE" == "1" ]]; then
	ok "La fila existe en PostgreSQL: el dato SE PERSISTIO."
else
	fallo "La fila NO esta en PostgreSQL (encontradas: $EN_BASE)."
fi

ANOTADA=$(psql_ "SELECT COUNT(*) FROM registro_operacion
                 WHERE ruta = '/api/trabajadores' AND metodo = 'POST'
                   AND ocurrida_en > CURRENT_TIMESTAMP - INTERVAL '2 minutes';")
if [[ "$ANOTADA" =~ ^[0-9]+$ ]] && (( ANOTADA > 0 )); then
	ok "La operacion quedo anotada en la bitacora (registro_operacion)."
else
	fallo "La operacion NO quedo anotada en la bitacora."
fi

# Se limpia por SQL y no por la API: inhabilitar un trabajador (RN-02) lo deja
# en la tabla, y este dato es basura de prueba que no debe quedarse.
psql_ "DELETE FROM trabajador WHERE identificacion = '$IDENT';" > /dev/null
RESTANTE=$(psql_ "SELECT COUNT(*) FROM trabajador WHERE identificacion = '$IDENT';")
[[ "$RESTANTE" == "0" ]] && ok "Dato de prueba eliminado." || aviso "Quedo el trabajador $IDENT sin borrar."

# =============================================================================
titulo "RESULTADO"
# =============================================================================
if (( FALLOS == 0 )); then
	echo -e "  ${VERDE}Todo correcto: la conexion funciona y los datos se persisten.${FIN}\n"
	exit 0
fi
echo -e "  ${ROJO}$FALLOS comprobacion(es) fallida(s).${FIN}\n"
exit 1
