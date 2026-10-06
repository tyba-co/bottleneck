#!/bin/sh
# Healthy once every node sees a complete cluster and every replica finished its initial sync, which forks its master
PORTS="${REDIS_CLUSTER_PORTS:-30001 30002 30003 30004 30005 30006}"

for port in $PORTS; do
  redis-cli -p "$port" cluster info | grep -q 'cluster_state:ok' || exit 1
  redis-cli -p "$port" info replication | grep -Eq 'role:master|master_link_status:up' || exit 1
done
