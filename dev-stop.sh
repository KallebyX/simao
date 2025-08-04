#!/bin/bash

echo "🛑 Parando Whaticket..."

# Matar processos Node
killall node 2>/dev/null || true
killall npm 2>/dev/null || true

# Parar Docker
cd /workspaces/simao
docker-compose down

echo "✅ Sistema parado!"
