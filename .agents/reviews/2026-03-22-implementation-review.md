# GloRe Implementation Review — 2026-03-22

## Summary

| Severity  | Count  |
| --------- | ------ |
| Critical  | 4      |
| High      | 17     |
| Medium    | 35     |
| Low       | 20     |
| **Total** | **76** |

Reviewed domains: Features, Performance, Code Organization, Scalability, Security, Developer Experience, Infrastructure.
Duplicates across domains have been merged; the higher severity is retained when reviewers disagreed.

---

## Findings by domain

### Features

#### `admin-pages-missing-role-checks` — Admin pages missing role checks

**Severity:** critical
**Detail:** Platform admin pages (`/admin`, `/admin/users`, `/admin/organizations`) do not verify `user.isAdmin` in their server component guards. The layout calls `notFound()` only for the outer admin layout, but organization admins with a non-admin platform role may still trigger the guard path inconsistently, and the check is not repeated at the page level. This risks granting organization-scoped roles access to platform-wide admin features.
**Suggestion:** Add an explicit `if (!user.is_admin) notFound()` check at the top of every admin page server component. Reinforce this in `proxy.ts` by adding a route-level guard for the `/admin` prefix in addition to the layout-level check.

---

#### `cert-eligibility-cache-stale` — Certificate eligibility cache not invalidated on course completion

**Severity:** high
**Detail:** After a user completes all required courses, the certificate eligibility state on `/certificates` may still show "not eligible" because the eligibility query is cached under the `certificates` or `courses` tag and is not revalidated when a course is completed or rated. Users encounter a confusing dead end: they finished the work but cannot proceed.
**Suggestion:** Call `revalidateTag(CacheTag.Certificates)` (and `CacheTag.Courses` if course completion state is also cached) inside the server action that records course completion and the one that records a course rating.

---

#### `join-request-rejection-reason-hidden` — Organization join request rejection reason not shown

**Severity:** high
**Detail:** When a platform admin rejects a join request, the rejection reason is written to the database but the join-request UI for the applicant never displays it. The user only sees that their request was rejected with no explanation, leading to confusion and repeated unsupported re-submissions.
**Suggestion:** Surface the rejection reason in the join-request status view. Add a translation key (e.g., `Auth.joinRequestRejectedReason`) to all three locale files and render the field wherever request status is displayed to the applicant.

---

#### `no-slug-availability-check` — No real-time slug availability check in course form

**Severity:** high
**Detail:** The course creation and edit forms submit without checking slug uniqueness first. When a duplicate slug is submitted the server action returns a database unique-constraint error, but the form UI does not translate this into a user-friendly field-level error; the user sees a generic failure and must manually figure out what to change.
**Suggestion:** Add a debounced server action (e.g., `checkSlugAvailable(slug: string)`) that queries `db.query.courses.findFirst({ where: eq(courses.slug, slug) })` and returns a boolean. Wire it to an `onChange` handler on the slug input to show an inline "already taken" message before submission.

---

#### `cert-form-missing-field-errors` — Certificate form missing field-level validation errors

**Severity:** medium
**Detail:** The certificate form does not display per-field error messages for several constraints: minimum/maximum description length, the requirement for at least one associated skill, and non-positive activity duration. Users submit incomplete or invalid data and only receive a top-level rejection with no indication of which field to fix.
**Suggestion:** Add Zod refinements for each constraint and wire the `formState.errors` from react-hook-form to error message components beneath each affected field. Add corresponding translation keys for each error message.

---

#### `docs-article-edit-delete-missing` — Docs article edit and delete functionality missing

**Severity:** medium
**Detail:** The documentation system (`/docs/*`) provides UI and server actions for creating articles and categories, but there are no edit or delete actions for articles. Admins cannot correct mistakes or remove outdated content without direct database access.
**Suggestion:** Implement `updateDocArticle` and `deleteDocArticle` server actions (mirroring the existing `createDocArticle` pattern) and expose them in the docs UI via an edit dialog and a delete confirmation prompt.

---

#### `missing-empty-states` — Multiple screens missing empty states

**Severity:** medium
**Detail:** Notifications, organization join requests, and docs category article lists render a blank area when their data arrays are empty. There is no empty-state message, illustration, or call-to-action, leaving users with a visually broken experience.
**Suggestion:** Add an `<EmptyState />` component (or reuse an existing one from `src/components/ui/`) to each list that can render empty. Pass a relevant message and optional action (e.g., "No notifications yet", "No pending requests").

---

#### `no-session-expiry-feedback` — No user feedback on session expiry

**Severity:** medium
**Detail:** When a session cookie expires or is invalidated, the proxy redirects the user to `/login` without any explanation. The user may have just submitted a form or been mid-flow, with no indication that the redirect was caused by session expiry rather than an error.
**Suggestion:** Before redirecting to `/login`, append a `?reason=session_expired` query parameter. On the login page, detect this parameter and show a dismissible toast (e.g., `toast.info('Your session expired. Please sign in again.')`) using the `sonner` integration already present in the codebase.

---

#### `no-signout-confirmation` — No confirmation before signing out the current session

**Severity:** medium
**Detail:** The sign-out button in the session management UI immediately invokes the sign-out action for the currently active session without a confirmation step. A misclick mid-workflow causes an immediate page redirect to `/login`, discarding any unsaved state.
**Suggestion:** Wrap the sign-out action for the current session in an `<AlertDialog>` (already available in `src/components/ui/`) that requires explicit confirmation before proceeding.

---

#### `cert-no-draft-save` — Certificate cannot be saved as draft

**Severity:** medium
**Detail:** The certificate form requires all fields to be valid before a submission can proceed. There is no way to save partial progress and resume later. A user who fills in half the form and navigates away loses all their input.
**Suggestion:** Add a "Save draft" button to the certificate form that calls a dedicated server action to persist the current field values with `status: 'draft'`. The form should reload previously saved draft values on mount.

---

#### `org-invite-email-silent-failure` — Organization invitation email failures are silent

**Severity:** medium
**Detail:** If `sendMail()` throws or rejects when sending an organization invitation email, the error is not surfaced to the inviter. The UI shows the invitation as sent, but the recipient never receives it. There is also no resend mechanism.
**Suggestion:** Wrap the `sendMail()` call in the invitation server action with a try/catch and return a distinct error code (e.g., `EMAIL_DELIVERY_FAILED`) when it fails. On the client, show a specific error toast and keep the invite in a "failed" state with a visible resend option.

---

#### `console-errors-production` — Console errors logged in production code

**Severity:** low
**Detail:** Auth and admin form handlers call `console.error(error)` unconditionally. In production these logs appear in Vercel function logs but may also expose stack traces or internal error details to browser devtools.
**Suggestion:** Replace unconditional `console.error` calls with a guard: `if (process.env.NODE_ENV !== 'production') console.error(error)`. For production, use a structured logging service or log only a sanitized message.

---

#### `course-rating-before-completion` — Course rating allowed before all lessons are completed

