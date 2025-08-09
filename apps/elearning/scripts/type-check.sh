#!/usr/bin/env sh

is_dev() {
  [ "$ENV" != "production" ] && [ "$NODE_ENV" != "production" ] && [ "$GITHUB_ACTIONS" != "true" ] && [ "$CI" != "true" ] && [ "$CI" != 1 ]
}

if is_dev; then
  tsc
  exit $?
fi

tsc -p tsconfig.build.json
