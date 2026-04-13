#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Capacitor 8 compila con Java 21; Java 17 provoca: invalid source release: 21
if [[ -z "${JAVA_HOME:-}" ]]; then
  HB21="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
  if [[ -x "$HB21/bin/java" ]]; then
    export JAVA_HOME="$HB21"
  elif command -v /usr/libexec/java_home >/dev/null 2>&1; then
    J21="$(/usr/libexec/java_home -v 21 2>/dev/null || true)"
    if [[ -n "$J21" ]]; then
      export JAVA_HOME="$J21"
    fi
  fi
fi

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