**Severity:** low
**Detail:** Users can submit a course rating without completing all lessons. Since course eligibility for certification depends on both completion and rating, this can produce inconsistent eligibility state — a user has a rating but an incomplete course.
**Suggestion:** In the rating server action, verify that all required lessons for the course are marked complete for the current user before accepting a rating. Return a validation error if they are not.

---

#### `no-qr-code-cert-page` — No QR code or social share on public certificate page

**Severity:** low
**Detail:** The public certificate page (`/[username]`) schema and translation keys include references to QR code and social share functionality, but neither feature is implemented in the current UI. The `qrcode` package is already installed in `package.json`.
**Suggestion:** Implement the QR code using the installed `qrcode` package to generate a code pointing to `/${username}?v=${handle}`. Add social share buttons (LinkedIn, X/Twitter) using the Web Share API with a fallback to clipboard copy.

---

#### `docs-search-missing` — Documentation search and filter functionality missing

**Severity:** low
**Detail:** The `/docs` pages list articles with no search or filter capability. As the documentation grows, finding specific articles requires scrolling through all categories. The `fuse.js` package is already installed.
**Suggestion:** Add a search input to the docs layout that uses Fuse.js (already installed) to fuzzy-search article titles and content client-side, or wire it to a server action for server-side filtering.

---

### Performance

#### `overuse-use-client` — Overuse of `'use client'` in feature components

**Severity:** high
**Detail:** Many components under `src/components/features/` carry a `'use client'` directive even when they only render static props or use non-interactive patterns. This forces those components and their entire import subtree into the client bundle, increasing JS payload and preventing RSC streaming optimizations.
**Suggestion:** Audit every `'use client'` file in `src/components/features/`. Convert components that have no hooks, no event handlers, and no browser-only APIs to server components. Where a small interactive leaf requires `'use client'`, extract only that leaf and keep the wrapper as a server component.

---

#### `heavy-client-deps` — Heavy client-side dependencies (Fuse.js, `@react-pdf/renderer`)

**Severity:** high
**Detail:** `fuse.js` is imported directly in the `SearchCommand` client component, and `@react-pdf/renderer` is used in the certificate document component which is dynamically imported from a server action. Both are large libraries; shipping `@react-pdf/renderer` to the client adds significant parse time on low-end devices, while Fuse.js on the client prevents the search index from being built server-side.
**Suggestion:** Move the Fuse.js search index build to a server action or API route and return only the matched results to the client. For PDF generation, keep `@react-pdf/renderer` entirely on the server (it already is in `actions/certificate.ts`, but verify no client-side import path exists). Use `next/dynamic` with `{ ssr: false }` for any remaining client-only heavy component.

---

#### `sequential-data-fetching` — Sequential `await` calls in data-fetching pages

**Severity:** high
**Detail:** In `src/app/(dashboard)/courses/[slug]/page.tsx` (and similar pages), multiple independent server-side calls (`getCourse`, `getCurrentUser`, `getCookie`) are awaited one after another. Each call introduces serial latency: if each takes 50ms, three sequential calls waste 100ms of wall time that could be eliminated.
**Suggestion:** Replace sequential awaits with `Promise.all`: `const [course, user, locale] = await Promise.all([getCourse(slug), getCurrentUser(), getCookie('NEXT_LOCALE')])`. Apply the same pattern to any page that makes two or more independent async calls at the top level.

---

#### `missing-cache-on-queries` — Some read queries do not use `'use cache'`

**Severity:** medium
**Detail:** While the primary fetch functions use the `'use cache'` directive and `cacheTag()`, several secondary lookup queries in the actions layer (e.g., user lookups inside mutation actions, inline `findFirst` calls for validation) are executed without caching. These repeated reads on hot paths cause unnecessary round-trips to Neon.
**Suggestion:** Extract repeated read queries into cached helper functions tagged with the appropriate `CacheTag`. For one-off validation reads inside mutations, at minimum use React `cache()` to deduplicate within the same request.

---

#### `over-fetching-queries` — Over-fetching columns in certificate and course queries

**Severity:** medium
**Detail:** Several list queries (e.g., `fetchCertificates`, course list in the sidebar) fetch full rows including large `IntlRecord` JSON fields and binary-adjacent content even when the UI only needs a title, ID, and status. This inflates DB data transfer and server memory.
**Suggestion:** Use Drizzle's `columns` selector in `findMany`/`findFirst` calls for list and card views to fetch only the columns actually rendered. Reserve full-row fetches for detail and edit views.

---

#### `missing-suspense-boundaries` — Suspense boundaries missing on some dashboard pages

**Severity:** medium
**Detail:** Several dashboard pages (e.g., `src/app/(dashboard)/dashboard/page.tsx`) render data-fetching feature components directly without wrapping them in `<Suspense>`. This blocks the entire page render until all data is available, degrading perceived load time and preventing streaming.
**Suggestion:** Apply the "Page Suspense pattern" documented in `AGENTS.md` to every page that fetches async data: wrap the inner async component in `<Suspense fallback={<LoadingFallback />}>` so the page header renders immediately while data loads.

---

#### `no-next-image-optimization` — Images not using `next/image` or lazy loading

**Severity:** low
**Detail:** Feature components use plain `<img>` tags and static imports rather than `next/image`, missing automatic format conversion (WebP/AVIF), responsive srcset generation, built-in lazy loading, and LCP optimization hints.
**Suggestion:** Replace all `<img>` tags in feature and layout components with `next/image`. Set `loading="lazy"` for below-the-fold images and `priority` for the most prominent above-the-fold image (e.g., the organization logo in the sidebar header).

---

#### `bundle-size-not-in-ci` — Bundle size check not enforced in CI or main check script

**Severity:** low
**Detail:** `package.json` defines a `check:size` script backed by `size-limit`, but this script is not included in `pnpm run check` or `pnpm run check:parallel`, nor is it run in any CI pipeline. Bundle regressions go undetected until a developer manually runs the size check.
**Suggestion:** Add `pnpm run check:size` as a step in the CI workflow (or append it to `pnpm run check`). Set failure thresholds in `.size-limit.json` for the main JS chunk and the page-level chunks that matter most.

---

#### `unnecessary-usememo-usecallback` — Unnecessary `useMemo`/`useCallback` in client components

**Severity:** low
**Detail:** Several client components manually wrap values and callbacks in `useMemo`/`useCallback`. With `reactCompiler: true` enabled in `next.config.ts`, the React Compiler handles memoization automatically; manual memoization adds code complexity and can interfere with the compiler's analysis.
**Suggestion:** Remove manual `useMemo` and `useCallback` wrappers from client components that do not use a pattern the compiler cannot handle (e.g., external mutable refs, impure computations). The compiler will emit equivalent optimizations.

---

#### `no-explicit-cache-revalidation` — Mutations missing `revalidateTag` after DB writes

**Severity:** low
**Detail:** Not all mutation server actions call `revalidateTag()` after a successful database write. Actions that update user profile fields, lesson ordering, and notification state leave the cache stale, meaning the UI reflects old data until the Next.js cache naturally expires.
**Suggestion:** Add a `revalidateTag(CacheTag.*)` call for every affected cache tag at the end of each mutation server action. Use the existing `CacheTag` enum to ensure consistency.

