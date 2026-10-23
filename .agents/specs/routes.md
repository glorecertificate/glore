# Routes and proxy

Route groups, route gates, API routes, and the proxy lifecycle. Authentication detail: `reference.md`.

## Route groups

- `(auth)` holds unauthenticated pages and has no shared layout beyond the root.
- `(dashboard)` holds authenticated pages with the sidebar, wrapped in `SidebarProvider > SessionProvider`.
- The `dashboard/` and `courses/` layouts add `CoursesProvider`.
- `/` permanently redirects to `/dashboard` in `next.config.ts`.

## Public routes

- `/login`.
- `/register`: organization application (`organizations.md`).
- `/invite/[token]` and `/join/[token]`: token pages (`organizations.md`).
- `/verify` and `/verify/[code]`: certificate verification.
- `/[username]`: opt-in public profile. Its 404 offers guests join and login links and signed-in users the dashboard.
- `/privacy`, `/terms`, `/quality-charter`: Markdown from `content/legal/<doc>.<locale>.md`, with an `en` fallback notice.
- `LEGAL_ROOTS` feeds the proxy and the reserved usernames.
- `/offline`: PWA fallback.

## Authenticated routes

- Pre-onboarding: `/onboarding`, `/onboarding/error`.
- Dashboard layout, no extra gate: `/dashboard`, `/about`, `/help`, `/settings`.
- `/notifications`: inbox with status and topic filters.
- `/courses`.
- `/courses/[slug]`: overview for members, editor for editors.
- `/courses/[slug]/learn`: the player, with `?lesson=` and `?lang=`. The server grades answers and never sends `isCorrect`.
- `/courses/[slug]/complete`: completion summary, rating through `rateCourse`, next step.
- `/courses/skills`: editors only, skill group CRUD and course assignment. `skills` is a reserved course slug.
- `/docs`, `/docs/intro`, `/docs/faq`, `/docs/tutorials`, `/docs/articles/[slug]`.

## Gated routes

Dashboard layout with an extra gate:

| Route                       | Gate        | Notes                                                                                                                                                               |
| --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/admin`                    | `isAdmin`   | Overview, the panel landing (`admin.md`)                                                                                                                            |
| `/admin/team`               | `isAdmin`   | Team management (`admin.md`)                                                                                                                                        |
| `/admin/users`              | `isAdmin`   | User moderation and view as user (`admin.md`)                                                                                                                       |
| `/admin/certificates`       | `isAdmin`   | Certificate lookup and revocation (`admin.md`)                                                                                                                      |
| `/admin/audit`              | `isAdmin`   | Audit log (`admin.md`)                                                                                                                                              |
| `/emails`                   | `canEdit`   | Email previews (`?template=`, `?lang=`, `?category=`), outside the admin layout; `loadEmailPreview` checks `isAdmin` or `canEdit` itself                            |
| `/admin/organizations`      | `isAdmin`   | Tabs all/pending/active/rejected; application sheet, approve (invites), reject (soft), create, invite                                                               |
| `/admin/organizations/[id]` | `isAdmin`   | `?tab=` application, members, invitations, certificates, activity, settings (shared with `/organization`)                                                           |
| `/organization`             | org manager | `?tab=` overview, members, invitations, requests, certificates, insights, activity, settings                                                                        |
| `/certificates`             | non-editor  | List (tutors: queue tabs; org owners and representatives: pipeline); `/certificates/new`, `/certificates/[id]`, and `/certificates/[id]/review` share the same gate |

## API routes

| Path                            | Method   | Description                                                |
| ------------------------------- | -------- | ---------------------------------------------------------- |
| `/api/auth/[...all]`            | GET/POST | Better Auth catch-all; `/api/auth/admin/*` answers 404     |
| `/api/v1/ai/command`            | POST     | AI command (editors, rate limited)                         |
| `/api/v1/ai/copilot`            | POST     | AI copilot (editors, rate limited)                         |
| `/api/v1/join`                  | GET      | Team invitation join endpoint                              |
| `/api/v1/manifest`              | GET      | Dynamic PWA manifest (locale-aware, cached 1h)             |
| `/api/v1/session`               | GET      | Clears cookies of a stale session, then login              |
| `/api/v1/upload`                | POST     | R2 file upload (editors, rate limited)                     |
| `/api/v1/certificates/[id]/pdf` | GET      | Certificate PDF on demand (holder, reviewer, org managers) |
| `/api/v1/health`                | GET      | Health check (returns `{ status: 'ok' }`)                  |
| `/api/v1/mail-preferences`      | POST     | One-click unsubscribe from a mail category (signed token)  |
| `/api/v1/cron/daily`            | GET      | Daily maintenance (Vercel Cron, `CRON_SECRET`)             |

## Proxy lifecycle

`src/proxy.ts` (`NextProxy`, never `middleware.ts`) intercepts every non-static request:

1. `auth.api.getSession()` validates the session from signed HTTP-only cookies.
2. An unauthenticated or banned user redirects to `/login`, with `?expired=true` when a session cookie was present.
   - A guest who loads a page with GET also gets `?next=<path and query>` so sign-in returns there. Banned users, non-GET requests, `/`, and `/dashboard` get none.
   - `safeNextPath` (`src/lib/next-path.ts`) is the only reader of `next`. It accepts one same-site path starting with a single `/`, normalizes dot segments, and answers null for other origins, `//`, backslashes, control characters, `/login`, `/register`, and `/api`. `login` redirects to the result or `/dashboard`.
3. An authenticated user with a null `onboardedAt` redirects to `/onboarding`.
4. An onboarded user on `/onboarding` redirects to `/dashboard`.
5. An authenticated user on `/login` redirects to `/dashboard`.

- A single-segment public path matching `/^\/[a-zA-Z0-9.]+$/` that is not a dashboard root passes `isPublicPath`.
- The saved course-list filters redirect here for document requests (`architecture.md`, "Server vs client components").
- After a hot reload of the proxy or a module it imports, Next 16.3 dev can drop the proxy matcher, and guests then get 307 to `/login` on static assets.
- To check, request `/_next/static/chunks/a.js` with a cookieless curl: 404 is healthy, 307 means the matcher is gone.
- Another proxy recompile or a dev restart restores it. Signed-in probes and e2e logins hide the fault.
