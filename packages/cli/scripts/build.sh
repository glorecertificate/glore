#!/usr/bin/env sh

echo "$(dirname "$0")/db.sh"

if ! sh "$(dirname "$0")/db.sh" typegen >/dev/null 2>&1; then
  echo "Error: Type generation failed"
  exit 1
fi

next build
