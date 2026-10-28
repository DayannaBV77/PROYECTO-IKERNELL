#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND="$ROOT/frontend"
BACKEND="$ROOT/backend/backend/backend"

if [[ -z "${JAVA_HOME:-}" && -d "$HOME/.sdkman/candidates/java/current" ]]; then
    export JAVA_HOME="$HOME/.sdkman/candidates/java/current"
    export PATH="$JAVA_HOME/bin:$PATH"
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
