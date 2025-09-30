#!/usr/bin/env sh

. "$(dirname "$0")"/../init.sh

cd_app
supabase functions serve
