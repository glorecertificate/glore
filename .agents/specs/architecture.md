# Architecture reference

Source tree and structural conventions. Provider hierarchy and component authoring: `patterns.md`. Database client, transactions, and routing: `reference.md`.

## Source tree

```
src/
├── actions/            # Server actions ('use server'): mutations + cached queries
│   ├── account/        # delete.ts, export.ts, preferences.ts, sessions.ts ('use server'); deletion.ts (server-only core)
│   ├── admin/          # helpers.ts, organizations.ts, pending.ts, team.ts, users.ts
│   ├── certificates/   # requests.ts (drafts, submit, resubmit, withdraw), assignment.ts, review.ts (claim, changes, reject, approve, preview, revoke),
│   │                   #   helpers.ts (server-only: guards, certificateAction, commitTransition), pdf.ts (server-only), queries.ts
│   ├── courses/        # helpers.ts (server-only: queryCatalog is slim, no lesson content or isCorrect; fetchCourses, listSessionCourses), compass.ts, data.ts (server-only: learner reads),
│   │                   #   learner.ts (server-only: learning context, overview), learning.ts (server-only: grading, finish lesson),
│   │                   #   analytics.ts, management.ts, skill-groups.ts (framework CRUD), progress.ts (startCourse, answerQuestion, completeLesson), queries.ts
│   ├── dashboard/      # Read-only, server-only (no 'use server', so per-user cached reads are safe): core.ts (pure types and builders, Vitest),
│   │                   #   load.ts (loadDashboard: role dispatch), member.ts, tutor.ts, manager.ts, editor.ts (cached, tag Courses)
│   ├── notifications/  # catalog.ts, notify.ts, plan.ts, recipients.ts (server-only); inbox.ts ('use server': list, count, mark read)
│   ├── organizations/  # activity.ts (+ server-only activity-core.ts), helpers.ts, insights.ts, invitations.ts, invite-core.ts,
│   │                   #   invitee.ts, join-links.ts, members.ts, previews.ts, queries.ts, requests.ts, settings.ts
│   ├── shell/          # search.ts (palette lookups: certificates, members), scope.ts (pure per-role scopes), invitations.ts (viewer's pending invitations)
│   ├── auth.ts         # Login, logout, password reset, getAuthUser
│   ├── cookies.ts      # Typed cookie get/set/delete (wraps next/headers cookies)
│   ├── docs.ts         # Doc category + article CRUD, cached queries
│   ├── guards.ts       # requireEditor and other action guards
│   ├── onboarding.ts   # Complete onboarding: password, profile, username, welcome event
│   ├── session.ts      # getSessionUser: render-only private-cached session (server-only, no 'use server')
│   ├── storage.ts      # Avatar upload/remove via Cloudflare R2
│   └── user.ts         # User CRUD, getCurrentUser (cached)
├── app/                # App Router pages and layouts
│   ├── layout.tsx      # Root layout (providers, analytics, JSON-LD)
│   ├── error.tsx       # Global error boundary (client)
│   ├── not-found.tsx   # Global 404 (server)
│   ├── globals.css     # Tailwind imports, theme tokens, animations
│   ├── (auth)/         # Unauthenticated: invite/[token], join/[token], login, onboarding, register
│   ├── (dashboard)/    # Authenticated (sidebar layout): about, admin, certificates,
│   │                   #   courses, dashboard, docs, help, notifications, organization, settings
│   ├── [username]/     # Public certificate page (page, opengraph-image, not-found)
│   ├── api/            # API routes (auth catch-all + v1/)
│   └── offline/        # Offline fallback page
├── components/
│   ├── features/       # Domain components by feature: admin, auth, certificates, courses,
│   │                   #   about, dashboard, docs, help, notifications, onboarding, organization, users
│   ├── icons/          # Custom SVG icon components + Lucide lazy wrapper (lucide.tsx)
│   ├── layout/         # dashboard-page, dashboard-sidebar, dynamic-marker, error-fallback,
│   │                   #   loading-fallback, offline-fallback, organization-switcher, page-title,
│   │                   #   search-command (palette), navigation (pure per-role entries), use-navigation-labels
│   ├── providers/      # Flat single-file providers: i18n, motion, search-params, session, theme
│   └── ui/             # shadcn/ui + release kit (patterns.md); vendored rich-text-editor/
├── db/
│   ├── client.ts       # Dual-driver Drizzle client + transaction() + Transaction type
│   ├── helpers.ts      # safeQuery(), queryError()
│   ├── schemas.ts      # drizzle-zod schemas
│   ├── types.ts        # Drizzle table type helpers
│   ├── schema/         # Per-table Drizzle definitions: accounts, activity-events, assessments, certificates,
│   │                   #   courses, docs, enums, helpers, index, notifications, organizations, progress,
│   │                   #   rate-limits, regions, relations, sessions, skill-groups, teams, users, verifications
│   ├── queries/        # parse* per table (pure, NO @/db/client import): activity-event, certificate,
│   │                   #   course, course-editing (details, coverage, analytics), doc, learning (overview, learner lesson DTO), lesson, organization (flattens organization_profiles), organization-application (zod schema), organization-insights (checklist, pipeline, activity parsers), user
│   └── mutations/      # Server-only write primitives ('server-only', no 'use server'):
│                       #   activity-event.ts, certificate.ts, course.ts, invitation.ts, learning.ts, organization.ts, skill-group.ts, user.ts
├── emails/             # React Email templates: account, auth, certificate, organization, team
├── hooks/              # Custom React hooks (use-*)
├── lib/                # App-wide shared utilities, constants, and types ONLY
│   ├── api.ts          # API route helpers (authorizeEditorRequest)
│   ├── auth.ts         # Better Auth server instance
│   ├── cache.ts        # CacheTag enum, per-record tag helpers
│   ├── constants.ts    # Route roots, regex validators
│   ├── cookies.ts      # Cookie type definitions, prefix helpers
│   ├── email.ts        # Nodemailer SMTP transport (sendMail)
│   ├── http.ts         # Size-limited body reads, closed Better Auth paths
│   ├── i18n.ts         # i18n config, Locale/Messages types, localizeRecord()
│   ├── metadata.ts     # App metadata, viewport, intlMetadata()
│   ├── motion.ts       # Motion tokens (EASE_OUT, EASE_IN_OUT, SPRING, TRANSITION)
│   ├── phone.ts        # Phone number helpers
│   ├── rate-limit.ts   # Rate limiting helpers
│   ├── storage.ts      # R2 helpers (r2Put, r2Delete, r2List, r2PresignAvatar, ...)
│   ├── types.ts        # Shared types (Icon, IconProps, Any, Enum, ...)
│   └── utils.ts        # cn(), debounce(), camelize(), tempId()/isTempId(), ...
├── i18n.ts             # next-intl request config
└── proxy.ts            # NextProxy middleware (auth guard, saved course-list filter redirect)
```

