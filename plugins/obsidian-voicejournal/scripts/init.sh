#!/usr/bin/env bash
# VoiceJournal one-time setup
# Run once after cloning the repo: npm run plugin:init
set -euo pipefail

PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$PLUGIN_DIR/../.." && pwd)"
VENV_DIR="$PLUGIN_DIR/.venv"

# ── colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; RESET='\033[0m'
ok()   { echo -e "${GREEN}✓${RESET} $*"; }
info() { echo -e "${CYAN}→${RESET} $*"; }
fail() { echo -e "${RED}✗${RESET} $*" >&2; exit 1; }

echo ""
echo "=== VoiceJournal Setup ==="
echo ""

# ── 1. claude CLI ─────────────────────────────────────────────────────────────
if ! command -v claude &>/dev/null; then
  fail "'claude' not found. Install Claude Code: https://claude.ai/code"
fi
ok "claude ($(claude --version 2>&1 | head -1))"

# ── 2. Python 3.10+ ───────────────────────────────────────────────────────────
PYTHON=""
for cmd in python3.12 python3.11 python3.10 python3 python; do
  if command -v "$cmd" &>/dev/null \
     && "$cmd" -c "import sys; exit(0 if sys.version_info >= (3,10) else 1)" 2>/dev/null; then
    PYTHON="$cmd"
    break
  fi
done
[ -n "$PYTHON" ] || fail "Python 3.10+ required. Install from https://python.org"
ok "$($PYTHON --version)"

# ── 3. Python venv ────────────────────────────────────────────────────────────
if [ ! -d "$VENV_DIR" ]; then
  info "Creating Python venv at plugins/obsidian-voicejournal/.venv ..."
  "$PYTHON" -m venv "$VENV_DIR"
fi
ok "venv ready"

# ── 4. faster-whisper-server ──────────────────────────────────────────────────
info "Installing faster-whisper-server (may take a minute on first run)..."
"$VENV_DIR/bin/pip" install --quiet --upgrade pip
"$VENV_DIR/bin/pip" install --quiet --upgrade faster-whisper-server
ok "faster-whisper-server installed"

# ── 5. npm deps ───────────────────────────────────────────────────────────────
info "Installing npm dependencies..."
npm install --prefix "$PLUGIN_DIR" --silent
ok "npm deps installed"

# ── 6. first build ────────────────────────────────────────────────────────────
info "Building plugin..."
npm run build --prefix "$PLUGIN_DIR"
ok "Plugin built → content/.obsidian/plugins/voice-journal/main.js"

# ── 7. vault skeleton ─────────────────────────────────────────────────────────
mkdir -p "$REPO_ROOT/content/journal"
ok "Vault journal folder ready"

echo ""
echo "=== Setup complete ==="
echo ""
echo "  Next steps:"
echo "  1. Open Obsidian → 'Open folder as vault' → select content/"
echo "  2. Settings → Community plugins → disable Safe mode → enable VoiceJournal"
echo "  3. npm run plugin:run   (starts Whisper server + watch mode)"
echo ""
