#!/bin/bash
# Script zum Installieren von lightningcss native Binaries für Docker

set -e

echo "🔧 Installiere lightningcss native Binaries..."

# Stelle sicher, dass npm die richtige Plattform verwendet
export npm_config_target_platform=linux
export npm_config_target_arch=x64
export npm_config_target_libc=gnu

# Installiere lightningcss mit expliziten Flags
npm install --force --include=optional lightningcss@1.30.1 || {
  echo "⚠️ Direkte Installation fehlgeschlagen, versuche rebuild..."
  npm rebuild lightningcss --force || {
    echo "⚠️ Rebuild fehlgeschlagen, versuche manuellen Download..."
    # Versuche manuellen Download der Binary
    cd node_modules/lightningcss || exit 1
    mkdir -p linux-x64-gnu
    # Download der Binary von npm registry
    curl -L "https://registry.npmjs.org/lightningcss/-/lightningcss-1.30.1.tgz" -o /tmp/lightningcss.tgz || exit 1
    tar -xzf /tmp/lightningcss.tgz -C /tmp/ || exit 1
    # Kopiere Binary falls vorhanden
    if [ -f "/tmp/package/lightningcss.linux-x64-gnu.node" ]; then
      cp /tmp/package/lightningcss.linux-x64-gnu.node linux-x64-gnu/ || exit 1
      echo "✅ Binary manuell kopiert"
    else
      echo "❌ Binary nicht gefunden"
      exit 1
    fi
  }
}

echo "✅ lightningcss Installation abgeschlossen"

