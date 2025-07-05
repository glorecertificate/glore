#!/usr/bin/env sh

SCHEMAS=auth,public,storage
MIGRATIONS_PATH=./supabase/migrations

file=$1

if [ -z "$file" ]; then
  echo "You must provide a migration name."
  echo "Usage: $0 <migration_name>"
  exit 1
fi

if (
  ./node_modules/.bin/supabase db diff --schema $SCHEMAS --file "$file" && 
  ./node_modules/.bin/prettier --write $MIGRATIONS_PATH/*_"$file".sql >/dev/null 2>&1
); then
  ./node_modules/.bin/snaplet-seed sync >/dev/null 2>&1
  sh ./scripts/typegen.sh
fi