---

#### `no-explicit-react-cache` — Expensive pure computations not wrapped in `React.cache()`

**Severity:** low
**Detail:** `next.config.ts` enables `cacheComponents`, but expensive pure server-side computations (e.g., permission derivation in `parseUser`, repeated permission checks in layout guards) are not wrapped in `React.cache()`. This allows them to run more than once per request when called from multiple sibling server components.
**Suggestion:** Wrap request-scoped pure functions that are called from multiple places in the same render tree with `React.cache()`. For example, `getCurrentUser` already uses this pattern — apply it to other expensive reads like organization membership lookups used in multiple layout segments.

---

### Code Organization

#### `massive-static-data-files` — Massive static data files embedded in the component tree

**Severity:** high
**Detail:** `src/components/ui/icon-picker/data.ts` is approximately 13,843 lines of static icon metadata encoded as a TypeScript module inside the UI component tree. `src/components/ui/globe/data.ts` adds another ~458 lines of geographic coordinate data. Both bloat TypeScript parse time, inflate the server memory footprint during compilation, and are unnecessarily tied to the UI component lifecycle.
**Suggestion:** Move both datasets to static JSON files outside the component tree: `src/data/icons.json` and `src/data/globe.json`. Import them lazily via `next/dynamic` or a server action so they are never included in the initial client bundle. For the icon picker specifically, consider splitting into smaller per-category chunks and loading on demand.

---

#### `oversized-ui-components` — Oversized components exceeding maintainability thresholds

**Severity:** high
**Detail:** Several files far exceed the 300-line guideline documented in `AGENTS.md`: `src/components/features/organization/panel.tsx` (~1196 lines), `src/components/features/users/user-settings.tsx` (~881 lines), `src/components/blocks/rich-text-editor/ui/font-color-toolbar-button.tsx` (~767 lines), `src/components/ui/sidebar.tsx` (~699 lines), and multiple course editor components in the 400–700 line range. These files mix rendering, state management, and business logic in ways that make them hard to test and navigate.
**Suggestion:** Break `panel.tsx` into focused sub-components: `OrgPanelHeader`, `OrgMembersSection`, `OrgJoinRequestsSection`, `OrgSettingsSection`. Move stateful logic into feature-scoped hooks under `src/components/features/organization/hooks/`. Apply the same decomposition to `user-settings.tsx` and the rich-text editor toolbar. Target under 300 lines per file.

---

#### `function-declaration-sortable` — Function declaration used instead of arrow function in `sortable.tsx`

**Severity:** medium
**Detail:** `src/components/ui/sortable.tsx` contains `function useSortableItemContext(consumerName: string) { ... }`, a function declaration. The project mandates arrow functions exclusively (`const f = () => {}`), enforced by `eslint/prefer-arrow-callback`. Having a mixed style in a shared UI file sets a bad precedent and can circumvent transform expectations.
**Suggestion:** Convert to `const useSortableItemContext = (consumerName: string) => { ... }` and export it inline. Run `pnpm run typecheck` after the change to confirm no signature regressions.

---

#### `email-template-default-exports` — Email templates use identifier-assigned default exports

**Severity:** medium
**Detail:** Multiple email templates (e.g., `src/emails/organization/join-request.tsx`) end with a separate `export default OrganizationJoinRequestEmail` after declaring a named `const`. The project rule (`AGENTS.md`) requires direct default exports: `export default (props: Props) => { ... }`. The current pattern is inconsistent and requires readers to trace back to the declaration.
**Suggestion:** Rewrite affected email templates to use a direct inline default export: `export default ({ prop1, prop2 }: Props) => { ... }`. This applies to all files in `src/emails/` that currently follow the `const Foo = ...; export default Foo` pattern.

---

#### `provider-context-split-inconsistent` — Provider/context split not consistently applied

**Severity:** medium
**Detail:** `AGENTS.md` prescribes splitting providers into `*-context.tsx` (context creation + hook) and `*-provider.tsx` (server-side composition + provider component). Several providers (`src/components/providers/courses-context.tsx`, `pwa-context.tsx`, `session-context.tsx`, `i18n-provider.tsx`) bundle context and provider logic in a single file, making it harder to isolate context creation from server-side data fetching and complicating reuse.
**Suggestion:** Split each affected provider into two files following the documented pattern. Move `createContext`, the typed hook, and the `export interface` to `*-context.tsx`. Move the provider component (with any server-side fetching or composition) to `*-provider.tsx`. Update imports across the codebase.

---

#### `actions-importing-ui-components` — Server actions importing UI components for PDF rendering

**Severity:** medium
**Detail:** `src/actions/certificate.ts` dynamically imports `@/components/features/certificates/document` (a React component) and invokes `@react-pdf/renderer` to generate a PDF. While the import is dynamic and server-executed, it blurs the architectural boundary between the application logic layer (actions) and the presentation layer (components). This also makes the certificate document harder to test in isolation.
**Suggestion:** Move the PDF renderer and `CertificateDocument` component to a server-only module outside the `components/` tree, for example `src/server/pdf/certificate-document.tsx`. Export a `renderCertificatePdf(certificate)` function from there. `actions/certificate.ts` then calls this function without depending on the UI component tree.

---

#### `large-action-modules` — Large action modules with mixed responsibilities

**Severity:** medium
**Detail:** Several action files have grown very large: `src/actions/organization.ts` (~881 lines), `src/actions/admin.ts` (~606 lines), `src/actions/certificate.ts` (~563 lines). Each file mixes validation, database queries, email sending, cache invalidation, and notification logic, making it hard to locate specific behavior and increasing the risk of accidental regressions during edits.
**Suggestion:** Split each large action module into responsibility-scoped sub-files. For example: `src/actions/certificate/create.ts`, `src/actions/certificate/review.ts`, `src/actions/certificate/documents.ts`. Export a composed facade from `src/actions/certificate/index.ts` to preserve import compatibility.

---

#### `many-files-exceed-300-lines` — Many files exceed the 300-line per-file guideline

**Severity:** medium
**Detail:** Automated line counting identifies numerous files beyond the 300-line guideline beyond the ones already called out as individual findings: course editor files in the 400–700 line range, `src/components/ui/sidebar.tsx` (~699 lines), and others. Left unaddressed, this pattern compounds the readability and maintainability debt over time.
**Suggestion:** Triage the list of files over 300 lines in a dedicated refactor session. Prioritize those that mix rendering with business logic. Factor out helper modules, constants, and subcomponents. Aim to address the top 5–10 offenders per sprint.

---

#### `sortable-provider-value-bug` — `SortableContentContext.Provider` rendered without a `value` prop

**Severity:** low
**Detail:** In `src/components/ui/sortable.tsx`, `SortableContentContext.Provider` is rendered as `<SortableContentContext.Provider value>` (i.e., `value` is treated as a boolean shorthand attribute, not a prop assignment). This is invalid in React and may cause a runtime warning or incorrect context behavior in consuming components.
**Suggestion:** Fix to `<SortableContentContext.Provider value={true}>` (or whatever the intended value is) and add a minimal runtime test or Storybook story to verify context consumers receive the correct value.

