#!/usr/bin/env sh
# shellcheck disable=SC2068

PUBLIC_SCHEMA=public
PROTECTED_SCHEMA=auth,storage
SCHEMA=$PUBLIC_SCHEMA,$PROTECTED_SCHEMA

MIGRATIONS_PATH=supabase/migrations
SCHEMA_PATH=supabase/schema.sql
TYPES_PATH=supabase/types.ts

[ -f .env ] && . .env

if [ -z "$SUPABASE_ACCESS_TOKEN" ] || [ -z "$SUPABASE_DB_URL" ]; then
  echo "Error: SUPABASE_DB_URL is not set"
  exit 1
fi

SUPABASE_PROJECT_ID=$(echo "$SUPABASE_DB_URL" | sed -E 's|.*@db\.([^.]+)\.supabase\.co:5432/postgres|\1|')
SUPABASE_DB_PASSWORD=$(echo "$SUPABASE_DB_URL" | sed -E 's|postgresql://postgres:(.*)@db\..*|\1|')

CMDS="
  dump <migration>     Generate a migration file from local schema changes
  migrate              Apply pending migrations to the database
  prepare              Prepare the local database for development
  pull <migrations>    Pull schema changes from the remote database into a migration file
  push                 Push local migrations to the remote database
  reset                Reset local database and run seeds
  revert <n>           Resets applied migrations up to the last n versions (default: 1)
  seed                 Run database seed scripts
  start                Start the Supabase local development environment
  status               Show the status of the local Supabase environment
  stop                 Stop the Supabase local development environment
  sync                 Sync types, schema and seeds files
  typegen              Generate TypeScript types from database schema
  help, -h, --help     Show this help message"

cmd=$1

print_error() {
  printf "\033[0;31m%s\033[0m\n" "$1"
}

format_sql() {
  prettier --write $@ >/dev/null 2>&1
}

is_ci() {
  if [ "$ENV" = "production" ] || [ "$NODE_ENV" = "production" ] || [ "$GITHUB_ACTIONS" = "true" ] || [ "$CI" = "true" ] || [ "$CI" = 1 ]; then
    return 0
  else
    return 1
  fi
}

init_db() {
  supabase login --token "$SUPABASE_ACCESS_TOKEN" >/dev/null
  supabase link --project-ref "$SUPABASE_PROJECT_ID" --password "$SUPABASE_DB_PASSWORD" >/dev/null 2>&1
  sync_types
  if ! is_ci; then
    snaplet-seed init supabase >/dev/null 2>&1 && echo "Finished seed generation."
    supabase start >/dev/null 2>&1 && echo "Finished database start."
  fi
}

sync_schema() {
  if supabase db dump --file $SCHEMA_PATH --yes $@ >/dev/null 2>&1 && format_sql $SCHEMA_PATH; then
    echo "Finished schema dump."
  fi
}

sync_types() {
  arg="--local"
  is_ci && arg="--project-id=$SUPABASE_PROJECT_ID"
  if supabase gen types typescript --schema $SCHEMA "$arg" > $TYPES_PATH; then
    echo "Finished types generation."
  fi
}

sync_seeds() {
  if snaplet-seed sync >/dev/null 2>&1; then
    echo "Finished seeds synchronization."
  fi
}

sync_db() {
  sync_schema $@
  sync_types
  sync_seeds
}

run_seeds() {
  sync_seeds
  tsx supabase/seed.ts
}

dump_db() {
  ! supabase db diff --db-url "$SUPABASE_DB_URL" --schema $SCHEMA --file "$1" && return 1
  format_sql $MIGRATIONS_PATH/*_"$1".sql
  sync_types
  sync_seeds
}

pull_db() {
  if supabase db pull "$1" --linked --schema $PUBLIC_SCHEMA --yes; then
    format_sql $MIGRATIONS_PATH/*_"$1".sql
    if supabase db pull "$1" --linked --schema $PROTECTED_SCHEMA --yes; then
      format_sql $MIGRATIONS_PATH/*_"$1"_protected.sql
    fi
    sync_db --linked
  fi
}

reset_db() {
  ! supabase db reset && return 1
  sync_types
  run_seeds
}

case $cmd in
  dump|pull)
    if [ -z "$2" ]; then
      print_error "You must provide a migration name."
      echo
      exit 1
    fi
    eval "${cmd}_db $2"
    ;;
  migrate)
    supabase migration up --schema $SCHEMA
    ;;
  prepare)
    init_db
    ;;
  push)
    if ! is_ci; then
      printf "Are you sure you want to push the local config and update the remote schema? [y/N] "
      read -r response
      if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
        echo "Push cancelled."
        exit 0
      fi
    fi
    supabase config push --yes
    supabase db push --yes
    ;;
  reset)
    reset_db
    ;;
  revert)
    last=1
    location=local
    [ -n "$2" ] && last=$2
    is_ci && location="linked"
    supabase migration down --$location --last "$last" --yes
    ;;
  seed)
    run_seeds
    ;;
  start)
    supabase start
    ;;
  status)
    supabase status
    ;;
  stop)
    supabase stop
    ;;
  sync)
    sync_db --local
    ;;
  typegen)
    sync_types
    ;;
  *)
    if [ -n "$cmd" ] && [ "$cmd" != help ] && [ "$cmd" != -h ] && [ "$cmd" != --help ]; then
      print_error "Unknown command: $cmd"
      echo
      exit=1
    fi
    echo "Usage:"
    echo "  pnpm db [command]"
    echo
    echo "Commands: $CMDS"
    if [ "$exit" = 1 ]; then
      echo
      exit 1
    fi
    ;;
esac