## File naming

- Kebab-case everywhere, enforced by `unicorn/filename-case`. One component per file.
- Feature components group by domain under `features/<domain>/` and drop the domain prefix from the filename: `features/courses/course-editor/view.tsx`, not `course-editor-view.tsx`. Sub-features nest in sub-folders.
- A slice with a single aggregate root view names it `index.tsx` with a named export, and the route imports the slice folder rather than a deeper file (`import { HelpContent } from '@/components/features/help'`). Used by `about/`, `dashboard/`, `help/`, `onboarding/`, `courses/course-list/`, `courses/course-editor/`. Slices with several peer entry points consumed by different routes (`certificates/`, `admin/`, `docs/`, `users/`, `organization/`) keep descriptively named files and no forced `index.tsx`.
- `db/queries/<table>.ts` exports `parse*` functions and MUST stay pure: importing `@/db/client` there leaks `server-only` into client bundles through parser chains.
- `features/docs/use-docs-search.ts` is the docs search hook (`load`, `search`, results carry `href`) for the command palette.

## Shell: sidebar, switcher, palette

- `components/layout/navigation.ts` is the single role table (pure, tested): each entry has a group (`pages`, `settings`, `organization`, `admin`, `actions`), href, icon, and a `visible(viewer)` rule over `{ canEdit, isAdmin, role }`. The sidebar renders the `sidebar` entries, the palette renders every visible entry, and `use-navigation-labels` maps each id to its translated label.
- Roles (D25): team members (`canEdit`: platform admins and editors) get Dashboard, Courses, Docs, plus the Admin group for platform admins; no Organization item, no Certificates, no org switcher. Org owners and representatives add Organization; learners have no Certificates.
- The org switcher (`organization-switcher.tsx`) reuses the existing active-org mechanism: `useSession().setOrganization` writes the `org` cookie that `getActiveOrgId` reads. It lists memberships, the viewer's pending invitations (`listMyPendingInvitations`, polled every 2 minutes, links to `/invite/[token]`), a link to `/register`, and Leave for non-owners through `LeaveOrganizationDialog` (`leaveOrganization`, gotcha 16).
- The palette opens with the `searchShortcut` key of `config/app.json` (plus Cmd or Ctrl). Courses and docs filter in the browser (`listCourses`, `useDocsSearch`); certificates and members come from `searchWorkspace` (`actions/shell/search.ts`), which scopes server-side: own certificates for everyone but team members, plus assigned and pooled `submitted` requests for tutors, plus every non-draft certificate of the active organization for owners and representatives; members only for owners and representatives in the active organization; team members get neither. Drafts are visible to their holder only. Queries shorter than 2 characters return nothing.
- The bell stays in the sidebar's top group under Search, as the second row.
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
- `(dashboard)/loading.tsx` is the skeleton that client navigations show at once while a segment awaits uncached data, so never remove it; `next dev` logs a blocking-route error when a navigation would wait on uncached data.
- Partial Prefetching is on (`partialPrefetching: true`): every `<Link>` prefetches the route's App Shell, so never pass `prefetch` to a `Link`. Content joins the shell only behind `'use cache'` with a stale time of at least 5 minutes or behind `'use cache: private'`; uncached reads, `params`, and `searchParams` stream in after the click.
- Render paths read the session through `getSessionUser()` (`src/actions/session.ts`, private cache with the 5 minute stale time of the Better Auth cookie cache), which keeps `CoursesProvider` in the shell. Actions and guards keep the uncached `getAuthUser()`.
- Keep cached render helpers in server-only modules. Every export of a `'use server'` file is a client-callable action, so a cached fetch that takes a `userId` there would serve any user's data.
- A page that must navigate instantly reads URL state on the client (nuqs) instead of awaiting `searchParams`. The saved course-list filters (`gl_courseListParams`) redirect in `src/proxy.ts` for document requests and through `history.replaceState` in `useCourseListParams` on client navigation.

