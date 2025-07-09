#!/usr/bin/env sh

rm -rf ./.next/cache
./node_modules/.bin/supabase start 2>/dev/null
echo ""
./node_modules/.bin/next dev --turbo
