#!/usr/bin/env bash
#
# Build, install and run the Outflow dev client on an iOS SIMULATOR.
#
# Why this exists: on this setup `expo run:ios` incorrectly takes the physical
# device / code-signing path even for a simulator UDID. Building straight with
# xcodebuild to the simulator avoids that. We deliberately do NOT pass
# CODE_SIGNING_ALLOWED=NO so the app keeps its entitlements (ad-hoc signing is
# automatic for the simulator and needs no certificate or team).
#
set -euo pipefail
cd "$(dirname "$0")/.."

SCHEME="Outflow"
WORKSPACE="ios/Outflow.xcworkspace"
BUNDLE_ID="com.outflow.app"

if [ ! -d "$WORKSPACE" ]; then
  echo "→ Native iOS project missing; running prebuild..."
  npx expo prebuild --platform ios
fi

# Use a booted simulator if there is one, otherwise boot an available iPhone.
pick_booted() {
  xcrun simctl list devices booted -j | node -e \
    'const d=JSON.parse(require("fs").readFileSync(0));const b=Object.values(d.devices).flat().find(x=>x.state==="Booted");process.stdout.write(b?b.udid:"")'
}
pick_available_iphone() {
  xcrun simctl list devices available -j | node -e \
    'const d=JSON.parse(require("fs").readFileSync(0));const all=Object.entries(d.devices).filter(([k])=>/iOS/.test(k)).flatMap(([,v])=>v).filter(x=>x.isAvailable&&/iPhone/.test(x.name));const p=all[all.length-1]||all[0];process.stdout.write(p?p.udid:"")'
}

SIM_UDID="$(pick_booted)"
if [ -z "$SIM_UDID" ]; then
  SIM_UDID="$(pick_available_iphone)"
  if [ -z "$SIM_UDID" ]; then
    echo "✖ No iPhone simulator available. Install one via Xcode › Settings › Components."
    exit 1
  fi
  echo "→ Booting simulator $SIM_UDID..."
  xcrun simctl boot "$SIM_UDID"
fi
open -a Simulator

echo "→ Building $SCHEME for simulator $SIM_UDID (Debug)..."
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination "id=$SIM_UDID" \
  -derivedDataPath ios/build \
  build

APP="ios/build/Build/Products/Debug-iphonesimulator/$SCHEME.app"
echo "→ Installing and launching..."
xcrun simctl install "$SIM_UDID" "$APP"
xcrun simctl launch "$SIM_UDID" "$BUNDLE_ID" || true

echo "→ Starting Metro (dev client). Open the app and it will connect."
exec npx expo start --dev-client
