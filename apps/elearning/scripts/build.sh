#!/usr/bin/env sh

if ! sh scripts/db.sh typegen >/dev/null 2>&1; then
  echo "Error: Type generation failed"
  exit 1
fi

next build
