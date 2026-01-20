#!/bin/sh
set -eu

echo "[SAM] Booting..."

# Prefer absolute path to avoid PATH issues
SAM_CLI="/opt/venv/bin/solace-agent-mesh"
if [ ! -x "$SAM_CLI" ]; then
  SAM_CLI="$(command -v solace-agent-mesh 2>/dev/null || true)"
fi
if [ -z "${SAM_CLI:-}" ]; then
  SAM_CLI="$(command -v sam 2>/dev/null || true)"
fi
if [ -z "${SAM_CLI:-}" ]; then
  echo "[SAM] ERROR: Could not find the SAM CLI (sam / solace-agent-mesh) in the container."
  echo "[SAM] Debug: contents of /opt/venv/bin:"
  ls -la /opt/venv/bin || true
  echo "[SAM] Debug: PATH=$PATH"
  exit 1
fi

echo "[SAM] Using CLI: $SAM_CLI"

# Optional: show version
"$SAM_CLI" --version || true

# Install the Event Mesh Gateway Python package directly (without sam plugin add)
# This avoids generating the template config file each time
echo "[SAM] Installing sam_event_mesh_gateway Python package..."
pip install "git+https://github.com/SolaceLabs/solace-agent-mesh-core-plugins@main#subdirectory=sam-event-mesh-gateway"

# Clean up any auto-generated gateway template file (we use our own config)
if [ -f "configs/gateways/inbox-event-mesh-gateway.yaml" ]; then
  echo "[SAM] Removing auto-generated gateway template file..."
  rm -f "configs/gateways/inbox-event-mesh-gateway.yaml"
fi

# Run agents + gateway configs
# Update these paths if your configs differ.
echo "[SAM] Starting SAM run..."
exec "$SAM_CLI" run \
  configs/agents/spam_agent.yaml \
  configs/agents/priority_agent.yaml \
  configs/agents/summary_agent.yaml \
  configs/agents/action_items_agent.yaml \
  configs/agents/email_tone_analyzer.yaml \
  configs/agents/url-scanner.yaml \
  configs/agents/email_query_agent.yaml \
  configs/gateways/inbox-event-mesh.yaml
