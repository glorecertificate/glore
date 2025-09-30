#!/usr/bin/env sh
# shellcheck disable=SC2068

. "$(dirname "$0")"/../init.sh

cd_app

PUBLIC_SCHEMA=public
PROTECTED_SCHEMA=auth
SCHEMA=$PUBLIC_SCHEMA,$PROTECTED_SCHEMA

SCHEMA_PATH=supabase/schema.sql
SEEDER_PATH=supabase/seed.ts
TYPES_PATH=supabase/types.d.ts

if [ -z "$SUPABASE_TOKEN" ] || [ -z "$SUPABASE_DB_URL" ]; then
  exit_with_error "SUPABASE_TOKEN and SUPABASE_DB_URL must be set"
fi

SUPABASE_PROJECT_ID=$(echo "$SUPABASE_DB_URL" | sed -E 's|.*@db\.([^.]+)\.supabase\.co:5432/postgres|\1|')
SUPABASE_DB_PASSWORD=$(echo "$SUPABASE_DB_URL" | sed -E 's|postgresql://postgres:(.*)@db\..*|\1|')

CMDS="
  dump <file> [--dry-run]     Generate a migration file from local schema changes
  migrate                     Apply pending migrations to the database
  prepare                     Prepare the local database for development
  pull <file>                 Pull schema changes from the remote database into a migration file
  push                        Push local migrations to the remote database
  reset                       Reset local database and run seeds
  restart                     Restart the Supabase local development environment
  revert <n>                  Resets applied migrations up to the last n versions (default: 1)
  seed                        Run database seed scripts
  start                       Start the Supabase local development environment
  status                      Show the status of the local Supabase environment
  stop                        Stop the Supabase local development environment
  sync                        Sync the local schema and types
  typegen                     Generate TypeScript types from database schema
  help, -h, --help            Show this help message"

cmd=$1
supabase="./node_modules/.bin/supabase"
tsx="./node_modules/.bin/tsx"

is_dev() {
  [ "$NODE_ENV" != "production" ] && [ -z "$CI" ] && [ -z "$GITHUB_ACTIONS" ]
}

if is_dev; then
  location=local
else
  location=linked
fi

init_db() {
  $supabase login --token "$SUPABASE_TOKEN" >/dev/null
  $supabase link --project-ref "$SUPABASE_PROJECT_ID" --password "$SUPABASE_DB_PASSWORD" >/dev/null 2>&1
  if is_dev; then
    echo "Starting database..."
    $supabase start >/dev/null 2>&1 && echo "✓ Database started"
  fi
  sync_types
}

sync_schema() {
  echo "Syncing database schema..."

  if $supabase db dump --schema $SCHEMA --file $SCHEMA_PATH --yes $@ >/dev/null 2>&1; then
    echo "✓ Database schema updated successfully"
  fi
}

sync_types() {
  echo "Generating database types..."

  arg="--$location"
  ! is_dev && arg="--project-id=$SUPABASE_PROJECT_ID"
  types=$($supabase gen types typescript --schema $SCHEMA "$arg")

  if [ -n "$types" ]; then
    for path in $TYPES_PATH; do
      [ ! -f "$path" ] && mkdir -p "$(dirname "$path")" && touch "$path"
      echo "$types" > "$path"
    done
    echo "✓ Database types generated successfully"
  fi
}

sync_db() {
  sync_schema $@
  sync_types
}

run_seeds() {
  $tsx "$SEEDER_PATH"
}

dump_db() {
  if [ "$1" = --dry-run ]; then
    $supabase db diff --schema $PUBLIC_SCHEMA --$location --yes
    return $?
  fi
  $supabase db diff --schema $PUBLIC_SCHEMA --file "$1" --$location --yes
  sync_schema --local
  sync_types
}

pull_db() {
  if $supabase db pull "$1" --schema $PUBLIC_SCHEMA --linked --yes; then
    sync_db --linked
  fi
}

reset_db() {
  ! $supabase db reset && return 1
  sync_db
  run_seeds
}

case $cmd in
  dump|pull)
    if [ -z "$2" ]; then
      exit_with_error "You must provide a migration name"
    fi
    eval "${cmd}_db $2"
    ;;
  migrate)
    $supabase migration up --schema $PUBLIC_SCHEMA
    ;;
  prepare)
    init_db
    ;;
  push)
    if is_dev; then
      printf "Are you sure you want to push the local config and update the remote schema? [y/N] "
      read -r response
      if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
        echo "Push cancelled."
        exit 0
      fi
    fi
    $supabase config push --yes
    $supabase db push --password "$SUPABASE_DB_PASSWORD" --include-all --yes
    ;;
  reset)
    reset_db
    ;;
  restart)
    $supabase stop
    init_db
    ;;
  revert)
    $supabase migration down --$location --yes
    ;;
  seed)
    run_seeds
    ;;
  start)
    $supabase start
    ;;
  status)
    $supabase status
    ;;
  stop)
    $supabase stop
    ;;
  sync)
    sync_db --local
    ;;
  typegen)
    sync_types
    ;;
  *)
    if [ -n "$cmd" ] && [ "$cmd" != help ] && [ "$cmd" != -h ] && [ "$cmd" != --help ]; then
      print_error "Unknown command '$cmd'"
      echo
      exit=1
    fi
    echo "Usage:"
    echo "  $CLI db [command]"
    echo
    echo "Commands: $CMDS"
    if [ "$exit" = 1 ]; then
      echo
      exit 1
    fi
    ;;
esac
