# Architecture reference

Source tree and structural conventions. Provider hierarchy and component authoring: `patterns.md`. Database client and transactions: `reference.md`. Routes and proxy: `routes.md`.

## Source tree

```
src/
├── actions/            # Server actions ('use server'): mutations + cached queries
│   ├── account/        # delete.ts, export.ts, preferences.ts, sessions.ts ('use server'); deletion.ts (server-only core)
│   ├── admin/          # audit.ts, certificates.ts, expire.ts, helpers.ts, impersonation.ts, impersonation-state.ts, options.ts, organizations.ts, overview.ts, pending.ts, team.ts, users.ts
│   ├── certificates/   # requests.ts (drafts, submit, resubmit, withdraw), assignment.ts, review.ts (claim, changes, reject, approve, preview, revoke), public.ts (verification),
│   │                   #   helpers.ts (server-only: guards, certificateAction, commitTransition), pdf.ts (server-only), queries.ts
│   ├── courses/        # helpers.ts (server-only: queryCatalog is slim, no lesson content or isCorrect; fetchCourses, listSessionCourses), compass.ts, data.ts (server-only: learner reads),
│   │                   #   learner.ts (server-only: learning context, overview), learning.ts (server-only: grading, finish lesson),
│   │                   #   analytics.ts, management.ts, skill-groups.ts (framework CRUD), progress.ts (startCourse, answerQuestion, completeLesson), queries.ts
│   ├── dashboard/      # Read-only, server-only (no 'use server', so per-user cached reads are safe): core.ts (pure types and builders, Vitest),
│   │                   #   load.ts (loadDashboard: role dispatch), member.ts, tutor.ts, manager.ts, editor.ts (cached, tag Courses)
│   ├── emails/         # preview.ts (loadEmailPreview for /emails)
│   ├── maintenance/    # daily.ts (runDailyMaintenance), plan.ts (pure planners), prune.ts, reminders.ts
│   ├── notifications/  # catalog.ts, notify.ts, plan.ts, recipients.ts (server-only); inbox.ts ('use server': list, count, mark read)
│   ├── organizations/  # activity.ts (+ server-only activity-core.ts), helpers.ts, insights.ts, invitations.ts, invite-core.ts,
│   │                   #   invitee.ts, join-links.ts, members.ts, previews.ts, queries.ts, requests.ts, settings.ts
│   ├── shell/          # search.ts (palette lookups: certificates, members), scope.ts (pure per-role scopes), invitations.ts (viewer's pending invitations)
│   ├── auth.ts         # Login, logout, password reset, getAuthUser
│   ├── cookies.ts      # Typed cookie get/set/delete (wraps next/headers cookies)
│   ├── docs.ts         # Doc category + article CRUD, cached queries
│   ├── guards.ts       # requireEditor and other action guards
│   ├── i18n.ts         # getClientMessages: client-safe catalog for a locale switch
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
│   │                   #   courses, dashboard, docs, emails, help, notifications, organization, settings
│   ├── [username]/     # Public profile page (page, opengraph-image, not-found)
│   ├── api/            # API routes (auth catch-all + v1/)
│   ├── offline/        # Offline fallback page
│   ├── privacy/, terms/, quality-charter/   # Public legal pages
│   └── verify/         # Public certificate verification (page, [code])
├── components/
│   ├── features/       # Domain components by feature: about, admin, auth, certificates, courses,
│   │                   #   dashboard, docs, help, legal, notifications, onboarding, organization, users
│   ├── icons/          # Custom SVG icon components, Lucide registry (registry.ts) and LucideIcon (lucide.tsx)
│   ├── layout/         # dashboard-page, dashboard-sidebar, dynamic-marker, error-fallback,
│   │                   #   loading-fallback, offline-fallback, organization-switcher, page-title, pwa-install-prompt,
│   │                   #   search-command (palette), navigation (pure per-role entries), use-navigation-labels
│   ├── providers/      # Flat single-file providers: i18n, motion, search-params, session, theme
│   └── ui/             # shadcn/ui + release kit (ui.md); vendored rich-text-editor/
├── db/
│   ├── client.ts       # Dual-driver Drizzle client + transaction() + Transaction type
│   ├── helpers.ts      # safeQuery(), queryError(), mapSequential()
│   ├── schemas.ts      # drizzle-zod schemas
│   ├── types.ts        # Drizzle table type helpers
│   ├── schema/         # Per-table Drizzle definitions: accounts, activity-events, assessments, certificates,
│   │                   #   courses, docs, enums, helpers, index, notifications, organizations, progress,
│   │                   #   rate-limits, regions, relations, sessions, skill-groups, teams, users, verifications
│   ├── queries/        # parse* per table (pure, NO @/db/client import): activity-event, admin-audit, admin-certificate, admin-overview, admin-user, certificate,
│   │                   #   course, course-editing (details, coverage, analytics), doc, learning (overview, learner lesson DTO), lesson, notification, onboarding,
│   │                   #   organization (flattens organization_profiles), organization-application (zod schema), organization-insights (checklist, pipeline, activity parsers), user
│   └── mutations/      # Server-only write primitives ('server-only', no 'use server'):
│                       #   activity-event.ts, certificate.ts, course.ts, impersonation.ts, invitation.ts, learning.ts, moderation.ts, organization.ts, skill-group.ts, team-invitation.ts, user.ts
├── emails/             # React Email templates: account, auth, certificate, learning, organization, team
├── hooks/              # Custom React hooks (use-*)
├── lib/                # App-wide shared utilities, constants, and types ONLY
│   ├── ai.ts           # Editor AI model chain with first-token fallback (models from config/app.json aiModels)
│   ├── api.ts          # API route helpers (authorizeEditorRequest)
│   ├── auth.ts         # Better Auth server instance
│   ├── cache.ts        # CacheTag enum, per-record tag helpers
│   ├── constants.ts    # Route roots, regex validators
│   ├── cookies.ts      # Cookie type definitions, prefix helpers
│   ├── cron.ts         # isAuthorizedCron
│   ├── email.ts        # Nodemailer SMTP transport (sendMail), TEMPLATES, renderEmail
│   ├── http.ts         # Size-limited body reads, closed Better Auth paths
│   ├── impersonation-guard.ts # Better Auth plugin: blocks security changes while impersonating, drops the admin cookie on sign out
│   ├── i18n.ts         # i18n config, Locale/Messages types, clientMessages(), localizeRecord()
│   ├── icu.ts          # messageSignature(): ICU arguments, tags, and select cases (scripts import it as #lib/icu.ts)
│   ├── legal.ts        # Legal document loader (content/legal)
│   ├── messages.ts     # loadMessages(locale), resolveLocale(): the one catalog loader (server-only)
│   ├── metadata.ts     # App metadata, viewport, intlMetadata(), appTitle()
│   ├── motion.ts       # Motion tokens (EASE_OUT, EASE_IN_OUT, SPRING, TRANSITION)
│   ├── phone.ts        # Phone number helpers
│   ├── rate-limit.ts   # Rate limiting helpers
│   ├── secret-token.ts # Invitation tokens: SHA-256 hash for lookup, AES-GCM seal to rebuild links
│   ├── storage.ts      # R2 helpers (r2Put, r2Delete, r2List, r2PresignAvatar, ...)
│   ├── types.ts        # Shared types (Icon, IconProps, Any, Enum, ...)
│   ├── unsubscribe.ts  # Signed one-click unsubscribe tokens
│   ├── url.ts          # isHttpUrl(), optionalHttpUrl() zod field for website addresses
│   ├── user-agent.ts   # Session device labels
│   ├── username.ts     # Reserved usernames and slug rules
│   └── utils.ts        # cn(), debounce(), camelize(), tempId()/isTempId(), ...
├── i18n.ts             # next-intl request config
└── proxy.ts            # NextProxy middleware (auth guard, saved course-list filter redirect)
```

