#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}"
export COPYFILE_DISABLE=1

if ! "$DEVELOPER_DIR/usr/bin/xcodebuild" -version >/dev/null 2>&1; then
  echo "Full Xcode is required (not Command Line Tools only)."
  echo "Install Xcode from the App Store, then run:"
  echo "  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
  exit 1
fi

SIMULATOR_ID="${IOS_SIMULATOR_ID:-}"
if [[ -z "$SIMULATOR_ID" ]]; then
  SIMULATOR_ID="$("$DEVELOPER_DIR/usr/bin/xcrun" simctl list devices available -j \
    | /usr/bin/python3 -c "
import json, sys
data = json.load(sys.stdin)
for runtime, devices in data.get('devices', {}).items():
    if 'iOS' not in runtime:
        continue
    for device in devices:
        if device.get('isAvailable') and device.get('name') == '${IOS_SIMULATOR:-iPhone 16}':
            print(device['udid'])
            raise SystemExit(0)
for runtime, devices in data.get('devices', {}).items():
    if 'iOS' not in runtime:
        continue
    for device in devices:
        if device.get('isAvailable') and device.get('name', '').startswith('iPhone'):
            print(device['udid'])
            raise SystemExit(0)
raise SystemExit('No iOS simulator found')
")"
fi

DERIVED_DATA="${IOS_DERIVED_DATA:-/tmp/quacksters-ios-build}"
SCHEME="App"
PROJECT="$ROOT/ios/App/App.xcodeproj"
CONFIG="${IOS_CONFIGURATION:-Release}"

echo "→ Building web assets and syncing to iOS..."
npm run cap:sync

echo "→ Clearing extended attributes (Desktop/iCloud can break codesign)..."
xattr -cr "$ROOT/ios/App" "$ROOT/dist" 2>/dev/null || true

echo "→ Building for iOS Simulator ($SIMULATOR_ID, $CONFIG)..."
"$DEVELOPER_DIR/usr/bin/xcodebuild" \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -destination "platform=iOS Simulator,id=$SIMULATOR_ID" \
  -configuration "$CONFIG" \
  -derivedDataPath "$DERIVED_DATA" \
  build

OUTPUT_DIR="$ROOT/ios/output"
mkdir -p "$OUTPUT_DIR"
rm -rf "$OUTPUT_DIR/Quacksters.app"
cp -R "$DERIVED_DATA/Build/Products/${CONFIG}-iphonesimulator/App.app" "$OUTPUT_DIR/Quacksters.app"

echo ""
echo "Build succeeded."
echo "Simulator app: $OUTPUT_DIR/Quacksters.app"
echo ""
echo "Install on simulator:"
echo "  xcrun simctl install booted \"$OUTPUT_DIR/Quacksters.app\""
echo "  xcrun simctl launch booted com.quackteow.onboarding"
