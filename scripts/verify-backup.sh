#!/bin/sh
set -eu

target=${1:-}
if [ -z "$target" ] || [ ! -f "$target/SHA256SUMS" ]; then
  echo "Usage: scripts/verify-backup.sh backups/YYYYMMDD-HHMMSS" >&2
  exit 1
fi

cd "$target"
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum -c SHA256SUMS
else
  shasum -a 256 -c SHA256SUMS
fi
