#!/usr/bin/env sh

. "$(dirname "$0")"/../init.sh

cd_app
rm -rf .next/cache
$CLI db start 2>/dev/null
echo
next dev --turbo
