# Tests

| Command | What it checks | Needs |
|---|---|---|
| `npm run test:rls` | 226 Row Level Security checks: every table and storage bucket, as anon / non-admin / unverified admin / forged email claim / admin | Postgres 16 |
| `npm run test:e2e` | 19 Playwright tests of the admin flow: sign-in rules, Google + password + reset + 2-step, drafts, autosave, uploads, preview, publish, schedule, revisions, slug redirects, Trash, admin-only shortcuts, noindex | Postgres 16, Chromium |
| `npm run test:news` | News classifier and pipeline fixtures | — |

The e2e suite runs a production build against `tests/support/fake-supabase.mjs`: a small stand-in for Supabase Auth, PostgREST and Storage. Every query runs in Postgres under the caller's role and JWT claims, so the project's real migrations and RLS policies decide what is allowed. Real Google sign-in and real Supabase emails can't be exercised here. ADMIN_GUIDE.md §10 and SETUP.md §4 cover checking those on the live site.

```bash
export PGHOST=/path/to/socket PGPORT=5432 PGUSER=postgres
npm run test:e2e
```

`tests/support/guide-screenshots.mjs` regenerates the screenshots in `docs/admin-guide/`.