## File naming

- Use kebab-case everywhere, enforced by `unicorn/filename-case`. One component per file.
- Group feature components by domain under `features/<domain>/` and drop the domain prefix from the filename: `features/courses/course-editor/view.tsx`, not `course-editor-view.tsx`.
- Sub-features nest in sub-folders.
- A slice with a single aggregate root view names it `index.tsx` with a named export, and the route imports the slice folder (`import { HelpContent } from '@/components/features/help'`).
- Single-root slices: `about/`, `dashboard/`, `help/`, `onboarding/`, `courses/course-list/`, `courses/course-editor/`.
- Slices with several peer entry points consumed by different routes keep descriptively named files and no forced `index.tsx`: `certificates/`, `admin/`, `docs/`, `users/`, `organization/`.
- `db/queries/<table>.ts` exports `parse*` functions and MUST stay pure: importing `@/db/client` there leaks `server-only` into client bundles through parser chains.
- `db/mutations/<table>.ts` holds shared server-only write primitives (`import 'server-only'`, never `'use server'`).
- `db/schema/<table>.ts` holds Drizzle table definitions.
- `features/docs/use-docs-search.ts` is the docs search hook (`load`, `search`, results carry `href`) for the command palette.

## Shell: sidebar, switcher, palette

- `components/layout/navigation.ts` is the single role table (pure, tested).
- Each entry has a group (`pages`, `settings`, `organization`, `admin`, `actions`), an href, an icon, and a `visible(viewer)` rule over `{ canEdit, isAdmin, role }`.
- The sidebar renders the `sidebar` entries, the palette renders every visible entry, and `use-navigation-labels` maps each id to its translated label.
- Roles (D25): team members (`canEdit`: platform admins and editors) get Dashboard, Courses, and Docs, plus the Admin group for platform admins.
- Team members get no Organization item, no Certificates, and no org switcher.
- Org owners and representatives add Organization. Learners have no Certificates.

