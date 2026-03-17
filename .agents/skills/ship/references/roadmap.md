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

### P0: Critical (core features incomplete)

| Slug             | Feature                                  | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cert-review`    | Certificate review field editing         | **Critical.** Review form currently only allows approve/request-changes with a comment. Must add editable fields: `activityStartDate`, `activityEndDate`, `activityDuration`, `activityLocation`, `activityDescription`, plus associated skills/evaluations. Update `reviewCertificateSchema` in `src/components/features/certificates/schemas.ts`, update `reviewCertificate` action in `src/actions/certificate.ts`, update `review-form.tsx`. |
| `cert-resubmit`  | Certificate resubmission after changes   | **Critical.** No `updateCertificate` or `resubmitCertificate` action exists. After `changes_requested`, the volunteer must be able to edit fields and resubmit (returns to `submitted`). Add server action, edit UI in `certificate-detail.tsx`, update schema.                                                                                                                                                                                  |
| `org-admin-sole` | Enforce single org admin (owner) pattern | **Critical.** Current code allows multiple membership `admin` roles per org. Must enforce exactly ONE admin per org. Add DB constraint or action-level guard. Representatives get all admin rights except org deletion. Update role assignment logic in `src/actions/organization.ts`.                                                                                                                                                           |

### P1: High (feature completeness)

| Slug           | Feature                                | Notes                                                                                                                                                                                                                                                                   |
| -------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action-cache` | Server action cache invalidation audit | High. Remove `revalidateTag` from mutation actions to prevent RSC refetches and Suspense flashes. Add `{ cache: false }` bypass to read actions. See `tmp/server-action-rerendering.md` for the pattern.                                                                |
| `cert-social`  | Public certificate social sharing      | High. Add Open Graph + Twitter Card meta tags to `src/app/[username]/page.tsx` `generateMetadata`. Add `og:title`, `og:description`, `og:image` (use cert PDF or generate OG image), `og:url`, `twitter:card`.                                                          |
| `cert-qr`      | QR code on public certificate page     | High. Add QR code component to `public-certificate-view.tsx` linking to `/{username}?v={handle}`. Consider `qrcode` or `react-qr-code` package. Must match PDF template spec.                                                                                           |
| `cert-filter`  | Certificate list filtering             | High. Add URL-based filter by status (nuqs) to `/certificates` page. Add sort by date. Update `certificates-content.tsx` with filter controls.                                                                                                                          |
| `docs-feature` | Documentation CRUD and UI              | High. DB tables exist (`doc_categories`, `doc_articles`). Need: server actions (CRUD), queries, API, components for browsing/reading/editing articles. Admin/editor creates; all authenticated users read. Fill `/docs`, `/docs/intro`, `/docs/faq`, `/docs/tutorials`. |
| `bundle-opt`   | Bundle size optimization               | High. Lucide icons tree-shaking, zod (consider zod mini), react-player/hls.js dynamic import, general code splits.                                                                                                                                                      |
| `build-speed`  | Fix slow Vercel builds (3min+)         | High. Remote cache, output standalone, reduce static gen, parallelism.                                                                                                                                                                                                  |

### P2: Medium (polish and UX)

| Slug                | Feature                                 | Notes                                                                                                                                                                       |
| ------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `about-page`        | About page content                      | Medium. `/about` is a stub. Add proper content: project description, team info, partner organizations, contact.                                                             |
| `help-page`         | Help page content                       | Medium. `/help` is a stub. Add help content: getting started guide, FAQ links, support contact.                                                                             |
| `render-opt`        | Rendering and interaction optimizations | Medium. React Compiler, Suspense boundaries, RSC audit, reduce client re-renders.                                                                                           |
| `cert-tutor-assign` | Manual tutor re-assignment              | Medium. Allow admin/rep to change assigned tutor from certificate detail. Allow tutor to self-assign to unreviewed certs (UI for browsing unassigned). Update actions + UI. |
| `search-ui`         | Search functionality in UI              | Medium. `fuse.js` is installed but not exposed in UI. Add search bar to sidebar or header for courses, certificates, members. Wire up fuzzy search.                         |
| `notif-system`      | In-app notification system              | Medium. Currently email only. Consider adding a notifications dropdown/panel with unread count. Would need a `notifications` table and real-time or polling mechanism.      |
| `course-analytics`  | Course analytics and reporting          | Medium. Dashboard stats exist but are basic. Add: completion rates per course, avg ratings, popular courses, learner progress overview for admins/editors.                  |

