#!/usr/bin/env sh
set -eu

docker run --rm \
  -v /home/peterlee/app/letsencrypt:/etc/letsencrypt \
  -v /home/peterlee/app/web-dist:/var/www/html \
  certbot/certbot:latest renew --quiet

docker exec frontend nginx -t
docker exec frontend nginx -s reload
