#!/bin/sh
set -eu

for key in DEX_ISSUER OIDC_REDIRECT_URI OIDC_CLIENT_SECRET GITHUB_CLIENT_ID GITHUB_CLIENT_SECRET GITHUB_REDIRECT_URI; do
  eval "value=\${$key:-}"
  if [ -z "$value" ]; then
    echo "Dex configuration is missing: $key" >&2
    exit 1
  fi
done

awk '
  {
    gsub(/__DEX_ISSUER__/, ENVIRON["DEX_ISSUER"])
    gsub(/__OIDC_REDIRECT_URI__/, ENVIRON["OIDC_REDIRECT_URI"])
    gsub(/__OIDC_CLIENT_SECRET__/, ENVIRON["OIDC_CLIENT_SECRET"])
    gsub(/__GITHUB_CLIENT_ID__/, ENVIRON["GITHUB_CLIENT_ID"])
    gsub(/__GITHUB_CLIENT_SECRET__/, ENVIRON["GITHUB_CLIENT_SECRET"])
    gsub(/__GITHUB_REDIRECT_URI__/, ENVIRON["GITHUB_REDIRECT_URI"])
    print
  }
' /etc/dex/config.template.yaml > /tmp/dex-config.yaml

exec dex serve /tmp/dex-config.yaml
