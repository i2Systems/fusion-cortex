#!/bin/bash
# Wait for PostgreSQL to be ready before starting the app
# Prevents startup freeze when DB isn't ready yet

CONTAINER="${FUSION_DB_CONTAINER:-fusion-cortex-db}"
MAX_ATTEMPTS=30
INTERVAL=1

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker is not running. Start Docker Desktop first."
  exit 1
fi

# Wait for container to exist and be running
echo "⏳ Waiting for PostgreSQL (container: $CONTAINER)..."
for i in $(seq 1 $MAX_ATTEMPTS); do
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${CONTAINER}$"; then
    break
  fi
  if [ $i -eq $MAX_ATTEMPTS ]; then
    echo "❌ Container $CONTAINER not found. Run: npm run db:up"
    exit 1
  fi
  sleep $INTERVAL
done

# Wait for PostgreSQL to accept connections
for i in $(seq 1 $MAX_ATTEMPTS); do
  if docker exec "$CONTAINER" pg_isready -U postgres -q 2>/dev/null; then
    echo "✅ Database is ready"
    exit 0
  fi
  if [ $i -eq 1 ]; then
    echo "   (PostgreSQL may take 5-15s to start on first run)"
  fi
  sleep $INTERVAL
done

echo "❌ Database did not become ready after ${MAX_ATTEMPTS}s"
echo "   Check: docker compose ps"
echo "   Logs:  docker compose logs postgres"
exit 1