---

#### `validation-schemas-wrong-location` — Validation schemas shared between UI and actions placed under `components/`

**Severity:** low
**Detail:** `src/components/features/certificates/schemas` is imported by `src/actions/certificate.ts`. Schemas shared between client components and server actions are cross-cutting concerns; placing them under `components/features/` implies they are UI-only, which misleads future contributors and risks accidentally pulling UI-only imports into the server action boundary.
**Suggestion:** Move shared validation schemas to a neutral location such as `src/features/certificates/schemas.ts` or keep them in `src/lib/validation/`. Update all imports in both the actions and the component tree.

---

### Scalability

#### `missing-fk-indexes` — Missing indexes on foreign key columns across multiple tables

**Severity:** critical
**Detail:** The database schema for `certificates`, `lessons`, `memberships`, `certificate_skills`, and `notifications` contains foreign key columns (`userId`, `organizationId`, `courseId`, `certificateId`) without explicit indexes. Drizzle's `references()` syntax creates foreign key constraints but does not automatically create covering indexes in PostgreSQL. As row counts grow, every join and filtered lookup on these columns will perform sequential scans rather than index seeks, causing query latency to degrade non-linearly. (Also noted in the performance review for `certificates` and `certificate_skills`.)
**Suggestion:** Add explicit `.index()` declarations in the Drizzle schema for every foreign key column. Run `pnpm db generate` to produce the migration SQL and `pnpm db migrate` to apply it. Priority order: `certificates.userId`, `certificates.organizationId`, `memberships.organizationId`, `memberships.userId`, `certificate_skills.certificateId`, `lessons.courseId`, `notifications.userId`.

---

#### `broad-cache-invalidation` — Cache invalidation is tag-level rather than record-level

**Severity:** high
**Detail:** After mutations (e.g., approving a certificate, updating a course), `revalidateTag(CacheTag.Certificates)` or `revalidateTag(CacheTag.Courses)` invalidates the entire tag, causing all cached queries for all records under that tag to be re-fetched simultaneously. As the dataset grows this creates cache stampede bursts after every mutation.
**Suggestion:** Introduce per-record cache tags (e.g., `CacheTag.Course + '-' + slug`, `CacheTag.Certificate + '-' + id`) for detail-level queries. Invalidate the per-record tag on single-record mutations and the broad tag only on bulk operations (e.g., reordering all courses). Update the `CacheTag` enum and tagging calls accordingly.

---

#### `overly-wide-tables` — Overly wide table definitions with many nullable columns

**Severity:** medium
**Detail:** The `users` and `organizations` tables have a large number of nullable columns covering optional profile fields, metadata, and feature flags. Wide rows with many sparse nullable fields increase the on-disk row size, slow down full-row scans, and complicate query planning.
**Suggestion:** Evaluate moving infrequently accessed optional fields (e.g., social links, notification preferences) into a separate one-to-one `user_profiles` or `organization_settings` table, or into a JSONB column. This keeps the primary table narrow and fast for the hot path (session validation, membership lookups).

---

#### `no-partial-indexes` — No partial indexes for filtered queries on status and boolean columns

**Severity:** medium
**Detail:** Queries filter on `notifications.read = false`, `certificates.status = 'submitted'`, and `organization_requests.status = 'pending'`, but there are no partial indexes for these predicates. As row counts grow, these filtered scans will read many rows that do not match, wasting I/O.
**Suggestion:** Add partial indexes in the Drizzle schema for the most-queried filtered predicates. Examples: `index().on(notifications.read).where(sql`read = false`)`, `index().on(certificates.status).where(sql`status = 'submitted'`)`. Generate and apply via `pnpm db generate && pnpm db migrate`.

---

#### `no-query-result-size-limits` — Queries do not enforce maximum result sizes

**Severity:** medium
**Detail:** `fetchUserCertificates`, `fetchDocCategories`, and several admin list actions do not apply a `.limit()` clause. If a user accumulates hundreds of certificates or an admin queries all organizations, the query returns unbounded result sets, causing high memory usage on the serverless function and slow response times.
**Suggestion:** Add a `.limit(n)` clause to every `findMany` call, with a sensible default (e.g., 100–500). For UIs that need full lists, implement cursor-based or offset pagination and update the action signature to accept `{ page, pageSize }` parameters.

---

#### `no-index-text-columns` — Frequently queried unique text columns may lack explicit indexes

**Severity:** medium
**Detail:** Columns such as `users.email`, `organizations.handle`, and `courses.slug` are declared with `.unique()` in the Drizzle schema. PostgreSQL does create an index for unique constraints, but confirming this in the generated migration SQL is important; some ORM versions emit `UNIQUE` inline without a separate `CREATE INDEX`. Without an explicit covering index, lookups by these columns may not use the optimal index in all query plans.
**Suggestion:** Review the generated migration SQL in `drizzle/*.sql` to confirm that B-tree indexes exist for `users.email`, `organizations.handle`, and `courses.slug`. If only a `UNIQUE` constraint exists without a corresponding index definition, add explicit `.index()` calls in the schema and regenerate migrations.

---

#### `no-rate-limiting-expensive-actions` — No rate limiting on expensive server actions

**Severity:** low
**Detail:** Expensive server actions such as certificate PDF generation, bulk notification dispatch, and AI endpoint calls have no per-user rate limiting. A motivated user could trigger certificate PDF generation in a tight loop, exhausting server CPU and Neon connection pool credits.
**Suggestion:** Add a simple in-process token bucket or use Vercel's Edge middleware rate limiting for the AI API routes. For certificate generation, track the last generation timestamp per user and reject requests within a minimum interval (e.g., 10 seconds).

---

#### `no-concurrent-write-handling` — No optimistic or pessimistic locking for concurrent writes

**Severity:** low
**Detail:** Critical records such as certificates (status transitions) and organization memberships (role changes) have no version column or advisory lock. Concurrent requests from different sessions (e.g., two admins approving the same certificate simultaneously) can produce lost-update anomalies.
**Suggestion:** Add a `version` integer column to `certificates` and increment it on each update. Use an optimistic concurrency check: `WHERE id = $id AND version = $expected_version`. If the update affects 0 rows, return a `CONCURRENT_MODIFICATION` error to the caller.

---

### Security

#### `upload-endpoint-unauthenticated` — `/api/v1/upload` has no authentication, no MIME validation, and no size limit (Security + Infrastructure)

