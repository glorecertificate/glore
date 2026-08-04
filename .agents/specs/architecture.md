# Architecture reference

Source tree and structural conventions. Provider hierarchy and component authoring: `patterns.md`. Database client, transactions, and routing: `reference.md`.

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
│   ├── (auth)/         # Unauthenticated: login, onboarding, register
│   ├── (dashboard)/    # Authenticated (sidebar layout): about, admin, certificates,
│   │                   #   courses, dashboard, docs, help, organization, settings
│   ├── [username]/     # Public certificate page (page, opengraph-image, not-found)
│   ├── api/            # API routes (auth catch-all + v1/)
│   └── offline/        # Offline fallback page
├── components/
│   ├── features/       # Domain components by feature: admin, auth, certificates, courses,
│   │                   #   dashboard, docs, help, onboarding, organization, users
│   ├── icons/          # Custom SVG icon components + Lucide lazy wrapper (lucide.tsx)
│   ├── layout/         # dashboard-page, dashboard-sidebar, error-fallback,
│   │                   #   loading-fallback, search-command (Fuse.js command palette)
│   ├── providers/      # Flat single-file providers: i18n, search-params, session, theme
│   └── ui/             # shadcn/ui primitives + custom UI (incl. vendored rich-text-editor/)
├── db/
│   ├── client.ts       # Dual-driver Drizzle client + transaction() + Transaction type
│   ├── helpers.ts      # safeQuery(), queryError()
│   ├── schemas.ts      # drizzle-zod schemas
│   ├── types.ts        # Drizzle table type helpers
│   ├── schema/         # Per-table Drizzle definitions: accounts, assessments, certificates,
│   │                   #   courses, docs, enums, helpers, index, organizations, progress,
│   │                   #   regions, relations, sessions, skill-groups, teams, users, verifications
│   ├── queries/        # parse* per table (pure, NO @/db/client import): certificate,
│   │                   #   course, doc, lesson, organization, user
│   └── mutations/      # Server-only write primitives ('server-only', no 'use server'):
│                       #   certificate.ts, course.ts, organization.ts, user.ts
├── emails/             # React Email templates: account, auth, certificate, organization, team
├── hooks/              # Custom React hooks (use-*)
├── lib/                # App-wide shared utilities, constants, and types ONLY
│   ├── auth.ts         # Better Auth server instance
│   ├── cache.ts        # CacheTag enum, per-record tag helpers
│   ├── constants.ts    # Route roots, regex validators
│   ├── cookies.ts      # Cookie type definitions, prefix helpers
│   ├── email.ts        # Nodemailer SMTP transport (sendMail)
│   ├── i18n.ts         # i18n config, Locale/Messages types, localizeRecord()
│   ├── metadata.ts     # App metadata, viewport, intlMetadata()
│   ├── phone.ts        # Phone number helpers
│   ├── rate-limit.ts   # Rate limiting helpers
│   ├── storage.ts      # R2 helpers (r2Put, r2Delete, r2Url)
│   ├── types.ts        # Shared types (Icon, IconProps, Any, Enum, ...)
│   └── utils.ts        # cn(), debounce(), camelize(), tempId()/isTempId(), ...
├── i18n.ts             # next-intl request config
└── proxy.ts            # NextProxy middleware (auth guard)
```

## File naming

- Kebab-case everywhere, enforced by `unicorn/filename-case`. One component per file.
- Feature components group by domain under `features/<domain>/` and drop the domain prefix from the filename: `features/courses/course-editor/view.tsx`, not `course-editor-view.tsx`. Sub-features nest in sub-folders.
- A slice with a single aggregate root view names it `index.tsx` with a named export, and the route imports the slice folder rather than a deeper file (`import { HelpContent } from '@/components/features/help'`). Used by `about/`, `dashboard/`, `help/`, `onboarding/`, `courses/course-list/`, `courses/course-editor/`. Slices with several peer entry points consumed by different routes (`certificates/`, `admin/`, `docs/`, `users/`, `organization/`) keep descriptively named files and no forced `index.tsx`.
- `db/queries/<table>.ts` exports `parse*` functions and MUST stay pure: importing `@/db/client` there leaks `server-only` into client bundles through parser chains.
- `db/mutations/<table>.ts` holds shared server-only write primitives (`import 'server-only'`, never `'use server'`). `db/schema/<table>.ts` holds Drizzle table definitions.

## Layer boundaries (lint-enforced)

Dependencies flow one way: **shared > features > app**. The shared layers (`components/ui/`, `components/icons/`, `hooks/`, `lib/`) are domain-free and must not import from `@/components/features/**`, `@/app/**`, or `@/actions/**`. The `no-restricted-imports` overrides that enforce this are documented in `code.md`.

**Placement test:** a component belongs in `ui/` only if you could ship it in a generic component library. The moment it knows the GloRe domain, meaning it binds to the data model, a feature enum, or a feature i18n namespace, it belongs in `features/<domain>/`.

Cross-feature imports are NOT yet blocked and a few exist (`admin -> organization`, `dashboard -> courses`); prefer composing siblings at the route or page level.

`ui/rich-text-editor/` is the vendored Plate.js editor, installed through the shadcn/Plate registry CLI and domain-free. It stays in `ui/` so a CLI re-pull keeps working: treat the whole subtree as one vendored unit and do not refactor its internals, since a re-pull overwrites them. The app touches it only through the `index.tsx` barrel and `provider.tsx`.

## Server vs client components

- Server components by default. Add `'use client'` only for interactivity: hooks, event handlers, browser APIs.
- Layout guards (admin, certificates) are server components that call `notFound()`.
- Pages that fetch data async use an inner async component plus an outer sync page wrapping it in `<Suspense fallback={<LoadingFallback />}>`, so the page header renders immediately while data loads.