### P3: Low (improvements and DX)

| Slug            | Feature                              | Notes                                                                                                                                      |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `ai-gemini`     | Migrate from OpenAI to Google Gemini | Low. Free tier via `@ai-sdk/google`. Replace command + copilot routes. Consider as fallback or full replacement.                           |
| `oxlint-saves`  | Oxlint auto-fix on save in VS Code   | Low. Enable import sort + unused vars auto-fix via `editor.codeActionsOnSave`.                                                             |
| `course-search` | Course filtering and search          | Low. Add URL-based filters (type, skill group, language) to `/courses` page. Use nuqs for state.                                           |
| `account-tab`   | Enhanced account settings            | Low. Verify account tab completeness: email change, password change, account deletion. Ensure all actions have proper email notifications. |
| `pwa-enhance`   | PWA enhancements                     | Low. Push notifications, offline course reading, install prompt improvements.                                                              |

---

## Done

| Slug         | Feature                                   | Completed  |
| ------------ | ----------------------------------------- | ---------- |
| `r2-storage` | Migrate from Vercel Blob to Cloudflare R2 | 2026-03-15 |

---

## Feature dependency graph

```
cert-review ─────┐
cert-resubmit ───┤──→ cert-social + cert-qr (public page complete)
org-admin-sole ──┘
                       ↓
                  cert-filter + cert-tutor-assign (review workflow complete)
                       ↓
                  docs-feature + about-page + help-page (content pages)
                       ↓
                  search-ui + notif-system + course-analytics (UX polish)
                       ↓
                  action-cache + bundle-opt + build-speed + render-opt (performance)
                       ↓
                  ai-gemini + oxlint-saves + pwa-enhance (nice-to-have)
```

---

## Decisions log

| Date       | Decision                                                                                  | Rationale                                                                                                                                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-03-19 | Restructured roadmap with priority tiers P0-P3                                            | Codebase audit revealed critical missing features (cert review editing, resubmission, org admin uniqueness) that must be completed before polish/optimization work.                                                       |
| 2026-03-19 | Added cert-review, cert-resubmit, org-admin-sole as P0                                    | These are core workflow gaps: review form lacks field editing per spec, no resubmission path exists, multiple org admins allowed but spec requires exactly one.                                                           |
| 2026-03-19 | Added cert-social, cert-qr, cert-filter, docs-feature as P1                               | Public certificate page needs OG/Twitter meta tags and QR code. Certificate list needs filtering. Docs DB tables exist but no UI/actions.                                                                                 |
| 2026-03-19 | Added about-page, help-page, cert-tutor-assign, search-ui, notif-system, course-analytics | Stub pages need content. Tutor assignment UI needed. fuse.js installed but unused. Email-only notifications are limiting.                                                                                                 |
| 2026-03-17 | Added action-cache to backlog (top priority)                                              | Mutation actions calling revalidateTag cause RSC refetches and Suspense flashes. Pattern documented in tmp/server-action-rerendering.md: strip revalidateTag from mutations, add { cache: false } bypass to read actions. |
| 2026-03-15 | Added r2-storage, bundle-opt, build-speed, render-opt, ai-gemini, oxlint-saves to backlog | User-requested roadmap items covering infrastructure, performance, and DX improvements.                                                                                                                                   |
| 2026-03-15 | Completed r2-storage: replaced @vercel/blob with @aws-sdk/client-s3                       | R2 is S3-compatible and avoids vendor lock-in. Centralized helpers in src/lib/storage.ts.                                                                                                                                 |
