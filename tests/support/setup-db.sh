#!/usr/bin/env bash
# Fresh e2e database with the project's real migrations (run against a local Postgres 16).
set -euo pipefail
DB=${PGDATABASE:-kkk_e2e}
psql -q -d postgres -c "drop database if exists $DB with (force)" -c "create database $DB"
for f in supabase/tests/emulate-supabase.sql supabase/migrations/0001_init.sql supabase/migrations/0002_storage.sql \
         supabase/migrations/0004_events.sql supabase/migrations/0005_remove_seed_posts.sql \
         supabase/migrations/0006_authors_and_post_fields.sql supabase/migrations/0007_publish_navaratri.sql \
         supabase/migrations/0008_admin_v6.sql supabase/migrations/0009_team_authors.sql; do
  psql -q -v ON_ERROR_STOP=1 -1 -d "$DB" -f "$f" > /dev/null
done
psql -q -d "$DB" -c "insert into public.admins (email) values ('team@kanpurkikahaani.site') on conflict do nothing"
echo "e2e database $DB ready"
