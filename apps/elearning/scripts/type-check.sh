#!/usr/bin/env sh

if [ "$NODE_ENV" != "production" ] && [ -z "$CI" ] && [ -z "$GITHUB_ACTIONS" ]; then
  tsc
  exit $?
fi

tsc -p tsconfig.build.json
