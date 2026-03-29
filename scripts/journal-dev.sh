#!/usr/bin/env bash
# journal-dev — starts local Whisper server + Next.js dev in one command.
# Usage: npm run journal (from repo root)
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLUGIN_DIR="$REPO_DIR/plugins/obsidian-voicejournal"
UVICORN="$PLUGIN_DIR/.venv/bin/uvicorn"

RED='\033[0;31m'; CYAN='\033[0;36m'; RESET='\033[0m'
info() { echo -e "${CYAN}→${RESET} $*"; }
fail() { echo -e "${RED}✗${RESET} $*" >&2; exit 1; }

# ── preflight ──────────────────────────────────────────────────────────────────
[ -f "$UVICORN" ] || fail "Whisper venv not found. Run: cd plugins/obsidian-voicejournal && bash scripts/init.sh"

# Resolve claude binary (prefer CLAUDE_PATH env, then common locations)
if [ -z "${CLAUDE_PATH:-}" ]; then
  for candidate in \
    "$HOME/.local/bin/claude" \
    "/usr/local/bin/claude" \
    "/opt/homebrew/bin/claude"
  do
    if [ -x "$candidate" ]; then CLAUDE_PATH="$candidate"; break; fi
  done
fi
[ -n "${CLAUDE_PATH:-}" ] || CLAUDE_PATH="claude"   # last-resort: rely on PATH
export CLAUDE_PATH
info "Claude  : $CLAUDE_PATH"

# ── whisper server ─────────────────────────────────────────────────────────────
WHISPER_MODEL="${WHISPER_MODEL:-Systran/faster-whisper-small}"

# Kill any stale server already on port 8000
if lsof -ti tcp:8000 &>/dev/null; then
  info "Port 8000 already in use — killing existing process..."
  lsof -ti tcp:8000 | xargs kill -9 2>/dev/null || true
  sleep 1
fi

info "Starting Whisper server (model: $WHISPER_MODEL) ..."
cd "$PLUGIN_DIR"
FWS_MODEL_NAME="$WHISPER_MODEL" "$UVICORN" scripts.whisper_server:app \
  --port 8000 --log-level warning &
WHISPER_PID=$!

cleanup() {
  echo ""
  info "Stopping Whisper server (pid $WHISPER_PID)..."
  kill "$WHISPER_PID" 2>/dev/null || true
  wait "$WHISPER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# ── wait for model ─────────────────────────────────────────────────────────────
info "Waiting for model to load (first run may download ~460 MB) ..."
MAX_WAIT=300
elapsed=0
while [ $elapsed -lt $MAX_WAIT ]; do
  status=$(curl -sf http://localhost:8000/ready 2>/dev/null \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null \
    || true)
  [ "$status" = "ready" ] && break
  sleep 3; elapsed=$((elapsed + 3)); printf "."
done
echo ""
[ $elapsed -ge $MAX_WAIT ] && fail "Model did not load within ${MAX_WAIT}s"
info "Model ready."

# ── next.js dev ────────────────────────────────────────────────────────────────
echo ""
echo "  Whisper : http://localhost:8000"
echo "  Journal : http://localhost:3000/journal"
echo "  Stop    : Ctrl+C"
echo ""

cd "$REPO_DIR"
npm run dev
