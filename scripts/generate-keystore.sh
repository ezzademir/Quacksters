#!/bin/zsh
set -euo pipefail

KEYSTORE_DIR="$(dirname "$0")/../android/keystore"
KEYSTORE_DIR="$(cd "$(dirname "$KEYSTORE_DIR")" && mkdir -p "$(basename "$KEYSTORE_DIR")" && cd "$KEYSTORE_DIR" && pwd)"
KEYSTORE_FILE="$KEYSTORE_DIR/quacksters-release.jks"

mkdir -p "$KEYSTORE_DIR"

if [ -f "$KEYSTORE_FILE" ]; then
  echo "Keystore already exists at $KEYSTORE_FILE"
  exit 0
fi

source "$(dirname "$0")/android-env.sh"

keytool -genkeypair \
  -v \
  -keystore "$KEYSTORE_FILE" \
  -alias quacksters \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass quacksters2025 \
  -keypass quacksters2025 \
  -dname "CN=Quackteow Group, OU=HR, O=Quackteow, L=Kuala Lumpur, ST=Selangor, C=MY"

echo ""
echo "Keystore created: $KEYSTORE_FILE"
echo "Copy android/keystore.properties.example to android/keystore.properties and update passwords."
