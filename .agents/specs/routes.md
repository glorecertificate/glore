# Routes and proxy

Route groups, public verification, route gates, API routes, and the proxy lifecycle. Authentication detail: `auth.md`.

## Route groups

- `(auth)` holds unauthenticated pages. Its layout renders `AuthFrame` (aside, globe, legal links, theme switch), so the globe survives client navigation between auth screens. Pages render `AuthMain`.
- `/onboarding/error` lives outside the group because it uses `BrandShell`. `/legal/accept` wraps its own `AuthFrame`.
- `(dashboard)` holds authenticated pages with the sidebar, wrapped in `SidebarProvider > SessionProvider`.
- The `dashboard/` and `courses/` layouts add `CoursesProvider`. Its context holds `CourseSummary` records only (`summarizeCourse` in `db/queries/course.ts`), never lesson trees.
- Editor, learn, and complete load their one full course on the server.
- `/` permanently redirects to `/dashboard` in `next.config.ts`.

## Public routes

- `/login`.
- `/register`: organization application (`organizations.md`).
- `/invite/[token]` and `/join/[token]`: token pages (`organizations.md`).
- `/verify` and `/verify/[code]`: certificate verification ("Public verification" below).
- `/@<username>`: opt-in public profile ("Public profile" below).
- `/privacy`, `/terms`: the published version from the database (`reference.md`), with an `en` fallback notice.
- `LEGAL_ROOTS` feeds the proxy and the reserved usernames.
- `/offline`: PWA fallback.

## Public profile

- `/@<username>` is built as the internal route `src/app/u/[username]/`, because Next reserves `@folder` for parallel routes.
- The proxy rewrites `/@<username>` and `/@<username>/opengraph-image*` to it, and permanently redirects a direct `/u/<username>` to `/@<username>`.
- The `og:image` tag points to `/u/<username>/opengraph-image`, so `isPublicPath` lets guests load that path.
- A single-segment path with a `v` param that is not a reserved username rewrites to `/u/<username>/legacy`.
- That route handler permanently redirects the legacy `/<username>?v=<handle>` to `/verify/<code>`. Any other root `/<username>` answers not found.
- The profile 404 offers guests join and login links and signed-in users the dashboard.

## Public verification

- `/verify` takes a code (any case, dashes optional, normalized by `normalizeCertificateCode`) and redirects to `/verify/<code>`.
- `/verify/<code>` renders one credential card led by the verdict row (valid or revoked with its date, Download PDF as a secondary button), then the holder, facts, tasks and skills in two columns, and a footer with code, issue date, signatory, and QR.
- A "Check another code" field sits above the card. A revoked card keeps only holder, organization, code, and issue date. The public profile keeps the band card.
- `/verify/<code>` shows the holder's full name, organization and logo, period, hours, location, tasks, skills with their level and description, issue date, signatory, PDF link, QR, an Open Graph image, and JSON-LD (always serialized with `serializeJsonLd`, which escapes `<` so a holder name cannot close the script element).
- Both routes are public, `noindex`, and rate limited per IP (60 checks and 30 lookups a minute).
- The verification image (`verify/[code]/opengraph-image.tsx`) reads through `verifyCertificate`, so it shares the 60 checks a minute and answers 429 with `retry-after` when limited.
- `findPublicCertificate` (the `/@{username}` page, its metadata, and its image) is limited to 60 reads a minute per IP under `profile:<ip>`, deduped per request. The image answers 429 and the page answers not found.
- `lookupLegacyCertificateCode` applies the 30 lookups a minute limiter to the `?v=` redirect.

### Verdicts and snapshots

- An approved certificate reads `valid`. Every other status is `unknown`.
- A revoked certificate reads `revoked` with its date and shows only the holder, organization, code, and issue date.
- A revoked certificate never exposes its reason, PDF link, location, dates, duration, tasks, skills, signatory, or QR. `/api/v1/certificates/<id>/pdf` answers 410.
- The page reads the issued `snapshot`, so later profile edits never change it.
- Approval freezes the `CertificatePdf` labels in `snapshot.labels`, so later message overrides never change an issued PDF.
- A snapshot without `labels` renders with the current messages.
- `/@{username}` is opt-in (`users.publicProfile`, default off) and shows the featured certificate.
- A private profile renders the not-found page. It streams with status 200 and `noindex`, so it looks like an unknown user.

