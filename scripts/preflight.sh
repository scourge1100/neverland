#!/bin/sh
set -eu

root_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$root_dir"

env_file=${ENV_FILE:-.env}
if [ ! -f "$env_file" ]; then
  echo "FAIL environment file not found: $env_file" >&2
  exit 1
fi

get_env() {
  sed -n "s/^$1=//p" "$env_file" | tail -n 1
}

failed=0
fail() { echo "FAIL $1" >&2; failed=1; }
pass() { echo "OK   $1"; }

site_domain=$(get_env SITE_DOMAIN)
url=$(get_env URL)
blog_url=$(get_env BLOG_BASE_URL)
database_password=$(get_env POSTGRES_PASSWORD)
oidc_secret=$(get_env OIDC_CLIENT_SECRET)
secret_key=$(get_env SECRET_KEY)
utils_secret=$(get_env UTILS_SECRET)
github_id=$(get_env GITHUB_CLIENT_ID)
github_secret=$(get_env GITHUB_CLIENT_SECRET)

case "$site_domain" in
  ""|portfolio.example.com|localhost*) domain_valid=0; fail "SITE_DOMAIN must be a real domain" ;;
  *) domain_valid=1; pass "production domain" ;;
esac

if [ "$domain_valid" -eq 1 ]; then
  expected_url="https://$site_domain"
  [ "$url" = "$expected_url" ] && pass "Outline URL matches domain" || fail "URL must be $expected_url"
  [ "$blog_url" = "$expected_url" ] && pass "blog URL matches domain" || fail "BLOG_BASE_URL must be $expected_url"
  [ "$(get_env DEX_ISSUER)" = "$expected_url/dex" ] && pass "Dex issuer" || fail "DEX_ISSUER must be $expected_url/dex"
  [ "$(get_env OIDC_REDIRECT_URI)" = "$expected_url/auth/oidc.callback" ] && pass "OIDC callback" || fail "OIDC_REDIRECT_URI mismatch"
  [ "$(get_env GITHUB_REDIRECT_URI)" = "$expected_url/dex/callback" ] && pass "GitHub callback" || fail "GITHUB_REDIRECT_URI mismatch"
fi

case "$database_password" in
  ""|outline_password|CHANGE_ME*) fail "POSTGRES_PASSWORD is still a default value" ;;
  *) [ "${#database_password}" -ge 16 ] && pass "database password" || fail "POSTGRES_PASSWORD must be at least 16 characters" ;;
esac

case "$oidc_secret" in
  ""|neverland-outline-secret|CHANGE_ME*) fail "OIDC_CLIENT_SECRET is still a default value" ;;
  *) [ "${#oidc_secret}" -ge 24 ] && pass "OIDC client secret" || fail "OIDC_CLIENT_SECRET must be at least 24 characters" ;;
esac

for item in SECRET_KEY UTILS_SECRET; do
  value=$(get_env "$item")
  case "$value" in
    ""|CHANGE_ME*) fail "$item is not configured" ;;
    *) [ "${#value}" -ge 64 ] && pass "$item" || fail "$item must be at least 64 characters" ;;
  esac
done

case "$github_id:$github_secret" in
  *CHANGE_ME*|:|*:) fail "GitHub OAuth credentials are not configured" ;;
  *) pass "GitHub OAuth credentials" ;;
esac

if [ "$failed" -ne 0 ]; then
  echo "Production preflight failed." >&2
  exit 1
fi

SITE_DOMAIN="$site_domain" docker compose -f docker-compose.yml -f docker-compose.prod.yml config --quiet
docker run --rm -e SITE_DOMAIN="$site_domain" -v "$root_dir/config:/etc/caddy:ro" caddy:2-alpine \
  caddy validate --config /etc/caddy/Caddyfile.prod >/dev/null

echo "Production preflight passed."
