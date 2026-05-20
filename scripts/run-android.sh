#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

source "$ROOT/scripts/android-env.sh"

echo "→ Cleaning Gradle build..."
cd "$ROOT/android"
./gradlew clean

echo "→ Uninstalling old packages..."
adb uninstall com.company.onboarding 2>/dev/null || true
adb uninstall com.quackteow.onboarding 2>/dev/null || true

echo "→ Installing debug APK..."
./gradlew installDebug

echo "→ Launching Quacksters..."
adb shell am start -n com.quackteow.onboarding/.MainActivity

echo "Done."
