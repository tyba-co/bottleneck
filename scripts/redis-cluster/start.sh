#!/bin/sh
# Starts a 3-master / 3-replica Redis Cluster on one host. Ports start at 30001 because macOS AirPlay holds 7000.
set -e

PORTS="${REDIS_CLUSTER_PORTS:-30001 30002 30003 30004 30005 30006}"
DATA_DIR="${REDIS_CLUSTER_DIR:-/data}"

for port in $PORTS; do
  mkdir -p "$DATA_DIR/$port"
  redis-server --port "$port" \
    --cluster-enabled yes \
    --cluster-config-file "$DATA_DIR/$port/nodes.conf" \
    --cluster-announce-ip 127.0.0.1 \
    --dir "$DATA_DIR/$port" \
    --save "" --appendonly no \
    --daemonize yes \
    --logfile "$DATA_DIR/$port.log"
done

for port in $PORTS; do
  until redis-cli -p "$port" ping >/dev/null 2>&1; do sleep 0.1; done
done

redis-cli --cluster create $(for port in $PORTS; do printf '127.0.0.1:%s ' "$port"; done) --cluster-replicas 1 --cluster-yes
