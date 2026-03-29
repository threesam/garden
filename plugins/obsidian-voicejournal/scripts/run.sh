#!/usr/bin/env bash
# VoiceJournal dev runner
# Starts the local Whisper server + plugin watch mode together.
# Stop both with Ctrl+C.
set -euo pipefail

PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="$PLUGIN_DIR/.venv"
UVICORN="$VENV_DIR/bin/uvicorn"

RED='\033[0;31m'; CYAN='\033[0;36m'; RESET='\033[0m'
info() { echo -e "${CYAN}→${RESET} $*"; }
fail() { echo -e "${RED}✗${RESET} $*" >&2; exit 1; }

# ── preflight ─────────────────────────────────────────────────────────────────
[ -f "$UVICORN" ] || fail "Whisper server not installed. Run: npm run plugin:init"
command -v claude &>/dev/null || fail "'claude' not found. Run: npm run plugin:init"

# ── start whisper server ──────────────────────────────────────────────────────
info "Starting Whisper server on http://localhost:8000 ..."
"$UVICORN" faster_whisper_server.app:app --port 8000 --log-level warning &
WHISPER_PID=$!

cleanup() {
  echo ""
  info "Stopping Whisper server (pid $WHISPER_PID)..."
  kill "$WHISPER_PID" 2>/dev/null || true
  wait "$WHISPER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# brief pause so uvicorn is ready before esbuild watch starts printing
sleep 1

echo ""
echo "  Whisper : http://localhost:8000"
echo "  Claude  : local claude CLI"
echo "  Plugin  : watch mode — rebuilds on save"
echo "  Stop    : Ctrl+C"
echo ""

# ── start plugin watch ────────────────────────────────────────────────────────
npm run dev --prefix "$PLUGIN_DIR"
