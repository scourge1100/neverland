#!/bin/sh
set -eu

root_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
timestamp=$(date +%Y%m%d-%H%M%S)
backup_root=${BACKUP_DIR:-"$root_dir/backups"}
retention_days=${BACKUP_RETENTION_DAYS:-14}
target="$backup_root/$timestamp"

mkdir -p "$target/outline-data"
cd "$root_dir"

postgres_user=$(sed -n 's/^POSTGRES_USER=//p' .env | tail -n 1)
postgres_db=$(sed -n 's/^POSTGRES_DB=//p' .env | tail -n 1)
postgres_user=${postgres_user:-outline}
postgres_db=${postgres_db:-outline}

echo "Backing up PostgreSQL..."
docker compose exec -T postgres pg_dump -U "$postgres_user" -d "$postgres_db" | gzip > "$target/postgres.sql.gz"

echo "Backing up Outline file storage..."
docker compose cp outline:/var/lib/outline/data/. "$target/outline-data" >/dev/null
tar -czf "$target/outline-data.tar.gz" -C "$target" outline-data
rm -rf "$target/outline-data"

(
  cd "$target"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum postgres.sql.gz outline-data.tar.gz > SHA256SUMS
  else
    shasum -a 256 postgres.sql.gz outline-data.tar.gz > SHA256SUMS
  fi
)

find "$backup_root" -mindepth 1 -maxdepth 1 -type d -mtime "+$retention_days" -exec rm -rf {} \;

echo "Backup complete: $target"
echo "Verify with: scripts/verify-backup.sh '$target'"
