#!/bin/sh
set -eu

base_url=${BLOG_BASE_URL:-https://localhost:3443}
curl_options="-ksS"
failed=0

check() {
  route=$1
  expected=${2:-200}
  code=$(curl $curl_options -o /dev/null -w '%{http_code}' "$base_url$route")
  if [ "$code" = "$expected" ]; then
    printf 'OK   %-42s %s\n' "$route" "$code"
  else
    printf 'FAIL %-42s expected=%s actual=%s\n' "$route" "$expected" "$code"
    failed=1
  fi
}

check /
check /writing
check /writing/neverland-first-build
check /projects
check /projects/neverland
check /projects/empire-core-platform
check /projects/umpire-mobile
check /projects/realman-tailor
check /about
check /experience
check /categories/Build%20Log
check /tags/neverland
check /archive/2026
check '/search?q=Outline'
check /rss.xml
check /sitemap.xml
check /robots.txt
check /api/public/content.json
check /api/public/github.json

content=$(curl $curl_options "$base_url/api/public/content.json")
printf '%s' "$content" | jq -e '.writings | length >= 1' >/dev/null || failed=1
printf '%s' "$content" | jq -e '.projects | length >= 4' >/dev/null || failed=1
printf '%s' "$content" | jq -e '.pages | length >= 2' >/dev/null || failed=1

assert_contains() {
  route=$1
  expected=$2
  if curl $curl_options "$base_url$route" | grep -Fq "$expected"; then
    printf 'OK   %-42s contains expected content\n' "$route"
  else
    printf 'FAIL %-42s missing: %s\n' "$route" "$expected"
    failed=1
  fi
}

assert_contains /writing/neverland-first-build "Neverland 1차 구축 기록"
assert_contains /projects/empire-core-platform "ServiceType 기반 확장"
assert_contains /projects/umpire-mobile "푸시 등록 실패"
assert_contains /about "문제를 해결하고 기록하는 개발자"
assert_contains /experience "Backend Platform"
assert_contains '/search?q=Outline' "Neverland 1차 구축 기록"
assert_contains /rss.xml "<item>"
assert_contains /sitemap.xml "/experience</loc>"
assert_contains / "property=\"og:image\""

github=$(curl $curl_options "$base_url/api/public/github.json")
printf '%s' "$github" | jq -e '.username == "scourge1100" and (.repositories | length >= 1)' >/dev/null || failed=1

og_type=$(curl $curl_options -o /dev/null -w '%{content_type}' "$base_url/og-default.png")
case "$og_type" in
  image/png*) printf 'OK   %-42s %s\n' "/og-default.png" "$og_type" ;;
  *) printf 'FAIL %-42s invalid content type: %s\n' "/og-default.png" "$og_type"; failed=1 ;;
esac

exit "$failed"
