#!/usr/bin/env sh

. "$(dirname "$0")"/../init.sh

project_id="$(echo "$SUPABASE_DB_URL" | sed -E 's|.*@db\.([^.]+)\.supabase\.co:5432/postgres|\1|')"

echo "Generating database types..."
supabase gen types typescript --project-id "$project_id" > "$SUPABASE_TYPES"
echo "✓ Database types generated successfully"

next typegen