**Severity:** critical
**Detail:** `src/app/api/v1/upload/route.ts` performs no session check before accepting a file and writing it to the R2 bucket. The proxy matcher in `src/proxy.ts` explicitly excludes `/api/` paths, so no upstream auth gate exists. Additionally: (1) the R2 key is derived from the user-supplied `file.name`, which may contain path-separator characters; (2) `file.type` is forwarded verbatim as `ContentType` without server-side verification; (3) there is no file-size cap. An unauthenticated actor can upload arbitrary multi-GB blobs at the bucket owner's cost, or upload HTML/SVG content with a spoofed MIME type for later retrieval from the R2 public URL.
**Suggestion:** (1) Add a session guard at the top of the `POST` handler: `const session = await auth.api.getSession({ headers: request.headers }); if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })`. (2) Add a hard size cap: `if (file.size > 5 * 1024 * 1024) return new Response(null, { status: 413 })`. (3) Validate MIME type server-side using the `file-type` library against an allowlist (`image/png`, `image/jpeg`, `image/webp`). (4) Compose the R2 key from a server-generated UUID and the validated extension only, never from user-supplied input.

---

#### `ai-endpoints-unauthenticated` — AI API endpoints have no authentication and leak internal errors (Security + Infrastructure)

**Severity:** critical
**Detail:** Both `src/app/api/v1/ai/command/route.ts` and `src/app/api/v1/ai/copilot/route.ts` perform no session check. Because `proxy.ts` excludes `/api/` routes, both endpoints are fully public. Any unauthenticated actor can send arbitrary prompts to the platform's Gemini quota. Additionally, the `/copilot` route returns `{ details: error }` in the error response body, leaking raw API error objects and potential stack traces to callers.
**Suggestion:** Add `auth.api.getSession()` guards at the top of both handlers before reading the request body. Replace `return NextResponse.json({ details: error, ... })` in the error path with a generic message (`{ error: 'Internal server error' }`). Cap `maxOutputTokens` to a reasonable value (e.g., 2048) and implement per-user rate limiting.

---

#### `ai-client-supplied-api-key` — AI routes accept a client-supplied API key (Security + Infrastructure)

**Severity:** high
**Detail:** Both AI endpoints read `apiKey` from the JSON request body and pass it directly to `createGoogleGenerativeAI()`: `const key = apiKey ?? process.env.GEMINI_API_KEY`. Even after adding authentication (see `ai-endpoints-unauthenticated`), a logged-in user can supply their own Gemini key to route arbitrary traffic through the platform's server, bypassing any per-user rate limiting, billing controls, or model allowlists added later. The `model` field is similarly user-controlled, allowing callers to select any Gemini model including expensive ones.
**Suggestion:** Remove the `apiKey` and `model` fields from the request body schema entirely. Always use `process.env.GEMINI_API_KEY` and `process.env.GEMINI_MODEL` on the server side. If per-user API keys are a genuine future requirement, gate them behind an explicit allowlist validated server-side.

---

#### `auth-input-privilege-escalation` — `isEditor` and `onboardedAt` marked `input: true` in Better Auth, enabling self-promotion

**Severity:** high
**Detail:** In `src/lib/auth.ts`, the `additionalFields` block has `isEditor: { input: true }` and `onboardedAt: { input: true }`. Better Auth's `input: true` makes these fields writable via the `updateUser` API endpoint. Any authenticated user can call `auth.updateUser({ isEditor: true })` to grant themselves course-editing rights, or set `onboardedAt` to any past timestamp to skip the onboarding flow.
**Suggestion:** Set `input: false` on `isEditor`, `onboardedAt`, and every other server-managed field that should not be writable by the user themselves. Role and state transitions must go through dedicated server actions that verify the caller's existing privileges before applying changes.

---

#### `course-mutations-no-auth` — Course-content mutation actions have no authentication or role check

**Severity:** high
**Detail:** The following exported server actions in `src/actions/course.ts` perform database writes with no authentication or editor-role check: `deleteCourse`, `createLesson`, `upsertLessons`, `reorderCourses`, `upsertQuestions`, `deleteQuestions`, `upsertEvaluations`, `deleteEvaluations`, `upsertAssessment`, `deleteAssessment`. `updateCourse` calls `getAuthUser()` to retrieve a user ID but never verifies the `isEditor` or `is_admin` flag. `createCourse` checks that the user is authenticated but not that they are an editor. Any authenticated user can create, mutate, or delete course content.
**Suggestion:** Add an `assertEditor` guard (mirroring the `requireEditor` helper already in `src/actions/doc.ts`) and call it at the very top of each of these actions. This is a one-line addition per action. Ensure both `createCourse` and `updateCourse` include this guard as well.

---

#### `admin-actions-no-auth` — Admin data-fetch server actions expose all users and organizations to non-admin callers

**Severity:** high
**Detail:** `getTeamMembers`, `getAdminUsers`, and `getOrganizations` in `src/actions/admin.ts` are exported server actions with no authentication or admin-role check. The admin layout guard calls `notFound()` for non-admin users at the UI level, but Next.js server actions can be invoked directly via `POST` with the `Next-Action` header without loading the layout. `getAdminUsers` returns the full profile of every user on the platform; `getOrganizations` returns all organization records and their registration requests. Action IDs are extractable from the client bundle.
**Suggestion:** Add an `if (!user.is_admin) throw new Error('Unauthorized')` (or `notFound()`) check at the top of each of these functions. This mirrors the pattern already used in `banUser`, `updateUserRole`, and other admin mutation actions in the same file.

---

#### `update-user-no-ownership-check` — `updateUser` server action allows any authenticated user to overwrite any user's record

**Severity:** high
**Detail:** `src/actions/user.ts` exports `updateUser(id: string, values: TableUpdate<'users'>, previousEmail?: string)`. The function executes `db.update(users).set(values).where(eq(users.id, id))` with no session check and no ownership assertion. `TableUpdate<'users'>` is an unconstrained partial of the entire users table, including `role`, `isEditor`, `banned`, and any other column. Any caller who knows another user's ID (UUIDs are visible in profile URLs) can overwrite that user's record.
**Suggestion:** Retrieve the current session inside `updateUser` and assert that `session.user.id === id` or that the caller is a platform admin. Separately, narrow the `values` parameter to an explicit allowlist of safe self-editable columns (e.g., `Pick<TableUpdate<'users'>, 'name' | 'bio' | 'city' | 'country' | 'phone' | 'avatar'>`) to prevent privilege escalation through the update payload.

---

#### `notification-read-no-ownership` — `markNotificationRead` updates any notification without verifying ownership

**Severity:** medium
**Detail:** `src/actions/notification.ts` `markNotificationRead(id: number)` runs `UPDATE notifications SET read = true WHERE id = $id` without adding a `userId = $currentUser` predicate. Sequential notification IDs (integers) are trivially enumerable. An authenticated user can mark any other user's notifications as read, hiding security-relevant events (certificate status changes, join-request decisions) from the target.
**Suggestion:** Add `eq(notifications.userId, authUser.id)` as a second condition in the `WHERE` clause: `and(eq(notifications.id, id), eq(notifications.userId, authUser.id))`. Verify that `markAllNotificationsRead` already includes this predicate (the security reviewer confirms it does) and keep it as the reference implementation.

---

#### `push-delete-no-ownership` — `DELETE /api/v1/push` removes push subscriptions without an ownership check

