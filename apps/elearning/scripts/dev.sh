#!/usr/bin/env sh

rm -rf .next/cache
sh scripts/db.sh start 2>/dev/null
echo
next dev --turbo
