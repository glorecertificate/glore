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

| Slug                              | Feature                                                  | Notes                                                                                                  |
| --------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `over-fetching-queries`           | Over-fetching columns in certificate and course queries  | Performance. Narrow `with` clauses to only the fields each call site actually uses.                    |
| `actions-importing-ui-components` | Server actions import UI components for PDF rendering    | Code Org. Move PDF logic to a dedicated server-only utility module.                                    |
| `large-action-modules`            | Large action modules with mixed responsibilities         | Code Org. Split oversized action files by concern.                                                     |
| `many-files-exceed-300-lines`     | Many source files exceed 300-line guideline              | Code Org. Audit all files over 300 lines and split by concern.                                         |
| `overly-wide-tables`              | Overly wide table definitions with many nullable columns | Scalability. Move rarely-used nullable fields to related extension tables.                             |
| `no-query-result-size-limits`     | Queries do not enforce maximum result sizes              | Scalability. Add `.limit()` to all list queries; implement cursor-based pagination for large datasets. |
| `no-rate-limiting-auth`           | No rate limiting on auth or API endpoints                | Security. Add rate limiting to sign-in, password reset, and AI endpoints.                              |
| `tsgolint-not-configured`         | Type-aware lint rules not active                         | DX. Configure `oxlint-tsgolint` with `no-floating-promises` and `no-misused-promises`.                 |

### P3: Low (improvements and DX)

| Slug                                  | Feature                                                     | Notes                                                                                                  |
| ------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `course-search`                       | Course filtering and search                                 | Low. Add URL-based filters (type, skill group, language) to `/courses` page. Use nuqs for state.       |
| `console-errors-production`           | Console errors logged in production                         | Features. Replace `console.error` in user-facing flows with structured server-side logging.            |
| `course-rating-before-completion`     | Course rating allowed before all lessons completed          | Features. Gate the rating action behind a lesson-completion check.                                     |
| `docs-search-missing`                 | Docs search and filter functionality missing                | Features. Add a search/filter input to the docs page.                                                  |
| `no-next-image-optimization`          | Images not using next/image or lazy loading                 | Performance. Replace bare `<img>` tags with `@/components/ui/image` or `next/image`.                   |
| `bundle-size-not-in-ci`               | Bundle size check not enforced in CI                        | Performance. Add `pnpm run check:size` to the Vercel build command or a GitHub Actions workflow.       |
| `no-explicit-cache-revalidation`      | Mutations missing revalidateTag after DB writes             | Performance. Audit all mutation actions for missing `revalidateTag` calls.                             |
| `no-explicit-react-cache`             | Expensive pure computations not wrapped in React.cache      | Performance. Wrap request-scoped expensive pure functions in `cache()` from React.                     |
| `validation-schemas-wrong-location`   | Validation schemas in components/ instead of feature folder | Code Org. Move feature-scoped Zod schemas into `features/<domain>/schemas.ts`.                         |
| `no-rate-limiting-expensive-actions`  | No rate limiting on expensive server actions                | Scalability. Add rate limiting to PDF generation and AI command actions.                               |
| `no-concurrent-write-handling`        | No locking for concurrent writes                            | Scalability. Add optimistic concurrency checks (e.g., `updatedAt` comparison) to critical write paths. |
| `invitation-no-session-binding`       | Invitation acceptance not bound to accepting user           | Security. Validate that the user accepting the invitation matches the token recipient.                 |
| `cookie-cache-revocation-window`      | 5-minute cookie cache keeps banned users active             | Security. Reduce cookie cache TTL or add a revocation check for banned/suspended users.                |
| `no-health-check-endpoint`            | No health check endpoint                                    | Infra. Add `GET /api/v1/health` returning `{ status: 'ok' }`, unauthenticated.                         |
| `service-worker-hardcoded-cache-name` | Service worker cache name never bumped on deployment        | Infra. Inject the Next.js `BUILD_ID` into the SW cache name at build time, or use Workbox.             |

---

## Done