**Severity:** medium
**Detail:** `src/app/api/v1/push/route.ts` DELETE handler verifies the caller is authenticated but then deletes the matching push subscription using `endpoint` alone: `db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, body.endpoint))`. A logged-in user who discovers another user's endpoint URL can silently unsubscribe them from push notifications.
**Suggestion:** Add `eq(pushSubscriptions.userId, session.user.id)` to the delete predicate: `and(eq(pushSubscriptions.endpoint, body.endpoint), eq(pushSubscriptions.userId, session.user.id))`. This mirrors the pattern already used in the `POST` handler.

---

#### `no-rate-limiting-auth` — No rate limiting on authentication or API endpoints

**Severity:** medium
**Detail:** `src/lib/auth.ts` has no `rateLimit` configuration. The sign-in endpoint (`/api/auth/sign-in/email`), password reset request, and registration flow are all unbounded, making credential brute-force and email-flooding attacks trivial. None of the custom API routes (`/api/v1/ai/*`, `/api/v1/push`, `/api/v1/upload`) have rate limiting either.
**Suggestion:** Enable Better Auth's built-in rate limiter: `rateLimit: { enabled: true, window: 60, max: 10 }` in the `betterAuth()` config, covering at minimum sign-in and password-reset endpoints. For `/api/v1/ai/*` and `/api/v1/upload`, apply a per-IP token bucket (implementable via Vercel Edge middleware or a simple in-process Map).

---

#### `avatar-upload-no-mime-validation` — Avatar upload actions do not validate file content server-side

**Severity:** medium
**Detail:** `src/actions/storage.ts` `uploadAvatar` passes the raw `File` object directly to `r2Put(...)` while hardcoding `'image/png'` as the `ContentType`. Similarly, `uploadOrganizationAvatar` in `src/actions/organization.ts` calls `r2Put(..., file, 'image/png')`. The `r2Put` helper forwards whatever buffer it receives without inspection. A user can upload a JavaScript or HTML file stored at a PNG path and retrieve it at the R2 public URL, potentially exploiting it in contexts where the CDN serves it with an executable MIME type.
**Suggestion:** Server-side, read the first bytes of the file and validate against expected magic bytes for PNG/JPEG/WebP (use the `file-type` package). Reject files whose magic bytes do not match the declared format. Enforce a per-feature size cap (e.g., 2 MB for avatars). Set `Content-Disposition: attachment` on R2 objects to prevent inline browser execution.

---

#### `list-org-tutors-no-auth` — `listOrgTutors` exposes tutor names and IDs without an authentication check

**Severity:** medium
**Detail:** `src/actions/organization.ts` `listOrgTutors(organizationId: number)` is an exported server action that queries all tutor memberships for a given organization and returns `firstName`, `lastName`, and `userId` with no call to `getAuthUser()`. By iterating integer `organizationId` values an unauthenticated (or non-member) caller can enumerate the full name and user ID of every tutor across all organizations.
**Suggestion:** Add authentication at the top: `const user = await getCurrentUser()`. Verify that the caller is a member of the specified organization (or at minimum an authenticated platform user) before returning results. Return only the fields required by the call site.

---

#### `invitation-no-session-binding` — Invitation acceptance does not bind token to the accepting user's session

**Severity:** low
**Detail:** `src/app/api/v1/join/route.ts` accepts an invitation by validating the token's expiry and setting `acceptedAt`, but it does not require the requester to already be authenticated. If an attacker intercepts a 16-byte hex token (128-bit, brute-force resistant) before it expires — via email forwarding, link sharing, or a compromised device — they can accept it on behalf of a different person and gain platform access.
**Suggestion:** Require the caller to already be authenticated before processing the token. Verify that `session.user.id === invitation.userId`. If the user is not yet authenticated, store the token in a short-lived signed cookie and redirect to `/login`, then complete the acceptance after the login flow.

---

#### `cookie-cache-revocation-window` — Cookie cache allows a 5-minute window where banned or revoked sessions remain active

**Severity:** low
**Detail:** `src/lib/auth.ts` enables `cookieCache` with `maxAge: 300` seconds. When a platform admin bans a user or revokes a session, the cached cookie payload continues to be accepted as valid for up to 5 minutes. High-risk operations (certificate approvals, admin mutations) can proceed during this window without a fresh database check.
**Suggestion:** This is a documented trade-off for most apps. If tighter revocation is needed for sensitive operations, reduce `maxAge` to 60 seconds, or call `auth.api.getSession({ headers, forceRefresh: true })` on admin-only actions. Also ensure that `revalidateTag(CacheTag.AuthUserStatus)` is called on ban/unban to force page-level cache expiry.

---

### Developer Experience

#### `no-precommit-hook` — No pre-commit hook; format check placed in the wrong Husky stage

**Severity:** high
**Detail:** There is no `.husky/pre-commit` hook. The `commit-msg` hook runs `pnpm oxfmt --check` after the commit message is written, which is the wrong stage for source-file validation. Without a `pre-commit` hook, type errors and lint violations can be committed locally and are only caught at `pre-push` time (when `check:parallel` runs), extending the feedback loop to the full push latency rather than a few seconds.
**Suggestion:** Create `.husky/pre-commit` with `pnpm run check:parallel` (or at minimum `pnpm run lint && pnpm oxfmt --check`). Move the `pnpm oxfmt --check` line out of `commit-msg` into this new hook. The `commit-msg` hook should only invoke `commitlint`.

---

#### `tsgolint-not-configured` — `oxlint-tsgolint` installed but type-aware rules not active

**Severity:** medium
**Detail:** `oxlint-tsgolint` is present in `devDependencies` and provides 59 type-aware TypeScript rules. The `lint` script does not pass `--type-aware`, so `tsgolint` is never invoked. High-value rules like `typescript/no-floating-promises` and `typescript/no-misused-promises` remain disabled, allowing silent async failures (unawaited promises, void returns from async callbacks) to accumulate.
**Suggestion:** Add `--type-aware` to the `lint` and `lint:fix` scripts in `package.json`. Add at minimum `"typescript/no-floating-promises": "error"` and `"typescript/no-misused-promises": "error"` to `.oxlintrc.json`. Review the full `tsgolint` rule list and enable additional rules that fit the codebase patterns (e.g., `typescript/await-thenable`, `typescript/no-unnecessary-type-assertion`).

---

#### `commitlint-scope-discrepancy` — `dev` scope missing from `commitlint.config.ts`

**Severity:** medium
**Detail:** `AGENTS.md` documents five allowed commit scopes: `deps`, `deps-dev`, `dev`, `release`, `security`. The actual `scope-enum` array in `commitlint.config.ts` contains only `['deps', 'deps-dev', 'release', 'security']` — the `dev` scope is absent. Any commit using `chore(dev): ...` fails commitlint validation with an error that contradicts the written documentation.
**Suggestion:** Add `'dev'` to the `scope-enum` array in `commitlint.config.ts`. The config file is the source of truth; `AGENTS.md` documents the expected state and should already be consistent once the config is fixed.

---

#### `no-lint-rule-cookies-import` — No lint rule enforcing the `cookies` import restriction

