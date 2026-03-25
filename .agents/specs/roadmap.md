# Roadmap

> **Agent instructions:** Read this file at the start of every session. Update it immediately after completing a milestone or making a structural decision. This is the source of truth for feature status and priorities.

---

## Status key

| Symbol | Meaning           |
| ------ | ----------------- |
| `[ ]`  | Not started       |
| `[~]`  | In progress       |
| `[x]`  | Done              |
| `[!]`  | Blocked / on hold |

---

## Active

_No active tasks._

---

## Backlog

### P1: High (important)

_All P1 tasks completed._

### P2: Medium (polish)

| Slug                                  | Feature                                                   | Notes                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `missing-empty-states`                | Multiple screens missing empty states                     | Features. Add empty state UI to courses, certificates, members, and docs lists.                                        |
| `no-session-expiry-feedback`          | No user feedback on session expiry                        | Features. Show a toast or modal when session expires mid-session, redirecting to login.                                |
| `no-signout-confirmation`             | No confirmation before signing out a session              | Features. Add a confirmation dialog before ending an active session from the sessions list.                            |
| `cert-no-draft-save`                  | Certificate cannot be saved as draft                      | Features. Add a "Save draft" path that persists without triggering a status change.                                    |
| `org-invite-email-silent-failure`     | Organization invitation email failures are silent         | Features. Surface email send errors to the inviting admin via toast; log failures server-side.                         |
| `missing-cache-on-queries`            | Some read queries missing use cache                       | Performance. Add `'use cache'` to frequently-called read actions not yet cached.                                       |
| `over-fetching-queries`               | Over-fetching columns in certificate and course queries   | Performance. Narrow `with` clauses to only the fields each call site actually uses.                                    |
| `missing-suspense-boundaries`         | Suspense boundaries missing on some dashboard pages       | Performance. Apply the outer-sync + inner-async Suspense pattern to all data-heavy dashboard pages.                    |
| `function-declaration-sortable`       | Function declaration in sortable.tsx violates conventions | Code Org. Convert `function` declaration to arrow function.                                                            |
| `email-template-default-exports`      | Email templates use identifier-assigned default exports   | Code Org. Change to direct `export default () =>` per project conventions.                                             |
| `provider-context-split-inconsistent` | Provider/context split not consistently applied           | Code Org. Split mixed provider files into `*-context.tsx` + `*-provider.tsx`.                                          |
| `actions-importing-ui-components`     | Server actions import UI components for PDF rendering     | Code Org. Move PDF logic to a dedicated server-only utility module.                                                    |
| `large-action-modules`                | Large action modules with mixed responsibilities          | Code Org. Split oversized action files by concern.                                                                     |
| `many-files-exceed-300-lines`         | Many source files exceed 300-line guideline               | Code Org. Audit all files over 300 lines and split by concern.                                                         |
| `overly-wide-tables`                  | Overly wide table definitions with many nullable columns  | Scalability. Move rarely-used nullable fields to related extension tables.                                             |
| `no-partial-indexes`                  | No partial indexes for status/boolean filtered queries    | Scalability. Add `WHERE status = 'pending'` and similar partial indexes for common filtered queries.                   |
| `no-query-result-size-limits`         | Queries do not enforce maximum result sizes               | Scalability. Add `.limit()` to all list queries; implement cursor-based pagination for large datasets.                 |
| `no-index-text-columns`               | Frequently queried text columns lack explicit indexes     | Scalability. Add indexes on `username`, `slug`, `email`, and other frequently-filtered text columns.                   |
| `notification-read-no-ownership`      | markNotificationRead missing ownership check              | Security. Add `eq(notifications.userId, session.user.id)` predicate to the update query.                               |
| `push-delete-no-ownership`            | DELETE /api/v1/push missing ownership check               | Security. Verify the subscription belongs to the authenticated user before deleting.                                   |
| `no-rate-limiting-auth`               | No rate limiting on auth or API endpoints                 | Security. Add rate limiting to sign-in, password reset, and AI endpoints.                                              |
| `avatar-upload-no-mime-validation`    | Avatar upload trusts client-provided MIME type            | Security. Validate file magic bytes server-side.                                                                       |
| `list-org-tutors-no-auth`             | listOrgTutors exposes data without auth check             | Security. Add session auth check to the `listOrgTutors` server action.                                                 |
| `tsgolint-not-configured`             | Type-aware lint rules not active                          | DX. Configure `oxlint-tsgolint` with `no-floating-promises` and `no-misused-promises`.                                 |
| `commitlint-scope-discrepancy`        | dev scope missing from commitlint config                  | DX. Add `dev` to `scope-enum` in `commitlint.config.ts`.                                                               |
| `no-lint-rule-cookies-import`         | No lint rule enforcing cookies import restriction         | DX. Add a `no-restricted-imports` rule for `cookies` from `next/headers` pointing to `@/actions/cookies`.              |
| `safequery-non-descriptive-errors`    | safeQuery returns non-descriptive error codes             | DX. Extend `queryError` to produce domain-specific codes (`NOT_FOUND`, `CONFLICT`, etc.).                              |
| `no-shadow-rule-disabled`             | eslint/no-shadow disabled                                 | DX. Re-enable `eslint/no-shadow` in `.oxlintrc.json`.                                                                  |
| `deploy-preview-script-missing`       | deploy:preview script missing from package.json           | DX. Add the `deploy:preview` script documented in AGENTS.md.                                                           |
| `env-validation-skips-prod-build`     | Env validation skips production build phase               | Infra. Run `validateEnv()` during `PHASE_PRODUCTION_BUILD` to catch missing vars before a broken deployment goes live. |
| `no-maxduration-ai-route`             | Streaming AI route has no maxDuration export              | Infra. Add `export const maxDuration = 60` to the AI streaming route.                                                  |
| `robots-txt-allows-all-routes`        | robots.txt exposes full authenticated route structure     | Infra. Disallow `/admin`, `/dashboard`, `/settings`, `/certificates`, and other authenticated paths.                   |
| `database-url-no-ssl`                 | DATABASE_URL validator does not enforce SSL mode          | Infra. Add `.refine()` requiring `sslmode=` in the connection string.                                                  |

