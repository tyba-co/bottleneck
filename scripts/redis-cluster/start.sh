#!/bin/sh
# Starts a 3-master / 3-replica Redis Cluster on one host. Ports start at 30001 because macOS AirPlay holds 7000.
set -e

PORTS="${REDIS_CLUSTER_PORTS:-30001 30002 30003 30004 30005 30006}"
DATA_DIR="${REDIS_CLUSTER_DIR:-/data}"
NODE_START_ATTEMPTS=100

print_node_logs() {
  for port in $PORTS; do
    echo "--- node $port"
    tail -n 30 "$DATA_DIR/$port.log" 2>/dev/null || true
  done
}

wait_for_node() {
  attempts=0
  until redis-cli -p "$1" ping >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge "$NODE_START_ATTEMPTS" ]; then
      echo "Node $1 did not start"
      return 1
    fi
    sleep 0.1
  done
}

echo "Starting nodes $PORTS"
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
  wait_for_node "$port" || { print_node_logs; exit 1; }
done

echo "Creating the cluster"
redis-cli --cluster create $(for port in $PORTS; do printf '127.0.0.1:%s ' "$port"; done) --cluster-replicas 1 --cluster-yes \
  || { print_node_logs; exit 1; }
echo "Cluster created"