**Severity:** medium
**Detail:** `AGENTS.md` documents a critical convention: "Never import `cookies` from `next/headers` directly; use `@/actions/cookies`." This is enforced only by documentation, not by tooling. The existing `eslint/no-restricted-imports` rule only blocks parent-path imports. A developer unfamiliar with the codebase can freely import `cookies` from `next/headers` and bypass the typed prefix management system with no lint feedback.
**Suggestion:** Add the following entry to the `no-restricted-imports` rule in `.oxlintrc.json`:

```json
{
  "group": ["next/headers"],
  "importNames": ["cookies"],
  "message": "Use @/actions/cookies for typed cookie access with prefix management."
}
```

Note: `headers` from `next/headers` is legitimately used in `src/actions/auth.ts` for Better Auth and must not be blocked.

---

#### `safequery-non-descriptive-errors` — `safeQuery` always returns non-descriptive error codes

**Severity:** medium
**Detail:** Every error from `safeQuery` returns `{ code: 'QUERY_ERROR', message: error.message }` regardless of the root cause. `queryError` always returns `code: 'UNKNOWN'`. Callers receive the same code for connection failures, unique constraint violations, not-found cases, and timeouts, forcing them to parse the raw message string to distinguish error types. This makes programmatic error handling brittle and debugging slower.
**Suggestion:** Inspect `error.code` (from `@neondatabase/serverless`, which follows PostgreSQL error codes) and map it to typed constants before returning. At minimum, produce: `'UNIQUE_VIOLATION'` for PG code `23505`, `'NOT_FOUND'` for zero-row results, `'CONNECTION_ERROR'` for network-level failures, and `'QUERY_ERROR'` as the fallback. Expose these constants as a `QueryErrorCode` type for use in callers.

---

#### `no-shadow-rule-disabled` — `eslint/no-shadow` is disabled, allowing silent variable shadowing

**Severity:** medium
**Detail:** `eslint/no-shadow` is explicitly set to `"off"` in `.oxlintrc.json`. The codebase has many nested closures (server actions, React hooks, context providers, async callbacks) where locally declared variables can silently shadow outer ones. For example, a `const error` inside a `catch` block can shadow an outer `error` state variable, causing subtle bugs that are hard to spot in review.
**Suggestion:** Enable `"eslint/no-shadow": "warn"`. If existing violations are numerous, address them incrementally: run `pnpm run lint` with the rule enabled to get the full list, then fix in a dedicated commit. The rule supports an `allow` array for intentional shadow patterns if needed.

---

#### `deploy-preview-script-missing` — `deploy:preview` documented in `AGENTS.md` does not exist in `package.json`

**Severity:** medium
**Detail:** `AGENTS.md` documents `pnpm run deploy:preview` as the command to deploy a preview to Vercel. `package.json` only has `deploy` (implicit preview) and `deploy:prod`. Running `pnpm run deploy:preview` fails with `ERR_PNPM_NO_SCRIPT`, which is confusing for any developer or agent following the documented workflow.
**Suggestion:** Add `"deploy:preview": "vercel build && vercel --prebuilt"` to `package.json` scripts (matching the current `deploy` script), or update `AGENTS.md` to reference `pnpm run deploy` instead of `pnpm run deploy:preview`. The `package.json` scripts and `AGENTS.md` must be consistent.

---

#### `ts-expect-error-no-description` — `@ts-expect-error` without description in `rich-text-editor/provider.tsx`

**Severity:** low
**Detail:** Line 130 of `src/components/blocks/rich-text-editor/provider.tsx` contains a bare `// @ts-expect-error` with no description. The `.oxlintrc.json` sets `"ts-expect-error": "allow-with-description"`, which requires an explanation. Without one, there is no way to know what type mismatch is suppressed, whether it was intentional, or whether it can be removed after a library upgrade.
**Suggestion:** Add a description explaining the suppressed mismatch, e.g., `// @ts-expect-error - editor.onChange() exists at runtime but is absent from the Plate type definitions`. This also satisfies the configured lint rule.

---

#### `no-warning-comments-disabled` — `eslint/no-warning-comments` disabled with live TODOs in production code

**Severity:** low
**Detail:** `eslint/no-warning-comments` is set to `"off"`, so `TODO`, `FIXME`, and `HACK` comments are never flagged. At least one live TODO exists in production code: `src/components/blocks/rich-text-editor/ui/media-preview-dialog.tsx:119` (`{/* TODO: downLoad the image */}`). With the rule off, these accumulate silently and remain untracked indefinitely.
**Suggestion:** Enable `"eslint/no-warning-comments": "warn"`. Convert the existing TODO into a tracked GitHub issue and remove the inline comment. This makes technical debt visible without blocking the build.

---

#### `drizzle-config-non-null-assertion` — `drizzle.config.ts` reads `DATABASE_URL` with a non-null assertion

**Severity:** low
**Detail:** `drizzle.config.ts` accesses `process.env.DATABASE_URL!`. If `DATABASE_URL` is missing when running `pnpm db generate` or `pnpm db migrate`, the error surfaces deep inside the Neon client as a cryptic connection error rather than a clear missing-variable message. This is a common DX friction point in fresh checkouts or CI environments.
**Suggestion:** Add an explicit guard at the top of `drizzle.config.ts`:

```typescript
const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is required for drizzle-kit commands.')
```

Use `url` in `dbCredentials`. This mirrors the pattern already used in `src/db/client.ts`.

---

### Infrastructure

#### `no-security-headers` — No browser security headers set anywhere

**Severity:** high
**Detail:** Neither `vercel.json` nor `next.config.ts` `headers()` defines any of the standard browser security headers. The only `headers()` entry targets the PWA manifest for cache control. Missing headers include: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Strict-Transport-Security`. Without these, the app is vulnerable to clickjacking, MIME sniffing, and information leakage via the `Referer` header.
**Suggestion:** Add a catch-all header block in the `headers()` function in `next.config.ts` (source: `/(.*)`). At minimum add: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`. Add a Content-Security-Policy as a follow-up iteration once all directive sources are mapped.

---

#### `malformed-pwa-cache-control` — Malformed `Cache-Control` header on the PWA manifest route

**Severity:** high
**Detail:** In `next.config.ts`, `MANIFEST_CACHE_MAX_AGE` is set to the full string `'public, max-age=3600'`, then interpolated again: `` `public, max-age=${MANIFEST_CACHE_MAX_AGE}` `` produces the invalid value `public, max-age=public, max-age=3600`. Browsers and CDNs silently ignore malformed `Cache-Control` headers, meaning the manifest endpoint is never cached. This breaks PWA install prompts and causes a fresh manifest fetch on every page load.
**Suggestion:** Use the constant as the complete value directly: `value: MANIFEST_CACHE_MAX_AGE`. Alternatively, change the constant to a number (`3600`) and keep the template literal. The one-character fix (`value: MANIFEST_CACHE_MAX_AGE` instead of `` value: `public, max-age=${MANIFEST_CACHE_MAX_AGE}` ``) is sufficient.

---

