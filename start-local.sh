#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND="$ROOT/frontend"
BACKEND="$ROOT/backend/backend/backend"

if [[ -z "${JAVA_HOME:-}" && -x /usr/lib/jvm/java-21-temurin-jdk/bin/java ]]; then
    export JAVA_HOME="/usr/lib/jvm/java-21-temurin-jdk"
elif [[ -z "${JAVA_HOME:-}" ]]; then
    for candidate in "$HOME"/.sdkman/candidates/java/21*; do
        if [[ -x "$candidate/bin/java" ]]; then
            export JAVA_HOME="$candidate"
            break
        fi
    done
fi

if [[ -n "${JAVA_HOME:-}" ]]; then
    export PATH="$JAVA_HOME/bin:$PATH"
fi

JAVA_COMMAND="${JAVA_HOME:+$JAVA_HOME/bin/}java"
if ! "$JAVA_COMMAND" -version 2>&1 | grep -Eq 'version "21([.]|")'; then
    echo ">> Se requiere Java 21 LTS para iniciar el backend. Configura JAVA_HOME con un JDK 21." >&2
    exit 1
fi

if [[ ! -f "$BACKEND/.env" && -f "$BACKEND/.env.example" ]]; then
    cp "$BACKEND/.env.example" "$BACKEND/.env"
    echo ">> Creado $BACKEND/.env a partir de .env.example (verifica IKERNELL_DB_PASSWORD)."
fi

echo ">> Iniciando Backend en segundo plano (http://localhost:8080)..."
(cd "$BACKEND" && ./mvnw spring-boot:run) &
BACKEND_PID=$!

echo ">> Iniciando Frontend en segundo plano (http://localhost:5173)..."
(cd "$FRONTEND" && pnpm install --frozen-lockfile && pnpm run dev -- --host 0.0.0.0 --port 5173) &
FRONTEND_PID=$!

trap 'kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true' EXIT INT TERM

echo ">> Esperando a que los servicios estén listos..."
wait
