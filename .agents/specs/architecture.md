# Architecture Reference

Full source tree and structural conventions for the GloRe codebase.

---

## Source Tree

```
src/
├── actions/            # Server actions (mutations and cached queries)
│   ├── admin/
│   │   ├── organizations.ts    # Organization approvals, invitations
│   │   ├── team.ts             # Team member management, invitations
│   │   └── users.ts            # User moderation (ban/unban, role updates)
│   ├── certificates/
│   │   ├── management.ts       # Certificate mutations: review, create, submit, assign
│   │   └── queries.ts          # Certificate reads: list, find, eligibility + column configs
│   ├── courses/
│   │   ├── helpers.ts          # Shared server-only helpers, courseWith, buildCourseWith (no 'use server')
│   │   ├── management.ts       # Course and content CRUD (lessons, questions, evaluations)
│   │   ├── progress.ts         # Learner progress and analytics (enroll, complete, submit)
│   │   └── queries.ts          # Course read queries
│   ├── organizations/
│   │   ├── helpers.ts          # Shared server-only helpers, types, column configs (no 'use server')
│   │   ├── members.ts          # Org member management: invite, role update, remove
│   │   ├── queries.ts          # Org reads: getOrganizationPanel, listOrgTutors
│   │   ├── requests.ts         # Org join requests: approve, reject, register
│   │   └── settings.ts         # Org entity: update, avatar upload/remove, delete
│   ├── auth.ts         # Login, logout, password reset, getAuthUser
│   ├── cookies.ts      # Typed cookie get/set/delete (wraps next/headers cookies)
│   ├── doc.ts          # Doc category + article CRUD, cached queries
│   ├── notification.ts # Notification creation helpers
│   ├── onboarding.ts   # Complete onboarding flow
│   ├── storage.ts      # Avatar upload/remove via Cloudflare R2
│   └── user.ts         # User CRUD, getCurrentUser (cached)
├── app/                # App Router pages and layouts
│   ├── layout.tsx      # Root layout (providers, analytics, JSON-LD)
│   ├── error.tsx       # Global error boundary (client)
│   ├── not-found.tsx   # Global 404 (server)
│   ├── globals.css     # Tailwind imports, theme tokens, animations
│   ├── (auth)/         # Unauthenticated routes (login, onboarding)
│   ├── (dashboard)/    # Authenticated routes (sidebar layout)
│   ├── [username]/     # Public certificate page route
│   └── api/            # API routes (auth catch-all + v1/)
├── components/
│   ├── blocks/         # Complex composed blocks (rich-text-editor)
│   ├── features/       # Domain components grouped by feature
│   │   ├── about/         # About page components
│   │   ├── admin/         # Admin panel components
│   │   ├── auth/          # Auth forms, login/register UI
│   │   ├── certificates/  # Certificate management UI
│   │   ├── courses/       # Course viewer/editor components
│   │   ├── dashboard/     # Dashboard page components
│   │   ├── docs/          # Docs article cards, list/search, sheets, editor dialog
│   │   ├── help/          # Help page components
│   │   ├── notifications/ # Notification list and items
│   │   ├── onboarding/    # Onboarding form steps
│   │   ├── organization/  # Org panel header, tabs, management sections
│   │   ├── pwa/           # PWA install prompts, offline UI
│   │   ├── search/        # Global command palette (SearchCommand) with Fuse.js
│   │   └── users/         # User profile components
│   ├── icons/          # Custom SVG icon components + Lucide lazy wrapper
│   ├── layout/         # Shell components (sidebar, page header, fallbacks)
│   ├── providers/      # Context providers (session, i18n, theme, courses, notifications, PWA)
│   └── ui/             # shadcn/ui primitives and custom UI components
├── db/
│   ├── client.ts       # Neon + Drizzle client (neon HTTP driver)
│   ├── helpers.ts      # safeQuery(), queryError()
│   ├── types.ts        # Drizzle table type helpers (InferInsertModel)
│   ├── schema/         # Drizzle schema definitions per table
│   └── queries/        # Query parse functions per table
├── emails/             # React Email templates (auth, team, certificates, org)
├── hooks/              # Custom React hooks
├── instrumentation.ts  # Next.js instrumentation hook (runtime env validation)
├── lib/                # App-wide shared utilities, constants, and types ONLY
│   ├── auth.ts         # Better Auth server instance
│   ├── cache.ts        # CacheTag enum, per-record tag helpers
│   ├── constants.ts    # Route roots, regex validators
│   ├── cookies.ts      # Cookie type definitions, prefix helpers
│   ├── email.ts        # Nodemailer SMTP transport (sendMail utility)
│   ├── env.ts          # Zod env schema, runtime validation, ProcessEnv augmentation
│   ├── i18n.ts         # i18n config, Locale/Messages types, localizeRecord()
│   ├── metadata.ts     # App metadata, viewport, intlMetadata()
│   ├── push.ts         # Web Push (VAPID) utilities
│   ├── rate-limit.ts   # Rate limiting helpers
│   ├── storage.ts      # R2 Put/Delete/URL helpers (r2Put, r2Delete, r2Url)
│   ├── types.ts        # Shared types (Icon, IconProps, Any, Enum, etc.)
│   └── utils.ts        # cn(), debounce(), throttle(), camelize(), etc.
├── i18n.ts             # next-intl request config
└── proxy.ts            # NextProxy middleware (auth guard)
```

---

## File Naming

- All files: **kebab-case** (enforced by `unicorn/filename-case`)
- Components: one component per file, named exports preferred
- Feature components: grouped by domain under `features/<domain>/`, sub-features in sub-folders
  - Drop domain prefix from filenames: `features/courses/editor/view.tsx` (not `course-editor-view.tsx`)
  - Context/params at sub-feature root: `context.tsx`, `params.ts`, `use-params.ts`
- Provider pattern: split into `*-context.tsx` + `*-provider.tsx`
- Database queries: `src/db/queries/<table>.ts` with `parse*` function
- Database schema: `src/db/schema/<table>.ts` with Drizzle table definitions

---

## Server vs Client Components

- **Server Components** by default
- `'use client'` only when interactivity is needed (hooks, event handlers, browser APIs)
- Layout guards (admin, certificates) are server components that call `notFound()`
- **Page Suspense pattern:** Pages that fetch data async MUST use an inner async component + outer sync page with `<Suspense fallback={<LoadingFallback />}>`. The page header renders immediately while data loads.
