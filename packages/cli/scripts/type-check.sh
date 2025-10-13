#!/usr/bin/env sh

. "$(dirname "$0")"/../init.sh

if [ "$NODE_ENV" != "production" ] && [ -z "$CI" ]; then
  project=tsconfig.json
else
  project=tsconfig.build.json
fi

tsc -p $project --noEmit
