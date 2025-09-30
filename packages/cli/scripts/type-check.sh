#!/usr/bin/env sh

. "$(dirname "$0")"/../init.sh

TS_DEFAULT_PROJECT="tsconfig.json"
TS_BUILD_PROJECT="tsconfig.build.json"

if [ "$NODE_ENV" != "production" ] && [ -z "$CI" ] && [ -z "$GITHUB_ACTIONS" ]; then
  project=$TS_DEFAULT_PROJECT
else
  project=$TS_BUILD_PROJECT
fi

cd_app
tsc -p $project --noEmit

