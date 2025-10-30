# Copilot Instructions

## Repo & Tooling
- Monorepo runs on pnpm + Turbo; the production app is `apps/elearning` (Next.js App Router with `(auth)` and `(core)` route groups). Utility packages live under `packages/*` and are consumed via workspace aliases.
- Root scripts wrap Turbo pipelines: `pnpm dev` fans out `dev edge email` (Next.js server, Supabase localtunnel, email preview). `pnpm build`, `pnpm check`, and `pnpm typegen` delegate to workspace tasks—prefer composing these instead of new bespoke commands.
- App-level scripts in `apps/elearning/scripts/*.ts` invoke CLIs through `tsx` after loading env (`@next/env`). Extend these wrappers when adding new workflows so env loading and logging stay consistent.
- Biome (`apps/elearning/biome.json`) enforces no `../` imports and guards deep `@/lib/**` access; always introduce new exports via the existing barrels to avoid lint failures.

## Runtime Architecture
- Edge proxy (`apps/elearning/src/proxy.ts`) is the first gate: it verifies the encoded `user` cookie against Supabase via `getProxyDatabase`, syncs `NEXT_LOCALE`, and redirects unauthenticated traffic to `/login`.
- Authenticated shell lives in `src/app/(core)/layout.tsx`; it loads the current user, organizations, courses, and skill groups, seeds `SessionProvider`, and persists sidebar state via `serverCookies()`.
- Client session state flows through `SessionProvider` and `useSession`; any mutations must call repository helpers (`createCourse`, `updateCourse`, `deleteCourse`) to keep cookies and caches in sync.
- Shell UX relies on contexts: `AppSidebar` + `useSidebar` for navigation state, `HeaderProvider`/`useHeader` for breadcrumbs, `ProgressBarProvider` for route transitions, and `RouteListener` to reset on navigation.

## Data & Integrations
- Supabase access is centralized in `src/lib/data`: always use `createRepositoryRunner` with the appropriate client (`getDatabase`, `createDatabase`, `getProxyDatabase`, `getServiceDatabase`) to inherit cookie bridging and error handling.
- Repository helpers must return parsed domain objects via `createParser` and `serialize` (see `users/utils.ts`, `courses/utils.ts`). Throw `DatabaseError` codes from `src/lib/data/supabase/utils.ts` so API routes can map status codes predictably.
- Cookies are defined once in `src/lib/storage/cookies.ts`; server usage goes through `serverCookies = defineServerCookies(cookies, COOKIES_CONFIG)`. Never touch `next/headers` directly—use these wrappers to honor prefixes and reset rules.
- Internationalization is driven by `next-intl`; locale metadata and messages live in `apps/elearning/config/{i18n.json,translations/*.json}`. Add strings with namespaced keys (e.g., `Email.auth/password_reset`) and update `getTranslations` consumers accordingly.
- Email delivery uses `src/lib/services/mailer/sendEmail`, which dynamically imports templates, applies localized copy, and sends via the configured SMTP transport. Register new templates in `templates/` plus `types.ts`, and use `EMAIL_PREVIEW_PROPS` for local previews (`pnpm email`).

## Developer Workflows
- `pnpm --filter elearning run typegen` generates `env.d.ts`, `global.d.ts`, Supabase types, and Next route types; it needs an accessible Supabase CLI and valid `SUPABASE_URL`. The script auto-formats generated code with Biome.
- `pnpm --filter elearning run edge` starts `localtunnel` using `supabase/functions/.env`; keep `SUBDOMAIN` synced with Supabase webhooks (`supabase/functions/auth-email`).
- `pnpm --filter elearning run check` runs TypeScript (`tsconfig` vs `tsconfig.build` based on `NODE_ENV`)—use it for CI parity when adding build-time code.
- UI components extend shadcn primitives; share Tailwind tokens via `src/lib/utils.ts` (`cn`, `twMerge`, `tw`) and reuse sidebar constants from `components/ui/sidebar.tsx` for consistent sizing and shortcuts.
- API routes under `src/app/api/**` must delegate to repository functions or mailer actions, then respond with `NextResponse` mapping `DatabaseError.code` to status codes; avoid duplicating Supabase calls in route handlers.
- The `private/` folder is historical scratch space—do not import from it or rely on its contents for production code.
