#!/usr/bin/env sh

if ! sh ./scripts/typegen.sh >/dev/null 2>&1; then
  echo "Error: Type generation failed"
  exit 1
fi

./node_modules/.bin/next build
