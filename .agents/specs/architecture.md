# Architecture reference

Full source tree and structural conventions for the GloRe codebase.

---

## Source tree

```
src/
├── actions/            # Server actions ('use server'): mutations + cached queries
│   ├── admin/          # organizations.ts, team.ts, users.ts
│   ├── certificates/   # helpers.ts (server-only, no 'use server'), management.ts, queries.ts
│   ├── courses/        # helpers.ts, management.ts, progress.ts, queries.ts
│   ├── organizations/  # helpers.ts, members.ts, queries.ts, requests.ts, settings.ts
│   ├── auth.ts         # Login, logout, password reset, getAuthUser
│   ├── cookies.ts      # Typed cookie get/set/delete (wraps next/headers cookies)
│   ├── doc.ts          # Doc category + article CRUD, cached queries
│   ├── onboarding.ts   # Complete onboarding flow
│   ├── storage.ts      # Avatar upload/remove via Cloudflare R2
│   └── user.ts         # User CRUD, getCurrentUser (cached)
├── app/                # App Router pages and layouts
│   ├── layout.tsx      # Root layout (providers, analytics, JSON-LD)
│   ├── error.tsx       # Global error boundary (client)
│   ├── not-found.tsx   # Global 404 (server)
│   ├── globals.css     # Tailwind imports, theme tokens, animations
│   ├── (auth)/         # Unauthenticated routes: login, onboarding, register
│   ├── (dashboard)/    # Authenticated routes (sidebar layout): about, admin, certificates,
│   │                   #   courses, dashboard, docs, help, organization, settings
│   ├── [username]/     # Public certificate page (page.tsx, opengraph-image.tsx, not-found.tsx)
│   ├── api/            # API routes (auth catch-all + v1/)
│   └── offline/        # Offline fallback page
├── components/
│   ├── features/       # Domain components grouped by feature:
│   │                   #   admin, auth, certificates, courses, dashboard, docs, help,
│   │                   #   onboarding, organization, users
│   │                   #   (auth = login/register/password-reset/signup flow + params.ts)
│   ├── icons/          # Custom SVG icon components + Lucide lazy wrapper (lucide.tsx)
│   ├── layout/         # dashboard-page, dashboard-sidebar, error-fallback,
│   │                   #   loading-fallback, search-command (Fuse.js command palette)
│   ├── providers/      # Flat single-file providers: i18n, search-params, session, theme
│   └── ui/             # shadcn/ui primitives + custom UI (incl. vendored rich-text-editor/)
│                       #   domain-free only (lint-enforced: no features/app/actions imports)
├── db/
│   ├── client.ts       # Dual-driver Drizzle client + transaction() + Transaction type
│   ├── helpers.ts      # safeQuery(), queryError()
│   ├── schemas.ts      # drizzle-zod schemas
│   ├── types.ts        # Drizzle table type helpers (InferInsertModel)
│   ├── schema/         # Per-table Drizzle definitions: accounts, assessments, certificates,
│   │                   #   courses, docs, enums, helpers, index, organizations, progress,
│   │                   #   regions, relations, sessions, skill-groups, teams, users, verifications
│   ├── queries/        # parse* functions per table (pure: NO @/db/client import)
│   │                   #   certificate, course, doc, lesson, organization, user
│   └── mutations/      # Server-only write primitives ('server-only', no 'use server'):
│                       #   certificate.ts, course.ts, organization.ts, user.ts
├── emails/             # React Email templates: account, auth, certificate, organization, team
├── hooks/              # Custom React hooks (use-*)
├── lib/                # App-wide shared utilities, constants, and types ONLY
│   ├── auth.ts         # Better Auth server instance
│   ├── cache.ts        # CacheTag enum, per-record tag helpers
│   ├── constants.ts    # Route roots, regex validators
│   ├── cookies.ts      # Cookie type definitions, prefix helpers
│   ├── email.ts        # Nodemailer SMTP transport (sendMail utility)
│   ├── i18n.ts         # i18n config, Locale/Messages types, localizeRecord()
│   ├── metadata.ts     # App metadata, viewport, intlMetadata()
│   ├── phone.ts        # Phone number helpers
│   ├── rate-limit.ts   # Rate limiting helpers
│   ├── storage.ts      # R2 Put/Delete/URL helpers (r2Put, r2Delete, r2Url)
│   ├── types.ts        # Shared types (Icon, IconProps, Any, Enum, etc.)
│   └── utils.ts        # cn(), debounce(), throttle(), camelize(), etc.
├── i18n.ts             # next-intl request config
└── proxy.ts            # NextProxy middleware (auth guard)
```

