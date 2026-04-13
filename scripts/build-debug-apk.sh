#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

npm run build
npx cap sync android

cd "$ROOT/android"
./gradlew assembleDebug

OUT="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
if [[ ! -f "$OUT" ]]; then
  echo "Error: no se encontró el APK en $OUT" >&2
  exit 1
fi

cp -f "$OUT" "$ROOT/hito2-app-debug.apk"
echo "Listo: $ROOT/hito2-app-debug.apk"
