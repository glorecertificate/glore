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

| Slug          | Feature                   | Agent                                       |
| ------------- | ------------------------- | ------------------------------------------- |
| `account-tab` | Enhanced account settings | agent:m9p3jw started:2026-03-19T22:24 stale |

---

## Backlog

### P0: Critical (core features incomplete)

_No P0 tasks remaining._

### P1: High (feature completeness)

_No P1 tasks remaining._

### P2: Medium (polish and UX)

_No P2 tasks remaining._

### P3: Low (improvements and DX)

| Slug            | Feature                     | Notes                                                                                            |
| --------------- | --------------------------- | ------------------------------------------------------------------------------------------------ |
| `course-search` | Course filtering and search | Low. Add URL-based filters (type, skill group, language) to `/courses` page. Use nuqs for state. |

---

## Done

| Slug                | Feature                                   | Completed  |
| ------------------- | ----------------------------------------- | ---------- |
| `oxlint-saves`      | Oxlint auto-fix on save in VS Code        | 2026-03-19 |
| `ai-gemini`         | Migrate from OpenAI to Google Gemini      | 2026-03-19 |
| `course-analytics`  | Course analytics and reporting            | 2026-03-19 |
| `notif-system`      | In-app notification system                | 2026-03-19 |
| `search-ui`         | Search functionality in UI                | 2026-03-19 |
| `cert-tutor-assign` | Manual tutor re-assignment                | 2026-03-19 |
| `render-opt`        | Rendering and interaction optimizations   | 2026-03-19 |
| `help-page`         | Help page content                         | 2026-03-19 |
| `about-page`        | About page content                        | 2026-03-19 |
| `build-speed`       | Fix slow Vercel builds                    | 2026-03-19 |
| `bundle-opt`        | Bundle size optimization                  | 2026-03-19 |
| `cert-filter`       | Certificate list filtering                | 2026-03-18 |
| `cert-qr`           | QR code on public certificate page        | 2026-03-18 |
| `cert-social`       | Public certificate social sharing         | 2026-03-18 |
| `action-cache`      | Server action cache invalidation audit    | 2026-03-26 |
| `docs-feature`      | Documentation CRUD and UI                 | 2026-03-26 |
| `org-admin-sole`    | Enforce single org admin (owner) pattern  | 2026-03-18 |
| `cert-resubmit`     | Certificate resubmission after changes    | 2026-03-19 |
| `cert-review`       | Certificate review field editing          | 2026-03-18 |
| `r2-storage`        | Migrate from Vercel Blob to Cloudflare R2 | 2026-03-15 |
| `pwa-enhance`       | PWA enhancements                          | 2026-03-27 |

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

| Date       | Decision                                                                                              | Rationale                                                                                                                                                                                                                                                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-03-19 | ai-gemini: Replaced @ai-sdk/openai with @ai-sdk/google (full replacement, not fallback)               | Free tier via Google AI Studio. Removed @ai-sdk/openai, installed @ai-sdk/google 3.0.43. Renamed OPENAI_API_KEY/OPENAI_MODEL to GEMINI_API_KEY/GEMINI_MODEL. Default model: gemini-2.0-flash. Both command and copilot routes updated.                                                                                 |
| 2026-03-19 | render-opt: Enabled React Compiler via top-level reactCompiler config + babel-plugin-react-compiler   | React Compiler is a top-level NextConfig field (not experimental) in Next.js 16. Installed babel-plugin-react-compiler 1.0.0, enabled reactCompiler: true. Auto-memoizes all components at compile time.                                                                                                               |
| 2026-03-19 | render-opt: Added Suspense boundaries to certificates/page, certificates/[id]/page, organization/page | Extracted inner async data-fetching component + outer sync page with Suspense. Page header renders immediately while data loads. Matches the pattern already used in admin pages.                                                                                                                                      |
| 2026-03-19 | render-opt: Hoisted static Suspense fallback JSX to module level in dashboard layout                  | Follows rendering-hoist-jsx rule. Prevents re-creating fallback JSX element on every render of the async layout component.                                                                                                                                                                                             |
| 2026-03-26 | docs-feature: Category manager and article editor as Sheet/Dialog with locale tabs                    | Kept category management in a single Sheet (all categories) triggered from the main /docs page only. Per-category article creation/editing uses a Dialog with en/es/it Tabs. Article reading uses a right Sheet with Markdown rendering. No dynamic [slug] route added to avoid conflicts with static category routes. |
| 2026-03-18 | cert-filter: Pure client-side filter/sort with nuqs URL state in certificates-content.tsx             | Used parseAsStringEnum for status filter and withDefault for sort. All certs fetched upfront and filtered via useMemo, matching courses list pattern. No server action changes needed.                                                                                                                                 |
| 2026-03-18 | cert-qr: Used qrcode package (server-side PNG via toDataURL) + @/components/ui/image                  | Avoids client bundle impact, dangerouslySetInnerHTML, and next/no-img-element lint errors. QR data URL is generated server-side and rendered with the project Image component.                                                                                                                                         |
| 2026-03-18 | cert-social: Added opengraph-image.tsx route segment for dynamic OG images                            | Next.js ImageResponse with teal brand card; auto-picked up without manual images key in generateMetadata. Also exempted the file pattern in .oxlintrc.json and knip.json.                                                                                                                                              |
| 2026-03-19 | Restructured roadmap with priority tiers P0-P3                                                        | Codebase audit revealed critical missing features (cert review editing, resubmission, org admin uniqueness) that must be completed before polish/optimization work.                                                                                                                                                    |
| 2026-03-19 | Added cert-review, cert-resubmit, org-admin-sole as P0                                                | These are core workflow gaps: review form lacks field editing per spec, no resubmission path exists, multiple org admins allowed but spec requires exactly one.                                                                                                                                                        |
| 2026-03-19 | Added cert-social, cert-qr, cert-filter, docs-feature as P1                                           | Public certificate page needs OG/Twitter meta tags and QR code. Certificate list needs filtering. Docs DB tables exist but no UI/actions.                                                                                                                                                                              |
| 2026-03-19 | Added about-page, help-page, cert-tutor-assign, search-ui, notif-system, course-analytics             | Stub pages need content. Tutor assignment UI needed. fuse.js installed but unused. Email-only notifications are limiting.                                                                                                                                                                                              |
| 2026-03-17 | Added action-cache to backlog (top priority)                                                          | Mutation actions calling revalidateTag cause RSC refetches and Suspense flashes. Pattern documented in tmp/server-action-rerendering.md: strip revalidateTag from mutations, add { cache: false } bypass to read actions.                                                                                              |
| 2026-03-15 | Added r2-storage, bundle-opt, build-speed, render-opt, ai-gemini, oxlint-saves to backlog             | User-requested roadmap items covering infrastructure, performance, and DX improvements.                                                                                                                                                                                                                                |
| 2026-03-15 | Completed r2-storage: replaced @vercel/blob with @aws-sdk/client-s3                                   | R2 is S3-compatible and avoids vendor lock-in. Centralized helpers in src/lib/storage.ts.                                                                                                                                                                                                                              |