## Events, notifications, and email

- Every state transition writes one `activity_events` row with `recordEvent(tx, event)` (`src/db/mutations/activity-event.ts`) inside its transaction. After the commit, the action calls `notify(event)` (`src/actions/notifications/notify.ts`), which never throws.
- Event types and payloads live in `src/db/queries/activity-event.ts`. `src/actions/notifications/catalog.ts` holds recipients, mail category, template factory (may be async, receives the absolute deep link), and deep link per type.
- `notify` writes in-app `notifications` rows, skips the actor unless the type sets `notifyActor`, and mails only when the type has a template. Optional categories (`learning`, `organization`, `reminders`) honor `users.notification_preferences`; `mandatory` mail always goes.
- The bell, popover, and `/notifications` render each row from `type` and `data` with `Notifications.events.<type with dots as underscores>` copy in all catalogs; a new in-app event needs that copy, and a Vitest test enforces it.
- `sendMail` (`src/lib/email.ts`) takes `template`, `category`, and `unsubscribeUrl`. Every template forwards the `category` base prop (`EmailBaseProps`) to `EmailLayout`, which prints the reason and the preference link; mail renders in the RSC layer, which has no `createContext`, so templates never use React context. Optional mail carries `List-Unsubscribe` headers: the POST at `/api/v1/mail-preferences` turns that category off for the user named in a signed token (`src/lib/unsubscribe.ts`), and a GET opens `/settings?tab=notifications`.
- Templates: `account/{email-changed,password-changed,status,welcome}`, `auth/{invite (invitation email proof), recovery, verify-email}`, `certificate/{assigned,decision,reminder,review}`, `learning/eligible`, `organization/{invitation (invite and reminder),join-request,join-request-received,membership,registration-request}`, `team/{invite,role-changed}`. Each has `PreviewProps` for `pnpm run email` and `Email.<name>` copy in all catalogs. `Notice` (`src/emails/notice.tsx`) is the shared body; `public/email/header.png` is the logo and motif header.
- Copy states real expiries: recovery and verify links last 1 hour (Better Auth defaults), invitations and team invites use `invitationExpiryDays` and `INVITATION_EXPIRY_DAYS`.