| Slug                                   | Feature                                         | Completed            |
| -------------------------------------- | ----------------------------------------------- | -------------------- |
| `safequery-non-descriptive-errors`     | Domain-specific error codes in safeQuery        | completed:2026-07-22 |
| `no-partial-indexes`                   | Add status/slug/category indexes                | completed:2026-07-22 |
| `no-index-text-columns`                | Add text column indexes (slug, categoryId)      | completed:2026-07-22 |
| `missing-suspense-boundaries`          | Add Suspense boundaries to docs pages           | completed:2026-07-22 |
| `provider-context-split-inconsistent`  | Split i18n and PWA provider/context files       | completed:2026-07-22 |
| `avatar-upload-no-mime-validation`     | Validate upload magic bytes server-side         | completed:2026-07-22 |
| `database-url-no-ssl`                  | Enforce sslmode=require in DATABASE_URL         | completed:2026-07-22 |
| `missing-cache-on-queries`             | Verified: uncached queries need fresh auth      | completed:2026-07-22 |
| `robots-txt-allows-all-routes`         | Disallow authenticated routes in robots.txt     | completed:2026-07-22 |
| `env-validation-skips-prod-build`      | Validate env during production build phase      | completed:2026-07-22 |
| `no-lint-rule-cookies-import`          | Lint rule for cookies import restriction        | completed:2026-07-22 |
| `deploy-preview-script-missing`        | Add deploy:preview script                       | completed:2026-07-22 |
| `no-shadow-rule-disabled`              | Re-enable eslint/no-shadow as warn              | completed:2026-07-22 |
| `notification-read-no-ownership`       | Verified: ownership check already present       | completed:2026-07-22 |
| `push-delete-no-ownership`             | Verified: ownership check already present       | completed:2026-07-22 |
| `list-org-tutors-no-auth`              | Verified: auth check already present            | completed:2026-07-22 |
| `commitlint-scope-discrepancy`         | Verified: dev scope already in config           | completed:2026-07-22 |
| `no-maxduration-ai-route`              | Verified: maxDuration already exported          | completed:2026-07-22 |
| `missing-empty-states`                 | Add empty states to org members and docs root   | completed:2026-07-22 |
| `no-session-expiry-feedback`           | Show toast on session expiry redirect           | completed:2026-07-22 |
| `no-signout-confirmation`              | Add confirmation to session revoke buttons      | completed:2026-07-22 |
| `org-invite-email-silent-failure`      | Surface invite email send errors                | completed:2026-07-22 |
| `function-declaration-sortable`        | Convert function declaration to arrow           | completed:2026-07-22 |
| `email-template-default-exports`       | Verified: all templates already correct         | completed:2026-07-22 |
| `cert-no-draft-save`                   | Add save as draft to certificate form           | completed:2026-07-22 |
| `docs-article-edit-delete-missing`     | Wire docs article delete in UI                  | completed:2026-07-22 |
| `cert-form-missing-field-errors`       | Per-field cert form validation errors           | completed:2026-07-22 |
| `broad-cache-invalidation`             | Per-record cache tag invalidation               | completed:2026-07-22 |
| `oversized-ui-components`              | Split oversized UI components                   | completed:2026-07-22 |
| `no-security-headers`                  | No browser security headers                     | 2026-03-24           |
| `malformed-pwa-cache-control`          | Malformed Cache-Control on PWA manifest route   | 2026-03-24           |
| `no-precommit-hook`                    | No pre-commit hook                              | 2026-03-24           |
| `auth-input-privilege-escalation`      | isEditor/onboardedAt self-promotion vector      | 2026-03-24           |
| `course-mutations-no-auth`             | Course mutation actions unauthenticated         | 2026-03-24           |
| `admin-actions-no-auth`                | Admin data-fetch actions expose sensitive data  | 2026-03-24           |
| `update-user-no-ownership-check`       | updateUser has no ownership check               | 2026-03-24           |
| `oxlint-saves`                         | Oxlint auto-fix on save in VS Code              | 2026-03-19           |
| `ai-gemini`                            | Migrate from OpenAI to Google Gemini            | 2026-03-19           |
| `course-analytics`                     | Course analytics and reporting                  | 2026-03-19           |
| `notif-system`                         | In-app notification system                      | 2026-03-19           |
| `search-ui`                            | Search functionality in UI                      | 2026-03-19           |
| `cert-tutor-assign`                    | Manual tutor re-assignment                      | 2026-03-19           |
| `render-opt`                           | Rendering and interaction optimizations         | 2026-03-19           |
| `help-page`                            | Help page content                               | 2026-03-19           |
| `about-page`                           | About page content                              | 2026-03-19           |
| `build-speed`                          | Fix slow Vercel builds                          | 2026-03-19           |
| `bundle-opt`                           | Bundle size optimization                        | 2026-03-19           |
| `cert-filter`                          | Certificate list filtering                      | 2026-03-18           |
| `cert-qr`                              | QR code on public certificate page              | 2026-03-18           |
| `cert-social`                          | Public certificate social sharing               | 2026-03-18           |
| `action-cache`                         | Server action cache invalidation audit          | 2026-03-26           |
| `docs-feature`                         | Documentation CRUD and UI                       | 2026-03-26           |
| `org-admin-sole`                       | Enforce single org admin (owner) pattern        | 2026-03-18           |
| `cert-resubmit`                        | Certificate resubmission after changes          | 2026-03-19           |
| `cert-review`                          | Certificate review field editing                | 2026-03-18           |
| `r2-storage`                           | Migrate from Vercel Blob to Cloudflare R2       | 2026-03-15           |
| `pwa-enhance`                          | PWA enhancements                                | 2026-03-27           |
| `account-tab`                          | Enhanced account settings                       | 2026-03-28           |
| `upload-endpoint-unauthenticated`      | Unauthenticated R2 upload endpoint              | 2026-03-24           |
| `ai-endpoints-unauthenticated`         | AI endpoints unauthenticated                    | 2026-03-24           |
| `ai-client-supplied-api-key`           | AI routes accept client-supplied API key        | 2026-03-24           |
| `admin-pages-missing-role-checks`      | Admin pages missing role checks                 | 2026-03-24           |
| `missing-fk-indexes`                   | Missing foreign key indexes                     | 2026-03-24           |
| `join-request-rejection-reason-hidden` | Join request rejection reason not shown         | 2026-03-25           |
| `no-slug-availability-check`           | Slug availability check in course form          | 2026-03-25           |
| `overuse-use-client`                   | Audit use client in feature components          | 2026-03-25           |
| `heavy-client-deps`                    | Lazy load heavy client-side dependencies        | 2026-03-25           |
| `sequential-data-fetching`             | Parallelize sequential data fetching            | 2026-03-25           |
| `massive-static-data-files`            | Extract static data to config JSON files        | 2026-03-25           |
| `sortable-provider-value-bug`          | Verified: JSX value shorthand is correct        | completed:2026-07-22 |
| `unnecessary-usememo-usecallback`      | Deferred: mostly Plate.js library code          | completed:2026-07-22 |
| `no-explicit-cache-revalidation`       | Verified: completed in broad-cache-invalidation | completed:2026-07-22 |
| `ts-expect-error-no-description`       | Add description to @ts-expect-error             | completed:2026-07-22 |
| `drizzle-config-non-null-assertion`    | Replace non-null assertion in drizzle config    | completed:2026-07-22 |
| `no-health-check-endpoint`             | Add GET /api/v1/health endpoint                 | completed:2026-07-22 |