### Org switcher and palette

- The org switcher (`organization-switcher.tsx`) reuses the active-org mechanism: `useSession().setOrganization` writes the `org` cookie that `getActiveOrgId` reads.
- It lists memberships, the viewer's pending invitations (`listMyPendingInvitations`, polled every 2 minutes, links to `/api/v1/invitations/[id]`), and a link to `/register`.
- It offers Leave for non-owners through `LeaveOrganizationDialog` (`leaveOrganization`, gotcha 16).
- The palette opens with the `searchShortcut` key of `config/app.json` (plus Cmd or Ctrl).
- Courses and docs filter in the browser (`listCourses`, `useDocsSearch`).
- Certificates and members come from `searchWorkspace` (`actions/shell/search.ts`), which scopes server-side.
- Certificate scope: own certificates for everyone but team members, assigned and pooled `submitted` requests for tutors, and every non-draft certificate of the active organization for owners and representatives.
- Member scope: owners and representatives in the active organization only.
- Team members get neither. Drafts are visible to their holder only. Queries shorter than 2 characters return nothing.
- The bell stays in the sidebar's top group under Search, as the second row.

## Layer boundaries (lint-enforced)

- Dependencies flow one way: shared > features > app.
- The shared layers (`components/ui/`, `components/icons/`, `hooks/`, `lib/`) are domain-free and MUST NOT import from `@/components/features/**`, `@/app/**`, or `@/actions/**`.
- The `no-restricted-imports` overrides that enforce this are documented in `code.md`.
- Placement test: a component belongs in `ui/` only if you could ship it in a generic component library.
- When a component knows the GloRe domain (binds to the data model, a feature enum, or a feature i18n namespace), it belongs in `features/<domain>/`.
- Cross-feature imports are not yet blocked and a few exist (`admin -> organization`, `dashboard -> courses`). Prefer composing siblings at the route or page level.
- `ui/rich-text-editor/` is the vendored Plate.js editor, installed through the shadcn/Plate registry CLI and domain-free.
- It stays in `ui/` so a CLI re-pull keeps working. Treat the whole subtree as one vendored unit and do not refactor its internals, since a re-pull overwrites them.
- The app touches it only through the `index.tsx` barrel and `provider.tsx`.
- The AI wiring lives in `use-chat.ts` (`DefaultChatTransport` to `/api/v1/ai/command`, chat registered on `AIChatPlugin` from `plugins/ai.tsx` `useHooks`). Keep it when re-pulling.
- Learner lessons never load the vendored `provider.tsx`: `features/courses/course-player/reader-provider.tsx` builds a read-only Plate editor from `reader-plugins.ts` (no AI, copilot, toolbar, dnd, slash, emoji, or autoformat kits), which keeps the AI SDK out of the learner route chunks.

## Server vs client components

