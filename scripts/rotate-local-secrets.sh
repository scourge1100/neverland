#!/bin/sh
set -eu

root_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$root_dir"

if [ ! -f .env ]; then
  echo "Missing .env" >&2
  exit 1
fi

postgres_user=$(sed -n 's/^POSTGRES_USER=//p' .env | tail -n 1)
postgres_db=$(sed -n 's/^POSTGRES_DB=//p' .env | tail -n 1)
postgres_user=${postgres_user:-outline}
postgres_db=${postgres_db:-outline}

case "$postgres_user:$postgres_db" in
  *[!A-Za-z0-9_:]*) echo "Unsafe PostgreSQL identifier" >&2; exit 1 ;;
esac

database_password=$(openssl rand -hex 32)
oidc_secret=$(openssl rand -hex 32)

docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$postgres_user" -d "$postgres_db" \
  -c "ALTER ROLE \"$postgres_user\" WITH PASSWORD '$database_password';" >/dev/null

replace_env() {
  key=$1
  value=$2
  temp_file=$(mktemp "${TMPDIR:-/tmp}/neverland-env.XXXXXX")
  awk -v key="$key" -v value="$value" '
    BEGIN { found = 0 }
    index($0, key "=") == 1 { print key "=" value; found = 1; next }
    { print }
    END { if (!found) print key "=" value }
  ' .env > "$temp_file"
  chmod 600 "$temp_file"
  mv "$temp_file" .env
}

replace_env POSTGRES_PASSWORD "$database_password"
replace_env DATABASE_URL "postgres://$postgres_user:$database_password@postgres:5432/$postgres_db"
replace_env OIDC_CLIENT_SECRET "$oidc_secret"

unset database_password oidc_secret
echo "PostgreSQL and OIDC secrets rotated. Values were not printed."
