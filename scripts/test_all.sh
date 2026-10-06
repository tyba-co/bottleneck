#!/usr/bin/env bash
# Requires Redis on 127.0.0.1:6379 and a Redis Cluster on 30001-30006: docker compose -f docker-compose.test.yml up -d --wait

set -e

npm run build

for suite in local es5 light redis cluster; do
  echo "[T] $suite"
  npm run -s "test:$suite"
done