- Components are server components by default. Add `'use client'` only for interactivity: hooks, event handlers, browser APIs.
- Layout guards (admin, certificates) are server components that call `notFound()`.
- A page that fetches data async uses an inner async component plus an outer sync page wrapping it in `<Suspense fallback={<LoadingFallback />}>`, so the page header renders immediately while data loads.
- Never remove `(dashboard)/loading.tsx`: it is the skeleton that client navigations show at once while a segment awaits uncached data.
- `next dev` logs a blocking-route error when a navigation would wait on uncached data.
- Partial Prefetching is on (`partialPrefetching: true`): every `<Link>` prefetches the route's App Shell, so never pass `prefetch` to a `Link`.
- Content joins the shell only behind `'use cache'` with a stale time of at least 5 minutes or behind `'use cache: private'`. Uncached reads, `params`, and `searchParams` stream in after the click.
- Render paths read the session through `getSessionUser()` (`src/actions/session.ts`, private cache with the 5 minute stale time of the Better Auth cookie cache), which keeps `CoursesProvider` in the shell.

### Session and caching

- Actions, guards, and API routes use `getAuthUser()`, which skips the cookie cache (`disableCookieCache`), so a ban or a revoked session blocks writes at once.
- Keep cached render helpers in server-only modules.
- Every export of a `'use server'` file is a client-callable action, so a cached fetch that takes a `userId` there would serve any user's data.
- A page that must navigate instantly reads URL state on the client (nuqs) instead of awaiting `searchParams`.
- The saved course-list filters (`gl_courseListParams`) redirect in `src/proxy.ts` for document requests and through `history.replaceState` in `useCourseListParams` on client navigation.
- `checkRateLimit` awaits `connection()` first: reading the clock after `headers()` logs "unstable value `Date.now()` while prerendering" under partial prefetching.

## Events, notifications, and email

### Events and notify

- Every state transition writes one `activity_events` row with `recordEvent(tx, event)` (`src/db/mutations/activity-event.ts`) inside its transaction.
- After the commit, the action calls `notify(event)` (`src/actions/notifications/notify.ts`), which never throws.
- Event types and payloads live in `src/db/queries/activity-event.ts`.
- `src/actions/notifications/catalog.ts` holds recipients, mail category, template factory (may be async, receives the absolute deep link), and deep link per type.
- `notify` writes in-app `notifications` rows, skips the actor unless the type sets `notifyActor`, and mails only when the type has a template.
- Optional categories (`learning`, `organization`, `reminders`) honor `users.notification_preferences`. `mandatory` mail always goes.
- Settings show `organization` only to org admins and representatives (`notificationCategoriesFor`).
- The bell, popover, and `/notifications` render each row from `type` and `data` with `Notifications.events.<type with dots as underscores>` copy in all catalogs.
- A new in-app event needs that copy, and a Vitest test enforces it. A per-recipient `variant` on the event definition stores the variant in the notification data.
- Every event type an organization can record needs activity copy in all catalogs (`activity_*` messages), enforced by a Vitest test.

### Mail

- `sendMail` (`src/lib/email.ts`) takes `template`, `category`, and `unsubscribeUrl`.
- Every template forwards the `category` base prop (`EmailBaseProps`) to `EmailLayout`, which prints the reason and the preference link.
- Mail renders in the RSC layer, which has no `createContext`, so templates never use React context.
- Optional mail carries `List-Unsubscribe` headers. The POST at `/api/v1/mail-preferences` turns that category off for the user named in a signed token (`src/lib/unsubscribe.ts`).
- A GET on that route opens `/settings?tab=notifications`.
- `renderEmail({ template, locale, category })` returns `{ html, subject, text }` and `sendMail` calls it.
- The `/emails` preview (`loadEmailPreview`, `previewTemplate(name)` using each template's `PreviewProps`) therefore cannot drift from what is sent.
- Copy states real expiries: recovery and verify links last 1 hour (`AUTH_LINK_EXPIRY_SECONDS` in `src/lib/constants.ts`, set on both Better Auth options).
- Invitations and team invites use `invitationExpiryDays`.

### Templates

- `account/{email-changed,password-changed,status,welcome}`.
- `auth/{invite (invitation email proof),recovery,verify-email}`.
- `certificate/{assigned,decision,reminder,review}`.
- `learning/eligible`.
- `organization/{application-decision,invitation (invite and reminder),join-request,join-request-received,membership,registration-request}`.
- `team/{invite,role-changed}`.
- Each has `PreviewProps` for `pnpm run email` and `Email.<name>` copy in all catalogs.
- `Notice` (`src/emails/notice.tsx`) is the shared body, and `public/email/header.png` is the logo and motif header.