#### `env-validation-skips-prod-build` — Env validation skips the production build phase

**Severity:** medium
**Detail:** In `next.config.ts`, `validateEnv()` is guarded by `phase === PHASE_DEVELOPMENT_SERVER`. During `next build` on Vercel (`PHASE_PRODUCTION_BUILD`), this condition is false, so validation is skipped entirely. A deployment with a missing or malformed env var builds successfully and only fails at runtime on the first serverless function invocation, producing a broken production release rather than a failed build.
**Suggestion:** Extend the condition: `if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) { validateEnv() }`. Import `PHASE_PRODUCTION_BUILD` from `'next/constants'`. This causes the Vercel build to fail fast when any required env var is absent or malformed.

---

#### `no-maxduration-ai-route` — Streaming AI route has no `maxDuration` export

**Severity:** medium
**Detail:** `src/app/api/v1/ai/command/route.ts` uses `streamText()` for streaming AI responses but does not export `maxDuration`. Vercel serverless functions default to 10s (Hobby) or 15s (Pro). Responses from Gemini for long generations will be truncated mid-stream without any error signal to the client, resulting in a silently broken UI.
**Suggestion:** Add `export const maxDuration = 60` (or the maximum allowed by your Vercel plan) at the top of `src/app/api/v1/ai/command/route.ts`. Add the same to the copilot route for consistency. Pair this with the authentication fix so the extended timeout is not publicly exploitable.

---

#### `robots-txt-allows-all-routes` — `robots.txt` exposes the full authenticated route structure to crawlers

**Severity:** medium
**Detail:** `public/robots.txt` has `Allow: /` with an empty `Disallow:`, instructing all crawlers to index every path. While authenticated routes redirect to `/login`, they still appear in search engine index-error reports and expose the complete route map (`/admin`, `/organization`, `/settings`, `/certificates`, `/courses`, etc.) to automated scanners.
**Suggestion:** Add `Disallow` rules for all authenticated-only routes:

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /organization
Disallow: /settings
Disallow: /certificates
Disallow: /courses
Disallow: /dashboard
Disallow: /docs
Disallow: /onboarding
```

---

#### `database-url-no-ssl` — `DATABASE_URL` validator does not enforce SSL mode

**Severity:** medium
**Detail:** The Zod schema in `src/lib/env.ts` validates `DATABASE_URL` with `z.string().startsWith('postgresql://')` but does not require `?sslmode=require` or `?sslmode=verify-full`. Neon enforces TLS at the network level for its managed service, but if the URL is pointed at a local or staging host without SSL, the validator passes silently and the connection proceeds unencrypted.
**Suggestion:** Add a `.refine()` check: `z.string().startsWith('postgresql://').refine(v => v.includes('sslmode='), { message: 'DATABASE_URL must include a sslmode query parameter' })`. Document `?sslmode=require` as mandatory in `.env.example`.

---

#### `no-health-check-endpoint` — No health check endpoint

**Severity:** low
**Detail:** No `/api/health` or equivalent route exists. Without one, Vercel deployment health checks, external uptime monitors, and load balancer probes cannot be configured. A misconfigured deployment (e.g., env validation throwing in `register()`) is detectable only by making a real authenticated request.
**Suggestion:** Add `src/app/api/v1/health/route.ts` with a `GET` handler that returns `{ status: 'ok', ts: Date.now() }` with a 200 status code. This endpoint should not require authentication. Reference it in Vercel project settings under "Health Check Path" and in any external uptime monitoring tool.

---

#### `service-worker-hardcoded-cache-name` — Service worker uses a hardcoded cache name that is never bumped on deployment

**Severity:** low
**Detail:** `public/sw.js` defines `const CACHE_NAME = 'glore-v1'`. The activate handler deletes all caches whose name does not match this constant. Because the file is in `public/` it is not processed by the Next.js build pipeline and cannot automatically reference a build hash. If static assets change between deployments but `CACHE_NAME` is not manually bumped, users with an installed service worker continue to serve stale assets until the SW update cycle completes (which can take days for open tabs).
**Suggestion:** Transition to a Workbox-based SW generated at build time (e.g., a custom `next build` post-step) that injects the Next.js `BUILD_ID` into the cache name. As an interim measure, add a comment at the top of `sw.js` explicitly noting that `CACHE_NAME` must be incremented on every deployment that changes static assets, and increment it now.

---

## Roadmap candidates

All findings with severity **critical** or **high**, sorted by severity then domain:

| Slug                                   | Domain               | Severity | Title                                                                                     |
| -------------------------------------- | -------------------- | -------- | ----------------------------------------------------------------------------------------- |
| `admin-pages-missing-role-checks`      | Features             | Critical | Admin pages missing role checks                                                           |
| `missing-fk-indexes`                   | Scalability          | Critical | Missing indexes on foreign key columns across multiple tables                             |
| `upload-endpoint-unauthenticated`      | Security             | Critical | `/api/v1/upload` has no authentication, no MIME validation, and no size limit             |
| `ai-endpoints-unauthenticated`         | Security             | Critical | AI API endpoints have no authentication and leak internal errors                          |
| `cert-eligibility-cache-stale`         | Features             | High     | Certificate eligibility cache not invalidated on course completion                        |
| `join-request-rejection-reason-hidden` | Features             | High     | Organization join request rejection reason not shown                                      |
| `no-slug-availability-check`           | Features             | High     | No real-time slug availability check in course form                                       |
| `malformed-pwa-cache-control`          | Infrastructure       | High     | Malformed `Cache-Control` header on the PWA manifest route                                |
| `no-security-headers`                  | Infrastructure       | High     | No browser security headers set anywhere                                                  |
| `heavy-client-deps`                    | Performance          | High     | Heavy client-side dependencies (Fuse.js, `@react-pdf/renderer`)                           |
| `overuse-use-client`                   | Performance          | High     | Overuse of `'use client'` in feature components                                           |
| `sequential-data-fetching`             | Performance          | High     | Sequential `await` calls in data-fetching pages                                           |
| `massive-static-data-files`            | Code Organization    | High     | Massive static data files embedded in the component tree                                  |
| `oversized-ui-components`              | Code Organization    | High     | Oversized components exceeding maintainability thresholds                                 |
| `broad-cache-invalidation`             | Scalability          | High     | Cache invalidation is tag-level rather than record-level                                  |
| `ai-client-supplied-api-key`           | Security             | High     | AI routes accept a client-supplied API key                                                |
| `admin-actions-no-auth`                | Security             | High     | Admin data-fetch server actions expose all users and organizations to non-admin callers   |
| `auth-input-privilege-escalation`      | Security             | High     | `isEditor` and `onboardedAt` marked `input: true` in Better Auth, enabling self-promotion |
| `course-mutations-no-auth`             | Security             | High     | Course-content mutation actions have no authentication or role check                      |
| `update-user-no-ownership-check`       | Security             | High     | `updateUser` server action allows any authenticated user to overwrite any user's record   |
| `no-precommit-hook`                    | Developer Experience | High     | No pre-commit hook; format check placed in the wrong Husky stage                          |
