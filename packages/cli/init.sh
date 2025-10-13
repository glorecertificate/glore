#!/usr/bin/env sh

export CLI=glore
export APP=elearning
export SUPABASE_TYPES=supabase/types.d.ts

. "$(git rev-parse --show-toplevel)/.env" 2>/dev/null
