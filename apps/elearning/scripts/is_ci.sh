#!/usr/bin/env sh

if [ "$ENV" = "production" ] || [ "$NODE_ENV" = "production" ] || [ "$GITHUB_ACTIONS" = "true" ] || [ "$CI" = "true" ] || [ "$CI" = 1 ]; then
  exit 0
fi

exit 1
