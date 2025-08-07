#!/usr/bin/env sh

if ! sh scripts/is_ci.sh; then
  tsc
  exit $?
fi

tsc -p tsconfig.build.json
