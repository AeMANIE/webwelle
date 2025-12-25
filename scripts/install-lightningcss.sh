#!/bin/bash
# Script zum Installieren von lightningcss native Binaries für Docker
# WICHTIG: Kein 'set -e' - wir wollen Fehler abfangen und weiter versuchen

echo "🔧 Installiere lightningcss native Binaries..."

# Stelle sicher, dass npm die richtige Plattform verwendet
export npm_config_target_platform=linux
export npm_config_target_arch=x64
export npm_config_target_libc=gnu

# Methode 1: Versuche normale Installation mit optional Dependencies
echo "📦 Versuche normale Installation..."
if npm install --force --include=optional lightningcss@1.30.1 2>&1; then
  echo "✅ Installation erfolgreich"
  exit 0
fi

# Methode 2: Versuche Rebuild
echo "⚠️ Installation fehlgeschlagen, versuche rebuild..."
if npm rebuild lightningcss --force 2>&1; then
  echo "✅ Rebuild erfolgreich"
  exit 0
fi

# Methode 3: Prüfe ob Binary bereits vorhanden ist
echo "⚠️ Rebuild fehlgeschlagen, prüfe ob Binary bereits vorhanden..."
if [ -f "node_modules/lightningcss/lightningcss.linux-x64-gnu.node" ]; then
  echo "✅ Binary bereits vorhanden"
  exit 0
fi

# Methode 4: Versuche manuellen Download
echo "⚠️ Binary nicht gefunden, versuche manuellen Download..."
cd node_modules/lightningcss 2>/dev/null || {
  echo "⚠️ lightningcss node_modules nicht gefunden, versuche Installation erneut..."
  npm install --include=optional lightningcss@1.30.1 || true
  cd node_modules/lightningcss 2>/dev/null || {
    echo "❌ Kann nicht in lightningcss Verzeichnis wechseln"
    exit 0  # Nicht als Fehler behandeln - Build kann trotzdem funktionieren
  }
}

# Erstelle Verzeichnis für Binary
mkdir -p linux-x64-gnu 2>/dev/null || true

# Versuche Binary von verschiedenen Quellen zu holen
if [ ! -f "lightningcss.linux-x64-gnu.node" ]; then
  echo "📥 Lade Binary herunter..."
  # Versuche von GitHub Releases
  curl -L "https://github.com/parcel-bundler/lightningcss/releases/download/v1.30.1/lightningcss-linux-x64-gnu.tar.gz" -o /tmp/lightningcss-bin.tar.gz 2>/dev/null && {
    tar -xzf /tmp/lightningcss-bin.tar.gz -C /tmp/ 2>/dev/null && {
      if [ -f "/tmp/lightningcss.linux-x64-gnu.node" ]; then
        cp /tmp/lightningcss.linux-x64-gnu.node . 2>/dev/null && echo "✅ Binary von GitHub kopiert"
      fi
    }
  } || true
fi

# Finale Prüfung
if [ -f "lightningcss.linux-x64-gnu.node" ] || [ -f "../lightningcss.linux-x64-gnu.node" ]; then
  echo "✅ lightningcss Binary gefunden"
  exit 0
else
  echo "⚠️ lightningcss Binary nicht gefunden - Build wird trotzdem versucht"
  echo "⚠️ Falls Build fehlschlägt, bitte Tailwind CSS v3 verwenden"
  exit 0  # Nicht als Fehler behandeln
fi