---

## Database client

`src/db/client.ts` picks the driver by `DATABASE_URL` host:

- `localhost` / `127.0.0.1` uses `drizzle-orm/node-postgres` + `pg.Pool` (dev).
- Anything else uses `drizzle-orm/neon-http` for reads (prod).

Multi-statement writes go through `transaction()` (dev: the `pg` pool; prod: a module-scoped neon-serverless WebSocket pool). The module exports `db`, `transaction`, and the `Transaction` type. Write primitives live in `db/mutations/<domain>.ts` as composable `(tx, ...args) => ...` units that actions wrap.

---

## File naming

- All files: kebab-case (enforced by `unicorn/filename-case`).
- One component per file.
- Feature components group by domain under `features/<domain>/`, dropping the domain prefix from filenames: `features/courses/course-editor/view.tsx`, not `course-editor-view.tsx`. Sub-features nest in sub-folders.
- A slice with a single aggregate/root view names it `index.tsx` (named export of the component); the route imports the slice folder, not a deeper file (`import { HelpContent } from '@/components/features/help'`). Used by `about/`, `dashboard/`, `help/`, `onboarding/`, `courses/course-list/`, `courses/course-editor/`. Slices with several peer entry points consumed by different routes (`certificates/`, `admin/`, `docs/`, `users/`, `organization/`) keep descriptively-named files, no forced `index.tsx`.
- Database queries: `db/queries/<table>.ts` exporting `parse*` functions. These MUST stay pure: importing `@/db/client` here leaks `server-only` into client bundles via parser chains.
- Database mutations: `db/mutations/<table>.ts` for shared server-only write primitives (`import 'server-only'`, never `'use server'`).
- Database schema: `db/schema/<table>.ts` with Drizzle table definitions.

### Layer boundaries (lint-enforced)

Dependencies flow one way: **shared -> features -> app**. The shared layers (`components/ui/`, `components/icons/`, `hooks/`, `lib/`) are domain-free and must not import from `@/components/features/**`, `@/app/**`, or `@/actions/**` (scoped `no-restricted-imports` overrides in `vite.config.ts`; `src/lib/utils.ts` has its own override so it can re-export `cnfast`). Placement test: a component belongs in `ui/` only if you could ship it in a generic component library; the moment it knows the GloRe domain (binds to the data model, a feature enum, or a feature i18n namespace) it belongs in `features/<domain>/`. Cross-feature imports are NOT yet blocked (a few exist, e.g. `admin -> organization`, `dashboard -> courses`); prefer composing siblings at the route/page level.

`ui/rich-text-editor/` is the vendored Plate.js editor (installed via the shadcn/Plate registry CLI, domain-free). It stays in `ui/` to keep CLI re-pull working; treat the whole subtree as one vendored unit and do not refactor its internals (a re-pull overwrites them). The app touches it only through the `index.tsx` barrel + `provider.tsx`.

### Provider pattern

App-wide providers in `components/providers/` are single flat files (`i18n.tsx`, `search-params.tsx`, `session.tsx`, `theme.tsx`), each owning its own `use<X>` hook. Feature-scoped contexts live under `components/features/<domain>/`. Split into `context.tsx` + `provider.tsx` + `index.ts` ONLY for a server-side data fetch. Provider hierarchy and rules: see `patterns.md`.

---

## Server vs client components

- Server components by default.
- `'use client'` only when interactivity is needed (hooks, event handlers, browser APIs).
- Layout guards (admin, certificates) are server components that call `notFound()`.
- Page Suspense pattern: pages that fetch data async use an inner async component plus an outer sync page wrapping it in `<Suspense fallback={<LoadingFallback />}>`, so the page header renders immediately while data loads.
