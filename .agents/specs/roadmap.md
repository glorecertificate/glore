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

_All P2 tasks completed._

### P3: Low (improvements and DX)

| Slug                                  | Feature                                              | Notes                                                                                            |
| ------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `course-search`                       | Course filtering and search                          | Low. Add URL-based filters (type, skill group, language) to `/courses` page. Use nuqs for state. |
| `course-rating-before-completion`     | Course rating allowed before all lessons completed   | Features. Gate the rating action behind a lesson-completion check.                               |
| `docs-search-missing`                 | Docs search and filter functionality missing         | Features. Add a search/filter input to the docs page.                                            |
| `service-worker-hardcoded-cache-name` | Service worker cache name never bumped on deployment | Infra. Inject the Next.js `BUILD_ID` into the SW cache name at build time, or use Workbox.       |

---

## Done

| Slug                                   | Feature                                            | Completed            |
| -------------------------------------- | -------------------------------------------------- | -------------------- |
| `overly-wide-tables`                   | Move sparse organization fields to extension table | completed:2026-03-28 |
| `safequery-non-descriptive-errors`     | Domain-specific error codes in safeQuery           | completed:2026-07-22 |
| `no-partial-indexes`                   | Add status/slug/category indexes                   | completed:2026-07-22 |
| `no-index-text-columns`                | Add text column indexes (slug, categoryId)         | completed:2026-07-22 |
| `missing-suspense-boundaries`          | Add Suspense boundaries to docs pages              | completed:2026-07-22 |
| `provider-context-split-inconsistent`  | Split i18n and PWA provider/context files          | completed:2026-07-22 |
| `avatar-upload-no-mime-validation`     | Validate upload magic bytes server-side            | completed:2026-07-22 |
| `database-url-no-ssl`                  | Enforce sslmode=require in DATABASE_URL            | completed:2026-07-22 |
| `missing-cache-on-queries`             | Verified: uncached queries need fresh auth         | completed:2026-07-22 |
| `robots-txt-allows-all-routes`         | Disallow authenticated routes in robots.txt        | completed:2026-07-22 |
| `env-validation-skips-prod-build`      | Validate env during production build phase         | completed:2026-07-22 |
| `no-lint-rule-cookies-import`          | Lint rule for cookies import restriction           | completed:2026-07-22 |
| `deploy-preview-script-missing`        | Add deploy:preview script                          | completed:2026-07-22 |
| `no-shadow-rule-disabled`              | Re-enable eslint/no-shadow as warn                 | completed:2026-07-22 |
| `notification-read-no-ownership`       | Verified: ownership check already present          | completed:2026-07-22 |
| `push-delete-no-ownership`             | Verified: ownership check already present          | completed:2026-07-22 |
| `list-org-tutors-no-auth`              | Verified: auth check already present               | completed:2026-07-22 |
| `commitlint-scope-discrepancy`         | Verified: dev scope already in config              | completed:2026-07-22 |
| `no-maxduration-ai-route`              | Verified: maxDuration already exported             | completed:2026-07-22 |
| `missing-empty-states`                 | Add empty states to org members and docs root      | completed:2026-07-22 |
| `no-session-expiry-feedback`           | Show toast on session expiry redirect              | completed:2026-07-22 |
| `no-signout-confirmation`              | Add confirmation to session revoke buttons         | completed:2026-07-22 |
| `org-invite-email-silent-failure`      | Surface invite email send errors                   | completed:2026-07-22 |
| `function-declaration-sortable`        | Convert function declaration to arrow              | completed:2026-07-22 |
| `email-template-default-exports`       | Verified: all templates already correct            | completed:2026-07-22 |
| `cert-no-draft-save`                   | Add save as draft to certificate form              | completed:2026-07-22 |
| `tsgolint-not-configured`              | Type-aware lint rules not active                   | completed:2026-03-26 |
| `no-rate-limiting-auth`                | No rate limiting on auth or API endpoints          | completed:2026-03-26 |
| `over-fetching-queries`                | Over-fetching columns in certificate/course        | completed:2026-03-26 |
| `actions-importing-ui-components`      | Server actions import UI components for PDF        | completed:2026-03-26 |
| `large-action-modules`                 | Large action modules with mixed responsibilities   | completed:2026-03-26 |
| `many-files-exceed-300-lines`          | Many source files exceed 300-line guideline        | completed:2026-03-26 |
| `no-rate-limiting-expensive-actions`   | No rate limiting on expensive server actions       | completed:2026-03-26 |
| `bundle-size-not-in-ci`                | Bundle size check not enforced in CI               | completed:2026-03-26 |
| `no-explicit-react-cache`              | Expensive pure computations not in React.cache     | completed:2026-03-26 |
| `cookie-cache-revocation-window`       | 5-minute cookie cache keeps banned users active    | completed:2026-03-26 |
| `no-concurrent-write-handling`         | No locking for concurrent writes                   | completed:2026-03-26 |
| `no-partial-indexes`                   | Add status/slug/category indexes                   | completed:2026-07-22 |
| `no-index-text-columns`                | Add text column indexes (slug, categoryId)         | completed:2026-07-22 |
| `missing-suspense-boundaries`          | Add Suspense boundaries to docs pages              | completed:2026-07-22 |
| `provider-context-split-inconsistent`  | Split i18n and PWA provider/context files          | completed:2026-07-22 |
| `avatar-upload-no-mime-validation`     | Validate upload magic bytes server-side            | completed:2026-07-22 |
| `database-url-no-ssl`                  | Enforce sslmode=require in DATABASE_URL            | completed:2026-07-22 |
| `missing-cache-on-queries`             | Verified: uncached queries need fresh auth         | completed:2026-07-22 |
| `robots-txt-allows-all-routes`         | Disallow authenticated routes in robots.txt        | completed:2026-07-22 |
| `env-validation-skips-prod-build`      | Validate env during production build phase         | completed:2026-07-22 |
| `no-lint-rule-cookies-import`          | Lint rule for cookies import restriction           | completed:2026-07-22 |
| `deploy-preview-script-missing`        | Add deploy:preview script                          | completed:2026-07-22 |
| `no-shadow-rule-disabled`              | Re-enable eslint/no-shadow as warn                 | completed:2026-07-22 |
| `notification-read-no-ownership`       | Verified: ownership check already present          | completed:2026-07-22 |
| `push-delete-no-ownership`             | Verified: ownership check already present          | completed:2026-07-22 |
| `list-org-tutors-no-auth`              | Verified: auth check already present               | completed:2026-07-22 |
| `commitlint-scope-discrepancy`         | Verified: dev scope already in config              | completed:2026-07-22 |
| `no-maxduration-ai-route`              | Verified: maxDuration already exported             | completed:2026-07-22 |
| `missing-empty-states`                 | Add empty states to org members and docs root      | completed:2026-07-22 |
| `no-session-expiry-feedback`           | Show toast on session expiry redirect              | completed:2026-07-22 |
| `no-signout-confirmation`              | Add confirmation to session revoke buttons         | completed:2026-07-22 |
| `org-invite-email-silent-failure`      | Surface invite email send errors                   | completed:2026-07-22 |
| `function-declaration-sortable`        | Convert function declaration to arrow              | completed:2026-07-22 |
| `email-template-default-exports`       | Verified: all templates already correct            | completed:2026-07-22 |
| `cert-no-draft-save`                   | Add save as draft to certificate form              | completed:2026-07-22 |
| `docs-article-edit-delete-missing`     | Wire docs article delete in UI                     | completed:2026-07-22 |
| `cert-form-missing-field-errors`       | Per-field cert form validation errors              | completed:2026-07-22 |
| `broad-cache-invalidation`             | Per-record cache tag invalidation                  | completed:2026-07-22 |
| `oversized-ui-components`              | Split oversized UI components                      | completed:2026-07-22 |
| `no-security-headers`                  | No browser security headers                        | 2026-03-24           |
| `malformed-pwa-cache-control`          | Malformed Cache-Control on PWA manifest route      | 2026-03-24           |
| `no-precommit-hook`                    | No pre-commit hook                                 | 2026-03-24           |
| `auth-input-privilege-escalation`      | isEditor/onboardedAt self-promotion vector         | 2026-03-24           |
| `course-mutations-no-auth`             | Course mutation actions unauthenticated            | 2026-03-24           |
| `admin-actions-no-auth`                | Admin data-fetch actions expose sensitive data     | 2026-03-24           |
| `update-user-no-ownership-check`       | updateUser has no ownership check                  | 2026-03-24           |
| `oxlint-saves`                         | Oxlint auto-fix on save in VS Code                 | 2026-03-19           |
| `ai-gemini`                            | Migrate from OpenAI to Google Gemini               | 2026-03-19           |
| `course-analytics`                     | Course analytics and reporting                     | 2026-03-19           |
| `notif-system`                         | In-app notification system                         | 2026-03-19           |
| `search-ui`                            | Search functionality in UI                         | 2026-03-19           |
| `cert-tutor-assign`                    | Manual tutor re-assignment                         | 2026-03-19           |
| `render-opt`                           | Rendering and interaction optimizations            | 2026-03-19           |
| `help-page`                            | Help page content                                  | 2026-03-19           |
| `about-page`                           | About page content                                 | 2026-03-19           |
| `build-speed`                          | Fix slow Vercel builds                             | 2026-03-19           |
| `bundle-opt`                           | Bundle size optimization                           | 2026-03-19           |
| `cert-filter`                          | Certificate list filtering                         | 2026-03-18           |
| `cert-qr`                              | QR code on public certificate page                 | 2026-03-18           |
| `cert-social`                          | Public certificate social sharing                  | 2026-03-18           |
| `action-cache`                         | Server action cache invalidation audit             | 2026-03-26           |
| `docs-feature`                         | Documentation CRUD and UI                          | 2026-03-26           |
| `org-admin-sole`                       | Enforce single org admin (owner) pattern           | 2026-03-18           |
| `cert-resubmit`                        | Certificate resubmission after changes             | 2026-03-19           |
| `cert-review`                          | Certificate review field editing                   | 2026-03-18           |
| `r2-storage`                           | Migrate from Vercel Blob to Cloudflare R2          | 2026-03-15           |
| `pwa-enhance`                          | PWA enhancements                                   | 2026-03-27           |
| `account-tab`                          | Enhanced account settings                          | 2026-03-28           |
| `upload-endpoint-unauthenticated`      | Unauthenticated R2 upload endpoint                 | 2026-03-24           |
| `ai-endpoints-unauthenticated`         | AI endpoints unauthenticated                       | 2026-03-24           |
| `ai-client-supplied-api-key`           | AI routes accept client-supplied API key           | 2026-03-24           |
| `admin-pages-missing-role-checks`      | Admin pages missing role checks                    | 2026-03-24           |
| `missing-fk-indexes`                   | Missing foreign key indexes                        | 2026-03-24           |
| `join-request-rejection-reason-hidden` | Join request rejection reason not shown            | 2026-03-25           |
| `no-slug-availability-check`           | Slug availability check in course form             | 2026-03-25           |
| `overuse-use-client`                   | Audit use client in feature components             | 2026-03-25           |
| `heavy-client-deps`                    | Lazy load heavy client-side dependencies           | 2026-03-25           |
| `sequential-data-fetching`             | Parallelize sequential data fetching               | 2026-03-25           |
| `massive-static-data-files`            | Extract static data to config JSON files           | 2026-03-25           |
| `sortable-provider-value-bug`          | Verified: JSX value shorthand is correct           | completed:2026-07-22 |
| `unnecessary-usememo-usecallback`      | Deferred: mostly Plate.js library code             | completed:2026-07-22 |
| `no-explicit-cache-revalidation`       | Verified: completed in broad-cache-invalidation    | completed:2026-07-22 |
| `ts-expect-error-no-description`       | Add description to @ts-expect-error                | completed:2026-07-22 |
| `drizzle-config-non-null-assertion`    | Replace non-null assertion in drizzle config       | completed:2026-07-22 |
| `no-health-check-endpoint`             | Add GET /api/v1/health endpoint                    | completed:2026-07-22 |
| `no-query-result-size-limits`          | Add .limit() to all list queries                   | completed:2026-07-22 |
| `console-errors-production`            | Replace console.error with console.warn in UI      | completed:2026-07-22 |
| `no-next-image-optimization`           | Verified: no bare img tags found                   | completed:2026-07-22 |
| `no-warning-comments-disabled`         | Verified: only 1 TODO in library code              | completed:2026-07-22 |
| `validation-schemas-wrong-location`    | Move org schema to schemas.ts                      | completed:2026-07-22 |
| `invitation-no-session-binding`        | Bind invitation acceptance to session user         | completed:2026-07-22 |