### P3: Low (improvements and DX)

| Slug                                  | Feature                                                      | Notes                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `course-search`                       | Course filtering and search                                  | Low. Add URL-based filters (type, skill group, language) to `/courses` page. Use nuqs for state.       |
| `console-errors-production`           | Console errors logged in production                          | Features. Replace `console.error` in user-facing flows with structured server-side logging.            |
| `course-rating-before-completion`     | Course rating allowed before all lessons completed           | Features. Gate the rating action behind a lesson-completion check.                                     |
| `docs-search-missing`                 | Docs search and filter functionality missing                 | Features. Add a search/filter input to the docs page.                                                  |
| `no-next-image-optimization`          | Images not using next/image or lazy loading                  | Performance. Replace bare `<img>` tags with `@/components/ui/image` or `next/image`.                   |
| `bundle-size-not-in-ci`               | Bundle size check not enforced in CI                         | Performance. Add `pnpm run check:size` to the Vercel build command or a GitHub Actions workflow.       |
| `unnecessary-usememo-usecallback`     | Unnecessary useMemo/useCallback with React Compiler          | Performance. Remove manual memoization — React Compiler handles this automatically.                    |
| `no-explicit-cache-revalidation`      | Mutations missing revalidateTag after DB writes              | Performance. Audit all mutation actions for missing `revalidateTag` calls.                             |
| `no-explicit-react-cache`             | Expensive pure computations not wrapped in React.cache       | Performance. Wrap request-scoped expensive pure functions in `cache()` from React.                     |
| `sortable-provider-value-bug`         | SortableContentContext.Provider rendered without value       | Code Org. Pass the required `value` prop to `SortableContentContext.Provider` in `sortable.tsx`.       |
| `validation-schemas-wrong-location`   | Validation schemas in components/ instead of feature folder  | Code Org. Move feature-scoped Zod schemas into `features/<domain>/schemas.ts`.                         |
| `no-rate-limiting-expensive-actions`  | No rate limiting on expensive server actions                 | Scalability. Add rate limiting to PDF generation and AI command actions.                               |
| `no-concurrent-write-handling`        | No locking for concurrent writes                             | Scalability. Add optimistic concurrency checks (e.g., `updatedAt` comparison) to critical write paths. |
| `invitation-no-session-binding`       | Invitation acceptance not bound to accepting user            | Security. Validate that the user accepting the invitation matches the token recipient.                 |
| `cookie-cache-revocation-window`      | 5-minute cookie cache keeps banned users active              | Security. Reduce cookie cache TTL or add a revocation check for banned/suspended users.                |
| `ts-expect-error-no-description`      | @ts-expect-error without description                         | DX. Add an explanatory comment to the `@ts-expect-error` in `rich-text-editor/provider.tsx`.           |
| `no-warning-comments-disabled`        | eslint/no-warning-comments disabled with live TODOs          | DX. Re-enable the rule or resolve the outstanding TODOs.                                               |
| `drizzle-config-non-null-assertion`   | drizzle.config.ts reads DATABASE_URL with non-null assertion | DX. Replace `process.env.DATABASE_URL!` with a validated read that gives a clear error.                |
| `no-health-check-endpoint`            | No health check endpoint                                     | Infra. Add `GET /api/v1/health` returning `{ status: 'ok' }`, unauthenticated.                         |
| `service-worker-hardcoded-cache-name` | Service worker cache name never bumped on deployment         | Infra. Inject the Next.js `BUILD_ID` into the SW cache name at build time, or use Workbox.             |

