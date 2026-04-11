#!/usr/bin/env bash
# Creates node_modules for test fixtures.
# Run before tests: npm run setup-fixtures (or automatically via pretest).
set -euo pipefail

DIR="$(cd "$(dirname "$0")/fixtures" && pwd)"

# --- fake-project: hand-crafted stub packages ---
FP="$DIR/fake-project/node_modules"
rm -rf "$FP"
mkdir -p "$FP/@scope/isc-pkg"

echo '{"name":"mit-pkg","version":"1.0.0","license":"MIT","dependencies":{"transitive-pkg":"1.0.0"}}' > "$FP/mit-pkg/package.json" 2>/dev/null || { mkdir -p "$FP/mit-pkg"; echo '{"name":"mit-pkg","version":"1.0.0","license":"MIT","dependencies":{"transitive-pkg":"1.0.0"}}' > "$FP/mit-pkg/package.json"; }

for pkg in copyleft-and dev-only-pkg dual-or lead-pkg legacy-array legacy-obj no-license transitive-pkg unlicensed-pkg; do
  mkdir -p "$FP/$pkg"
done

echo '{"name":"@scope/isc-pkg","version":"2.0.0","license":"ISC"}' > "$FP/@scope/isc-pkg/package.json"
echo '{"name":"copyleft-and","version":"1.0.0","license":"(MIT AND GPL-3.0-only)"}' > "$FP/copyleft-and/package.json"
echo '{"name":"dev-only-pkg","version":"1.0.0","license":"MIT"}' > "$FP/dev-only-pkg/package.json"
echo '{"name":"dual-or","version":"1.0.0","license":"(MIT OR Apache-2.0)"}' > "$FP/dual-or/package.json"
echo '{"name":"lead-pkg","version":"1.0.0","license":"0BSD"}' > "$FP/lead-pkg/package.json"
echo '{"name":"legacy-array","version":"1.0.0","licenses":[{"type":"MIT"},{"type":"ISC"}]}' > "$FP/legacy-array/package.json"
echo '{"name":"legacy-obj","version":"1.0.0","license":{"type":"MIT","url":"https://opensource.org/licenses/MIT"}}' > "$FP/legacy-obj/package.json"
echo '{"name":"no-license","version":"1.0.0"}' > "$FP/no-license/package.json"
echo '{"name":"transitive-pkg","version":"1.0.0","license":"MIT"}' > "$FP/transitive-pkg/package.json"
echo '{"name":"unlicensed-pkg","version":"1.0.0","license":"UNLICENSED"}' > "$FP/unlicensed-pkg/package.json"

# --- config-project: symlink to fake-project ---
rm -f "$DIR/config-project/node_modules"
ln -s ../fake-project/node_modules "$DIR/config-project/node_modules"

# --- empty-project: node_modules with no packages ---
mkdir -p "$DIR/empty-project/node_modules"
