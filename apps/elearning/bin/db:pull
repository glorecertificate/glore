#!/usr/bin/env sh

PROTECTED_SCHEMAS=auth,storage

./node_modules/.bin/supabase db pull
./node_modules/.bin/supabase db pull --schema $PROTECTED_SCHEMAS
exit 0