---

## Done

| Slug                                   | Feature                                        | Completed            |
| -------------------------------------- | ---------------------------------------------- | -------------------- |
| `docs-article-edit-delete-missing`     | Wire docs article delete in UI                 | completed:2026-07-22 |
| `cert-form-missing-field-errors`       | Per-field cert form validation errors          | completed:2026-07-22 |
| `broad-cache-invalidation`             | Per-record cache tag invalidation              | completed:2026-07-22 |
| `oversized-ui-components`              | Split oversized UI components                  | completed:2026-07-22 |
| `no-security-headers`                  | No browser security headers                    | 2026-03-24           |
| `malformed-pwa-cache-control`          | Malformed Cache-Control on PWA manifest route  | 2026-03-24           |
| `no-precommit-hook`                    | No pre-commit hook                             | 2026-03-24           |
| `auth-input-privilege-escalation`      | isEditor/onboardedAt self-promotion vector     | 2026-03-24           |
| `course-mutations-no-auth`             | Course mutation actions unauthenticated        | 2026-03-24           |
| `admin-actions-no-auth`                | Admin data-fetch actions expose sensitive data | 2026-03-24           |
| `update-user-no-ownership-check`       | updateUser has no ownership check              | 2026-03-24           |
| `oxlint-saves`                         | Oxlint auto-fix on save in VS Code             | 2026-03-19           |
| `ai-gemini`                            | Migrate from OpenAI to Google Gemini           | 2026-03-19           |
| `course-analytics`                     | Course analytics and reporting                 | 2026-03-19           |
| `notif-system`                         | In-app notification system                     | 2026-03-19           |
| `search-ui`                            | Search functionality in UI                     | 2026-03-19           |
| `cert-tutor-assign`                    | Manual tutor re-assignment                     | 2026-03-19           |
| `render-opt`                           | Rendering and interaction optimizations        | 2026-03-19           |
| `help-page`                            | Help page content                              | 2026-03-19           |
| `about-page`                           | About page content                             | 2026-03-19           |
| `build-speed`                          | Fix slow Vercel builds                         | 2026-03-19           |
| `bundle-opt`                           | Bundle size optimization                       | 2026-03-19           |
| `cert-filter`                          | Certificate list filtering                     | 2026-03-18           |
| `cert-qr`                              | QR code on public certificate page             | 2026-03-18           |
| `cert-social`                          | Public certificate social sharing              | 2026-03-18           |
| `action-cache`                         | Server action cache invalidation audit         | 2026-03-26           |
| `docs-feature`                         | Documentation CRUD and UI                      | 2026-03-26           |
| `org-admin-sole`                       | Enforce single org admin (owner) pattern       | 2026-03-18           |
| `cert-resubmit`                        | Certificate resubmission after changes         | 2026-03-19           |
| `cert-review`                          | Certificate review field editing               | 2026-03-18           |
| `r2-storage`                           | Migrate from Vercel Blob to Cloudflare R2      | 2026-03-15           |
| `pwa-enhance`                          | PWA enhancements                               | 2026-03-27           |
| `account-tab`                          | Enhanced account settings                      | 2026-03-28           |
| `upload-endpoint-unauthenticated`      | Unauthenticated R2 upload endpoint             | 2026-03-24           |
| `ai-endpoints-unauthenticated`         | AI endpoints unauthenticated                   | 2026-03-24           |
| `ai-client-supplied-api-key`           | AI routes accept client-supplied API key       | 2026-03-24           |
| `admin-pages-missing-role-checks`      | Admin pages missing role checks                | 2026-03-24           |
| `missing-fk-indexes`                   | Missing foreign key indexes                    | 2026-03-24           |
| `join-request-rejection-reason-hidden` | Join request rejection reason not shown        | 2026-03-25           |
| `no-slug-availability-check`           | Slug availability check in course form         | 2026-03-25           |
| `overuse-use-client`                   | Audit use client in feature components         | 2026-03-25           |
| `heavy-client-deps`                    | Lazy load heavy client-side dependencies       | 2026-03-25           |
| `sequential-data-fetching`             | Parallelize sequential data fetching           | 2026-03-25           |
| `massive-static-data-files`            | Extract static data to config JSON files       | 2026-03-25           |
