#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! xcodebuild -version >/dev/null 2>&1; then
  echo "Full Xcode is required (not Command Line Tools only)."
  echo "Install Xcode from the App Store, then run:"
  echo "  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
  exit 1
fi

echo "→ Building web assets and syncing to iOS..."
npm run cap:sync

SIMULATOR="${IOS_SIMULATOR:-iPhone 16}"
SCHEME="App"
PROJECT="$ROOT/ios/App/App.xcodeproj"

echo "→ Building for simulator: $SIMULATOR"
xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -destination "platform=iOS Simulator,name=$SIMULATOR" \
  -configuration Debug \
  build

echo "→ Opening Xcode (use Run ▶ for device or a different simulator)..."
npx cap open ios

echo "Done."