## Authenticated routes

- Pre-onboarding: `/onboarding`, `/onboarding/error`.
- `/legal/accept`: the dashboard layout (never the proxy) redirects here until a material terms version is accepted, except when impersonating.
- Dashboard layout, no extra gate: `/dashboard`, `/about`, `/help`, `/settings`.
- `/notifications`: inbox with status and topic filters.
- `/courses`.
- `/courses/[slug]`: overview for members, editor for editors.
- `/courses/[slug]/learn`: the player, with `?lesson=` and `?lang=`. The server grades answers and never sends `isCorrect`.
- `/courses/[slug]/complete`: completion summary, rating through `rateCourse`, next step.
- `/courses/skills`: editors only, skill group CRUD and course assignment. `skills` is a reserved course slug.
- `/docs`, `/docs/intro`, `/docs/faq`, `/docs/tutorials`, `/docs/articles/[slug]`.
- `/dev/ui`: the UI kit catalog (`ui.md`).
- Its file is `page.dev.tsx`, which `pageExtensions` in `next.config.ts` builds only on the dev server and when `VERCEL_ENV` is `preview`, so production builds and CI do not contain the route.

## Gated routes

Dashboard layout with an extra gate:

| Route                       | Gate        | Notes                                                                                                                                                                                            |
| --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/admin`                    | `isAdmin`   | Overview, the panel landing (`admin.md`)                                                                                                                                                         |
| `/admin/team`               | `isAdmin`   | Team management (`admin.md`)                                                                                                                                                                     |
| `/admin/users`              | `isAdmin`   | User moderation and view as user (`admin.md`)                                                                                                                                                    |
| `/admin/certificates`       | `isAdmin`   | Certificate lookup and revocation (`admin.md`)                                                                                                                                                   |
| `/admin/audit`              | `isAdmin`   | Audit log (`admin.md`)                                                                                                                                                                           |
| `/admin/settings`           | `isAdmin`   | Contact and legal entity settings (`admin.md`)                                                                                                                                                   |
| `/translations`             | `canEdit`   | Interface text editor (`?key=`, `?filter=`, `?namespace=`, `?q=`), outside the admin layout; `loadTranslationsData` checks `canEdit` itself. `/admin/translations` redirects here (`content.md`) |
| `/legal`                    | `canEdit`   | Legal documents (`?document=`); only admins publish; outside the admin layout                                                                                                                    |
| `/emails`                   | `canEdit`   | Email previews (`?template=`, `?lang=`, `?category=`), outside the admin layout; `loadEmailPreview` checks `isAdmin` or `canEdit` itself                                                         |
| `/admin/organizations`      | `isAdmin`   | Tabs all/pending/active/rejected; application sheet, approve (invites), reject (soft), create, invite                                                                                            |
| `/admin/organizations/[id]` | `isAdmin`   | `?tab=` application, members, invitations, certificates, activity, settings (shared with `/organization`)                                                                                        |
| `/organization`             | org manager | `?tab=` overview, members, invitations, requests, certificates, insights, activity, settings                                                                                                     |
| `/certificates`             | non-editor  | List (tutors: queue tabs; org owners and representatives: pipeline); `/certificates/new`, `/certificates/[id]`, and `/certificates/[id]/review` share the same gate                              |

## API routes

| Path                            | Method   | Description                                                                                      |
| ------------------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `/api/auth/[...all]`            | GET/POST | Better Auth catch-all; `/api/auth/admin/*` answers 404                                           |
| `/api/v1/ai/command`            | POST     | AI command (editors, rate limited)                                                               |
| `/api/v1/join`                  | GET      | Team invitation join endpoint                                                                    |
| `/api/v1/invitations/[id]`      | GET      | Recipient opens a pending invitation (redirects to token)                                        |
| `/api/v1/manifest`              | GET      | Dynamic PWA manifest (locale-aware, cached 1h)                                                   |
| `/api/v1/session`               | GET      | Clears cookies of a stale session, then login                                                    |
| `/api/v1/upload`                | POST     | R2 file upload (editors, rate limited)                                                           |
| `/api/v1/certificates/[id]/pdf` | GET      | Certificate PDF on demand (`canViewCertificate`: holder, managers, reviewer, pool tutor, admins) |
| `/api/v1/health`                | GET      | Health check (returns `{ status: 'ok' }`)                                                        |
| `/api/v1/mail-preferences`      | POST     | One-click unsubscribe from a mail category (signed token)                                        |
| `/api/v1/cron/daily`            | GET      | Daily maintenance (Vercel Cron, `CRON_SECRET`)                                                   |

## Proxy lifecycle

`src/proxy.ts` (`NextProxy`, never `middleware.ts`) intercepts every non-static request:

1. `auth.api.getSession()` validates the session from signed HTTP-only cookies.
2. An unauthenticated or banned user redirects to `/login`, with `?expired=true` when a session cookie was present.
   - A guest who loads a page with GET also gets `?next=<path and query>` so sign-in returns there. Banned users, non-GET requests, `/`, and `/dashboard` get none.
   - `safeNextPath` (`src/lib/next-path.ts`) is the only reader of `next`.
   - It accepts one same-site path starting with a single `/`, normalizes dot segments, and answers null for other origins, `//`, backslashes, control characters, `/login`, `/register`, and `/api`.
   - `login` redirects to the result or `/dashboard`.
3. An authenticated user with a null `onboardedAt` redirects to `/onboarding`.
4. An onboarded user on `/onboarding` redirects to `/dashboard`.
5. An authenticated user on `/login` redirects to the `safeNextPath` of `?next=`, or `/dashboard`.

- A single-segment public path matching `/^\/[a-zA-Z0-9.]+$/` that is not a dashboard root passes `isPublicPath`.
- The saved course-list filters redirect here for document requests (`architecture.md`, "Server vs client components").

### Dev matcher drop

- After a hot reload of the proxy or a module it imports, Next 16.3 dev can drop the proxy matcher, and guests then get 307 to `/login` on static assets.
- To check, request `/_next/static/chunks/a.js` with a cookieless curl: 404 is healthy, 307 means the matcher is gone.
- Another proxy recompile or a dev restart restores it. Signed-in probes and e2e logins hide the fault.

## Content Security Policy

- `next.config.ts` sets the CSP in `headers(isDevServer)`. Pages stay static shells, so there are no nonces.
- `script-src` is `'self' 'unsafe-inline'`. The inline allowance is for Next's RSC payload scripts. `'unsafe-eval'` is added only for the dev server phase (React Refresh and Turbopack).
- `experimental.sri` (`sha256`) adds `integrity` to the build-manifest scripts (bootstrap, polyfills, and entry chunks).
- On Next 16.4 with Turbopack, lazily referenced client chunk scripts carry no `integrity`. They stay same-origin under `'self'`.
- Never re-add `'unsafe-eval'` to production. If a dependency needs it at runtime, report it first.
- `object-src` is `'none'`. The review preview shows the HTML `CertificatePage`, and no page embeds a PDF.
- `frame-src` also lists the video hosts Plate's `parseVideoUrl` embeds (YouTube, Vimeo, Dailymotion, Youku, Coub). `media-src` allows `blob:` and `https:` for R2 audio and video.

## Navigation cache

- `/login` is not reachable with a revoked session: `getViewer` and `getCurrentUser` redirect to `/api/v1/session`, which signs the session out and lands on `/login?expired=true`.
- `LiveRefresh` in the dashboard layout calls `router.refresh()` once for each rise of the unread count, so a decision made by another user shows when its notification arrives.
