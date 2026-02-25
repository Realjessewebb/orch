#!/usr/bin/env bash
set -e

ORCH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ORCH_CONFIG="$HOME/.config/orch"
CONTEXT_DIR="$ORCH_CONFIG/context"

echo ""
echo "Installing orch..."
echo ""

# Install dependencies and build
echo "→ Installing dependencies..."
cd "$ORCH_DIR"
npm install --silent

echo "→ Building TypeScript..."
npm run build

echo "→ Linking 'orch' command to ~/.local/bin/orch..."
chmod +x "$ORCH_DIR/dist/cli.js"
mkdir -p "$HOME/.local/bin"
ln -sf "$ORCH_DIR/dist/cli.js" "$HOME/.local/bin/orch"
# Ensure ~/.local/bin is on PATH
if ! echo "$PATH" | grep -q "$HOME/.local/bin"; then
  echo ""
  echo "  Note: Add ~/.local/bin to your PATH if 'orch' is not found."
  echo "  Add this to ~/.zshrc or ~/.bashrc:"
  echo '  export PATH="$HOME/.local/bin:$PATH"'
fi

# Scaffold global config directory
mkdir -p "$CONTEXT_DIR/skills"
mkdir -p "$CONTEXT_DIR/notes"
mkdir -p "$ORCH_CONFIG/worktrees"

# Copy starter templates (don't overwrite if already customized)
copy_if_missing() {
  local src="$1"
  local dest="$2"
  if [ ! -f "$dest" ]; then
    cp "$src" "$dest"
    echo "  create  $dest"
  else
    echo "  skip    $dest (already exists)"
  fi
}

echo "→ Setting up context directory at $CONTEXT_DIR..."
copy_if_missing "$ORCH_DIR/templates/context/MEMORY.md"            "$CONTEXT_DIR/MEMORY.md"
copy_if_missing "$ORCH_DIR/templates/context/business.md"           "$CONTEXT_DIR/business.md"
copy_if_missing "$ORCH_DIR/templates/context/skills/implement-feature.md" "$CONTEXT_DIR/skills/implement-feature.md"
copy_if_missing "$ORCH_DIR/templates/context/skills/fix-bug.md"     "$CONTEXT_DIR/skills/fix-bug.md"
copy_if_missing "$ORCH_DIR/templates/context/skills/refactor.md"    "$CONTEXT_DIR/skills/refactor.md"

# Create empty registry if it doesn't exist
REGISTRY="$ORCH_CONFIG/registry.json"
if [ ! -f "$REGISTRY" ]; then
  echo '{"version":1,"tasks":{}}' > "$REGISTRY"
  echo "  create  $REGISTRY"
fi

# Create global config if it doesn't exist
GLOBAL_CONFIG="$ORCH_CONFIG/global.yaml"
if [ ! -f "$GLOBAL_CONFIG" ]; then
  cat > "$GLOBAL_CONFIG" << 'EOF'
# orch global config
# Set obsidian_vault to your vault path to see all .md artifacts in Obsidian
obsidian_vault: null

# Where orch stores your knowledge base (memory, business context, skills)
# context_dir: ~/.config/orch/context  # default

# Where orch creates git worktrees for agents
# worktrees_dir: ~/.config/orch/worktrees  # default
EOF
  echo "  create  $GLOBAL_CONFIG"
fi

echo ""
echo "✓ orch installed successfully!"
echo ""
echo "Next steps:"
echo "  1. Edit $CONTEXT_DIR/business.md — add your business context"
echo "  2. Edit $CONTEXT_DIR/MEMORY.md — add any initial notes"
echo "  3. (Optional) Set obsidian_vault in $GLOBAL_CONFIG"
echo "     to see all run summaries in your Obsidian vault"
echo "  4. Go to a repo and run: orch init"
echo "  5. Then run: orch run <task.md>"
echo ""
echo "  orch --help  for all commands"
echo ""
