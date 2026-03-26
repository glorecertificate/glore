# `AGENTS.md`

GloRe Certificate — multilingual e-learning platform for soft skills certification, built with Next.js 16, React 19, Neon (Postgres), Drizzle ORM, and Tailwind CSS 4.

> **Source of truth**: This file is the single source of truth for all AI agent instructions in this project. `CLAUDE.md` redirects here via `@AGENTS.md` — **never edit `CLAUDE.md` directly**. All updates must be made to this file only.

> **Auto-update rule**: When making changes that affect the information documented here (new routes, components, packages, actions, types, patterns, or conventions), update this file as part of the same change. AGENTS.md must always reflect the current state of the codebase.

> **MANDATORY:** Every agent working on this codebase MUST follow ALL rules in this file without exception. Agents MUST auto-update this file whenever they make structural or architectural changes (see [Auto Updates](#auto-updates)).

---

<!-- BEGIN:nextjs-agent-rules -->

## Next.js Docs

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

---

## Commands

| Command                   | Description                                                     |
| ------------------------- | --------------------------------------------------------------- |
| `pnpm install`            | Install dependencies                                            |
| `pnpm run dev`            | Start Next.js dev server on port 3030                           |
| `pnpm run build`          | Production build                                                |
| `pnpm run start`          | Start production server on port 3030                            |
| `pnpm run email`          | Preview email templates on port 3031                            |
| `pnpm run lint`           | Lint with oxlint                                                |
| `pnpm run lint:fix`       | Auto-fix lint issues                                            |
| `pnpm run format`         | Format with oxfmt                                               |
| `pnpm run format:check`   | Check formatting without writing                                |
| `pnpm run check`          | Type check + lint + format check + unused exports (in sequence) |
| `pnpm run check:ci`       | Same as `check` but runs all tools in parallel                  |
| `pnpm run check:size`     | Bundle size check                                               |
| `pnpm run typecheck`      | Type-check only (`tsc --noEmit`)                                |
| `pnpm run typegen`        | Generate route + public-file types → `env.d.ts`                 |
| `pnpm run analyze`        | Next.js bundle analyzer                                         |
| `pnpm run release`        | Create a release (release-it)                                   |
| `pnpm run deploy:preview` | Deploy preview to Vercel                                        |
| `pnpm run deploy:prod`    | Deploy to production on Vercel                                  |
| `pnpm run bump`           | Update pnpm and upgrade all dependencies                        |
| `pnpm run skills`         | Install agent skills from `skills-lock.json`                    |
| `pnpm run db <command>`   | Run drizzle-kit commands                                        |

**Pre-commit validation:** Run `pnpm run check` before committing. This runs `tsc --noEmit`, oxlint, `oxfmt --check`, and knip in sequence. **`pnpm run check` MUST exit with code 0 (zero errors) before any commit is made. This is a hard gate — no exceptions, no partial compliance. Do not commit while any error remains, regardless of whether it pre-existed or was introduced by the current change.**

**Git hooks:** Husky manages hooks. `pre-commit` runs `pnpm run format:check && pnpm run lint`. `commit-msg` runs commitlint. `pre-push` runs full `check:ci`. Commitlint enforces conventional commits with sentence-case subjects. Allowed scopes: `deps`, `deps-dev`, `dev`, `release`, `security`.

> **MANDATORY:** Always use `pnpm run <script>` (never bare `pnpm <script>`) to avoid conflicts with built-in pnpm commands (e.g. `pnpm ci`, `pnpm install`, `pnpm build`). The only exception is `pnpm install` itself.

---

## Model Selection

> **MANDATORY:** Agents MUST assess task complexity before starting and suggest a model switch when the current model is not the best fit for the task at hand.

### Default models

| Model               | Role                 | Use for                                                                                                                  |
| ------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `Claude Sonnet 4.6` | Default              | Day-to-day tasks: feature implementation, bug fixes, refactors, code review, documentation, and most agent work          |
| `Claude Opus 4.6`   | High-complexity only | Architectural decisions with high ambiguity, large-scale cross-cutting refactors (>10K lines), multi-agent orchestration |

### When to suggest a model switch

Agents MUST proactively recommend switching to a more suitable model when the current one is likely to underperform. Surface the suggestion as a short, direct message before proceeding.

**Suggest switching from Sonnet to Opus when:**

- The task requires architectural decisions with significant ambiguity (e.g., choosing between competing system designs, evaluating trade-offs across many layers)
- The change touches more than 10K lines of code across many modules (large-scale refactors, migrations, or full-feature rewrites)
- The task involves orchestrating or designing a multi-agent system or complex agentic workflow
- The task requires deep reasoning across many interacting constraints simultaneously

**Suggest switching from Opus to Sonnet when:**

- The task is well-scoped and mechanical (single-file changes, routine feature additions, minor refactors)
- Speed and cost efficiency are more important than deep reasoning depth

### How to surface the suggestion

When a model switch is warranted, say so clearly at the start of the response before doing any work:

```
This task involves [reason]. Consider switching to Claude Opus 4.6 for better results before proceeding.
```

Do not block on the suggestion — if the user continues without switching, proceed with the current model.

---

## Stack

| Category         | Technology                                            | Version            |
| ---------------- | ----------------------------------------------------- | ------------------ |
| Framework        | Next.js (App Router, RSC, Cached Components)          | ^16.1.7            |
| Language         | TypeScript (strict mode)                              | ^5.9.3             |
| Runtime          | React (with React Compiler enabled)                   | ^19.2.4            |
| Package manager  | pnpm                                                  | 10.32.1            |
| React Compiler   | babel-plugin-react-compiler                           | ^1.0.0             |
| Database         | Neon Serverless Postgres (`@neondatabase/serverless`) | ^0.10.4            |
| ORM              | Drizzle ORM + drizzle-kit                             | ^0.45.1 / ^0.31.10 |
| Auth             | Better Auth (`better-auth`)                           | ^1.5.4             |
| Storage          | Cloudflare R2 (`@aws-sdk/client-s3`)                  | ^3.1010.0          |
| Linter           | oxlint (`.oxlintrc.json`)                             | latest             |
| Formatter        | oxfmt (`.oxfmtrc.json`)                               | latest             |
| Styling          | Tailwind CSS                                          | ^4.1.18            |
| UI Components    | shadcn/ui (new-york style)                            | ^3.8.4             |
| Rich text editor | Plate.js                                              | ^52.0.17           |
| i18n             | next-intl                                             | ^4.8.2             |
| Forms            | react-hook-form + zod                                 | ^7.71.1 / ^4.3.6   |
| State            | nuqs (URL state)                                      | ^2.8.8             |
| Email            | Nodemailer (SMTP)                                     | ^8.0.2             |
| AI               | Vercel AI SDK + Google Gemini (`@ai-sdk/google`)      | ^6.0.116 / ^3.0.43 |
| Animation        | motion                                                | ^12.38.0           |
| DnD              | @dnd-kit                                              | ^6.3.1             |
| Icons            | lucide-react                                          | ^0.577.0           |
| Deployment       | Vercel                                                | ^50.13.2           |
| Analytics        | @vercel/analytics + @vercel/speed-insights            | ^2.0.1 / ^2.0.0    |
| Search           | fuse.js                                               | ^7.1.0             |
| QR code          | qrcode                                                | ^1.5.4             |
| Agent Skills     | skills CLI (https://agentskills.io)                   | latest             |

---

## Agent Skills

This project uses [Agent Skills](https://agentskills.io) (`skills` CLI) to provide domain-specific knowledge to AI agents. Skills are managed in `.agents/skills/` and tracked in `skills-lock.json`.

> **MANDATORY:** All skill creation, management, and structure MUST conform to the [agentskills.io](https://agentskills.io) standard (file naming, `SKILL.md` frontmatter, `references/` folder usage, and `assets/` folder usage).

> **MANDATORY:** The **only** skills folder to read or edit is `.agents/skills/`. Any `skills/` folder inside `.claude/` is a symlink to `.agents/skills/` — never access or modify it directly. Always use `.agents/skills/` as the canonical path.

### Setup

```bash
pnpm skills                           # Install all skills from skills-lock.json
skills add <owner/repo>               # Install a new external skill
skills list                           # List installed skills
skills --help                         # Show all CLI commands
```

### Installed skills

| Skill                                 | Source                        | Purpose                                                                 | When to use                                                                         |
| ------------------------------------- | ----------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `better-auth-best-practices`          | `better-auth/skills`          | Better Auth server/client setup, plugins, sessions                      | When configuring auth, adding plugins, or setting up email/password authentication  |
| `better-auth-security-best-practices` | `better-auth/skills`          | Rate limiting, CSRF, secrets, session hardening                         | When securing auth, preventing brute force, or hardening a Better Auth deployment   |
| `email-and-password-best-practices`   | `better-auth/skills`          | Email verification, password reset, hashing policy                      | When implementing login/sign-up flows, password security, or email verification     |
| `frontend-design`                     | `anthropics/skills`           | Production-grade UI design with bold aesthetics                         | **ALWAYS** when building/styling UI components, pages, layouts                      |
| `neon-drizzle`                        | `neondatabase/ai-rules`       | Drizzle ORM + Neon database setup                                       | When creating/modifying schemas, migrations, or database configuration              |
| `neon-postgres`                       | `neondatabase/agent-skills`   | Neon Serverless Postgres best practices                                 | When working with database queries, branching, or Neon platform features            |
| `vercel-react-best-practices`         | `vercel-labs/agent-skills`    | 58 performance optimization rules for React/Next.js                     | **ALWAYS** when writing/reviewing React components, data fetching, or Next.js pages |
| `web-design-guidelines`               | `vercel-labs/agent-skills`    | Web Interface Guidelines compliance review                              | When reviewing UI accessibility, UX patterns, or design compliance                  |
| `email-best-practices`                | `resend/email-best-practices` | Email deliverability, compliance, transactional/marketing patterns      | **ALWAYS** when creating or modifying email templates in `src/emails/`              |
| `react-email`                         | `resend/react-email`          | react-email components, styling, i18n, and sending patterns             | **ALWAYS** when creating or modifying email templates in `src/emails/`              |
| `cloudflare`                          | `cloudflare/skills`           | Cloudflare Workers, Pages, D1, R2, KV, AI, WAF, Tunnel, Terraform       | When working with Cloudflare APIs, services, or infrastructure                      |
| `agents-md`                           | custom                        | Update AGENTS.md via `/agents-md <instruction>`                         | When adding rules, syncing with codebase, or performing major AGENTS.md updates     |
| `skill-creator`                       | `anthropics/skills`           | Create and optimize skills; run evals and measure performance           | When creating, editing, or optimizing agent skills for this project                 |
| `commit`                              | custom                        | Finalize and commit staged changes using conventional commits           | After completing a feature, before merging to main                                  |
| `release`                             | custom                        | Controlled release workflow: preview, confirm, publish                  | When cutting a release (`/release`) or when ship triggers a release gate            |
| `shadcn`                              | `shadcn/ui`                   | Manages shadcn components and projects                                  | When adding, modifying, or debugging shadcn/ui components                           |
| `ship`                                | custom                        | **PRIMARY ORCHESTRATOR** — execute tasks, scan codebase, manage roadmap | **ALWAYS** when starting any development work (`/ship`)                             |

### Workflow Skills (used by ship)

Ship automatically invokes these skills at the right moments. You do not need to invoke them separately.

> **Priority:** AGENTS.md rules and user instructions ALWAYS take precedence over workflow skill instructions. Skill behaviors override only default agent behavior, never project-specific conventions documented here.

| Skill                            | Purpose                                                                                        | When ship invokes it                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `brainstorming`                  | Socratic design refinement; saves spec to `.agents/specs/`                                     | Complex or ambiguous feature design (Phase 2: Plan)                            |
| `dispatching-parallel-agents`    | Concurrent subagent workflows for multiple independent problems                                | Independent sub-problems (Phase 3: Implement); codebase audit (`scan` command) |
| `executing-plans`                | Batch plan execution with human checkpoints                                                    | Executing a written plan in a parallel session (Phase 3: Implement)            |
| `finishing-a-development-branch` | Verify tests, present merge/PR/discard options, clean up worktree                              | After Phase 5: merge/PR/discard decision                                       |
| `receiving-code-review`          | Technical evaluation of review feedback; verify before implementing                            | When code review feedback is received                                          |
| `requesting-code-review`         | Dispatch code-reviewer subagent with precise context (git SHAs + requirements)                 | After completing a task (Phase 5: Complete)                                    |
| `subagent-driven-development`    | Fresh subagent per task with two-stage review (spec compliance, then code quality)             | Executing implementation plans in the current session (Phase 3: Implement)     |
| `systematic-debugging`           | 4-phase root cause process: reproduce, localize, identify root cause, verify fix               | Bug, test failure, or unexpected behavior (Phase 3: Implement)                 |
| `test-driven-development`        | RED-GREEN-REFACTOR: write failing test, watch it fail, pass with minimal code                  | Any feature or bug fix implementation (Phase 3: Implement)                     |
| `using-git-worktrees`            | Isolated workspace per feature branch with safety verification                                 | Feature branch isolation (before Phase 2: Plan)                                |
| `using-superpowers`              | Overview of the superpowers workflow system                                                    | Available for reference; ship embeds the relevant behaviors directly           |
| `verification-before-completion` | Run verification commands and confirm output before making any success claim                   | Before any completion claim (Phase 4: Verify)                                  |
| `writing-plans`                  | Bite-sized tasks (2-5 min each) with file paths, code, verify steps; saves to `.agents/plans/` | Large features needing a detailed plan (Phase 2: Plan)                         |
| `writing-skills`                 | Create and test new skills following agentskills.io best practices                             | When creating or improving agent skills                                        |

Permanent project documents (always read at session start):

| File                         | Purpose                             |
| ---------------------------- | ----------------------------------- |
| `.agents/specs/app.md`       | Canonical application specification |
| `.agents/specs/decisions.md` | Decisions log                       |
| `.agents/specs/roadmap.md`   | Feature backlog and roadmap (P0-P3) |

---

### Skill enforcement rules

Agents MUST autonomously read and apply the relevant skill(s) before starting work:

1. **Any UI work** → Read `frontend-design/SKILL.md` AND `vercel-react-best-practices/SKILL.md`. Use shadcn/ui components from `components.json` (new-york style). Composable component patterns are mandatory.
2. **Any React/Next.js code** → Read `vercel-react-best-practices/SKILL.md`. Apply the 58 rules by priority (CRITICAL → HIGH → MEDIUM → LOW).
3. **Database/schema changes** → Read `neon-drizzle/SKILL.md` and `neon-postgres/SKILL.md`.
4. **Auth modifications** → Read `better-auth-best-practices/SKILL.md`, `better-auth-security-best-practices/SKILL.MD`, and `email-and-password-best-practices/SKILL.md`.
5. **UI review requests** → Read `web-design-guidelines/SKILL.md`, fetch the latest guidelines, and produce terse `file:line` output.
6. **AGENTS.md updates** → Read `agents-md/SKILL.md`. Follow the workflow for add/remove/update operations.
7. **Any email work** (`src/emails/`) → Read `email-best-practices/SKILL.md` AND `react-email/SKILL.md`. Both are mandatory before creating or modifying any template.
8. **shadcn/ui component work** → Read `shadcn/SKILL.md`. Use when adding, editing, or debugging shadcn/ui components.
9. **Committing changes** → Read `commit/SKILL.md`. Follow the commit workflow before merging any feature branch.
10. **Releasing versions** → Read `release/SKILL.md`. Follow the release workflow for version bumps, changelog generation, and GitHub releases. Ship delegates to this skill at its release gate.
11. **All development work** → Use `/ship` as the only entry point. Ship orchestrates all workflow skills (brainstorming, TDD, systematic debugging, parallel subagents, etc.) at the right moments. You do not need to invoke them separately.
12. **Cloudflare work** → Read `cloudflare/SKILL.md` when working with Cloudflare Workers, Pages, D1, R2, KV, AI, or any Cloudflare service.
13. **Creating or optimizing skills** → Read `skill-creator/SKILL.md` when creating new skills or improving existing ones.

### Creating custom skills

Custom skills can be created in `.agents/skills/` following the [Agent Skills format](https://agentskills.io):

1. Create a folder in `.agents/skills/<skill-name>/` with at minimum a `SKILL.md` file
2. The `SKILL.md` must have YAML frontmatter with `name` and `description` fields
3. **To track a custom skill in git:** Add `!<skill-name>` to `.agents/skills/.gitignore` (external skills installed via `skills` CLI are gitignored by default; only custom skills need explicit tracking)
4. If an agent creates a custom skill, it MUST ask the user whether to track it in git, and if yes, add the exclusion to `.agents/skills/.gitignore`

### Gitignore enforcement for skills

The `.agents/skills/.gitignore` file controls which skills are tracked in git. The rules are:

- **External skills** (listed in `skills-lock.json`) MUST NOT be tracked — do **NOT** add them as exceptions. They behave like `node_modules`.
- **Custom skills** (created by the user or an agent, NOT in `skills-lock.json`) MUST be added as exceptions (`!<skill-name>`) to be tracked.

Before adding any skill to `.gitignore`, always check `skills-lock.json`. If the skill appears there, it is external and must remain ignored.

```gitignore
# CORRECT — only custom/user-created skills are tracked
/*/
!agents-md
!commit
!release

# WRONG — external skills must not be exceptions
/*/
!agents-md
!commit
!better-auth-best-practices   ← WRONG (in skills-lock.json)
!shadcn                       ← WRONG (in skills-lock.json)
```

### Skills directory structure

```
.agents/
└── skills/
    ├── .gitignore                            # Ignores all folders; add !<name> to track custom skills
    ├── agents-md/                            # AGENTS.md update skill (custom, git-tracked)
    ├── commit/                               # Commit workflow skill (custom, git-tracked)
    ├── release/                              # Release workflow skill (custom, git-tracked)
    ├── ship/                                 # Primary orchestrator skill (custom, git-tracked)
    ├── better-auth-best-practices/           # Better Auth setup (external)
    ├── better-auth-security-best-practices/  # Better Auth security (external)
    ├── brainstorming/                        # Design refinement before coding (external, workflow)
    ├── cloudflare/                           # Cloudflare platform and services (external)
    ├── dispatching-parallel-agents/          # Concurrent subagent workflows (external, workflow)
    ├── email-and-password-best-practices/    # Email/password auth (external)
    ├── email-best-practices/                 # Email deliverability & compliance (external)
    ├── executing-plans/                      # Plan execution with checkpoints (external, workflow)
    ├── finishing-a-development-branch/       # Merge/PR decision workflow (external, workflow)
    ├── frontend-design/                      # UI design patterns (external)
    ├── neon-drizzle/                         # Drizzle ORM guides (external)
    ├── neon-postgres/                        # Postgres best practices (external)
    ├── react-email/                          # react-email components & patterns (external)
    ├── receiving-code-review/                # Technical code review reception (external, workflow)
    ├── requesting-code-review/               # Code reviewer subagent dispatch (external, workflow)
    ├── shadcn/                               # shadcn/ui components (external)
    ├── skill-creator/                        # Create and optimize agent skills (external)
    ├── subagent-driven-development/          # Fresh subagent per task with two-stage review (external, workflow)
    ├── systematic-debugging/                 # 4-phase root cause debugging process (external, workflow)
    ├── test-driven-development/              # RED-GREEN-REFACTOR TDD workflow (external, workflow)
    ├── using-git-worktrees/                  # Isolated branch workspaces (external, workflow)
    ├── using-superpowers/                    # Superpowers system introduction (external, workflow)
    ├── vercel-react-best-practices/          # React/Next.js performance (external)
    ├── verification-before-completion/       # Verify before claiming done (external, workflow)
    ├── web-design-guidelines/               # Web Interface Guidelines (external)
    ├── writing-plans/                        # Implementation plan creation (external, workflow)
    └── writing-skills/                       # New skill creation workflow (external, workflow)
```

---

## Architecture

```
src/
├── actions/            # Server actions (mutations and cached queries)
│   ├── admin-organizations.ts  # Organization approvals, invitations
│   ├── admin-team.ts           # Team member management, invitations
│   ├── admin-users.ts          # User moderation (ban/unban, role updates)
│   ├── auth.ts         # Login, logout, password reset, getAuthUser
│   ├── certificate.ts  # Certificate queries
│   ├── cookies.ts      # Typed cookie get/set/delete (wraps next/headers cookies)
│   ├── course-management.ts    # Course and content CRUD (lessons, questions, evaluations)
│   ├── course-progress.ts      # Learner progress and analytics (enroll, complete, submit)
│   ├── course-queries.ts       # Course read queries and courseWith helpers
│   ├── doc.ts          # Doc category + article CRUD, cached queries
│   ├── onboarding.ts   # Complete onboarding flow
│   ├── organization.ts # Org overview, members, join requests, settings
│   ├── storage.ts      # Avatar upload/remove via Cloudflare R2
│   └── user.ts         # User CRUD, getCurrentUser (cached)
├── app/                # App Router pages and layouts
│   ├── layout.tsx      # Root layout (providers, analytics, JSON-LD)
│   ├── error.tsx       # Global error boundary (client)
│   ├── not-found.tsx   # Global 404 (server)
│   ├── globals.css     # Tailwind imports, theme tokens, animations
│   ├── (auth)/         # Unauthenticated routes (login, onboarding)
│   ├── (dashboard)/    # Authenticated routes (sidebar layout)
│   │   └── organization/  # Org management page (overview, members, join requests, settings)
│   ├── [username]/     # Public certificate page route
│   └── api/            # API routes (auth catch-all + v1/)
├── components/
│   ├── blocks/         # Complex composed blocks (rich-text-editor)
│   ├── features/       # Domain components grouped by feature
│   │   ├── docs/          # Docs article cards, sheets, editor dialog, category manager
│   │   ├── organization/  # Org panel header, tabs, and management sections
│   │   └── search/        # Global command palette (SearchCommand) with Fuse.js fuzzy search
│   ├── icons/          # Custom SVG icon components + Lucide lazy wrapper
│   ├── layout/         # Shell components (sidebar, page header, fallbacks)
│   ├── providers/      # Context providers (session, i18n, theme, courses)
│   └── ui/             # shadcn/ui primitives and custom UI components
├── db/
│   ├── client.ts       # Neon + Drizzle client (neon HTTP driver)
│   ├── helpers.ts      # safeQuery(), queryError()
│   ├── types.ts        # Drizzle table type helpers (InferInsertModel)
│   ├── schema/         # Drizzle schema definitions per table
│   └── queries/        # Query parse functions per table
├── hooks/              # Custom React hooks
├── instrumentation.ts  # Next.js instrumentation hook (runtime env validation)
├── lib/                # App-wide shared utilities, constants, and types ONLY
│   ├── auth.ts         # Better Auth server instance
│   ├── cache.ts        # CacheTag enum, per-record tag helpers
│   ├── constants.ts    # Route roots, regex validators
│   ├── cookies.ts      # Cookie type definitions, prefix helpers
│   ├── email.ts        # Nodemailer SMTP transport (sendMail utility)
│   ├── env.ts          # Zod env schema, runtime validation, ProcessEnv augmentation
│   ├── i18n.ts         # i18n config, Locale/Messages types, localizeRecord()
│   ├── metadata.ts     # App metadata, viewport, intlMetadata()
│   ├── storage.ts      # R2 Put/Delete/URL helpers (r2Put, r2Delete, r2Url)
│   ├── types.ts        # Shared types (Icon, IconProps, Any, Enum, etc.)
│   └── utils.ts        # cn(), debounce(), throttle(), camelize(), etc.
├── i18n.ts             # next-intl request config
└── proxy.ts            # NextProxy middleware (auth guard)
config/                 # Static JSON configuration
├── app.json            # Feature settings (minSkills, minRating, etc.)
├── i18n.json           # Locales, default locale, title-case locales
├── metadata.json       # App name, version, URL, SEO data
└── theme.json          # Theme modes, colors, breakpoints
drizzle/                # drizzle-kit output — auto-generated, do not edit manually
├── *.sql               # Migration SQL files (one per `pnpm db generate` run)
└── meta/               # Schema snapshots and migration journal
    ├── _journal.json
    └── *_snapshot.json
messages/               # Translation files
├── en.json
├── es.json
└── it.json
scripts/
└── typegen.ts          # Env + route type generation script
tmp/                    # Temporary files (git-ignored, see Temporary Files section)
.agents/
├── assets/             # Shared agent assets (certificate template PDF, etc.)
├── plans/              # Implementation plans from writing-plans skill (YYYY-MM-DD-<feature>.md)
├── skills/             # Agent skills (see Agent Skills section)
└── specs/              # Permanent docs (app.md, decisions.md, roadmap.md) and feature design specs
```

### File naming conventions

- All files: **kebab-case** (enforced by oxlint `unicorn/filename-case`)
- Components: one component per file, named exports preferred
- Feature components: grouped by domain under `features/<domain>/`, sub-features in sub-folders
  - Drop domain prefix from filenames: `features/courses/editor/view.tsx` (not `course-editor-view.tsx`)
  - Context/params at sub-feature root: `context.tsx`, `params.ts`, `use-params.ts`
- Provider pattern: split into `*-context.tsx` + `*-provider.tsx`
- Database queries: `src/db/queries/<table>.ts` with `parse*` function
- Database schema: `src/db/schema/<table>.ts` with Drizzle table definitions

---

## Routing

### Route table

| Path                   | Auth               | Layout    | Description                                        |
| ---------------------- | ------------------ | --------- | -------------------------------------------------- |
| `/login`               | Public             | Root      | Login page                                         |
| `/register`            | Public             | Root      | Registration page                                  |
| `/onboarding`          | Auth (pre-onboard) | Root      | Onboarding form                                    |
| `/onboarding/error`    | Auth (pre-onboard) | Root      | Onboarding error                                   |
| `/[username]`          | Public             | Root      | Public certificate page                            |
| `/dashboard`           | Auth               | Dashboard | Main dashboard                                     |
| `/about`               | Auth               | Dashboard | About page                                         |
| `/admin`               | Auth + `is_admin`  | Dashboard | Admin panel                                        |
| `/admin/users`         | Auth + `is_admin`  | Dashboard | User moderation: ban/unban, platform role changes  |
| `/admin/organizations` | Auth + `is_admin`  | Dashboard | Org approval workflow: approve/reject pending orgs |
| `/organization`        | Auth + org manager | Dashboard | Organization panel                                 |
| `/certificates`        | Auth + non-editor  | Dashboard | Certificate list                                   |
| `/certificates/new`    | Auth + non-editor  | Dashboard | New certificate                                    |
| `/certificates/[id]`   | Auth + non-editor  | Dashboard | Certificate detail                                 |
| `/courses`             | Auth               | Dashboard | Course list                                        |
| `/courses/[slug]`      | Auth               | Dashboard | Course detail/editor                               |
| `/docs`                | Auth               | Dashboard | Documentation                                      |
| `/docs/intro`          | Auth               | Dashboard | Introduction docs                                  |
| `/docs/faq`            | Auth               | Dashboard | FAQ docs                                           |
| `/docs/tutorials`      | Auth               | Dashboard | Tutorial docs                                      |
| `/help`                | Auth               | Dashboard | Help page                                          |
| `/settings`            | Auth               | Dashboard | User settings                                      |
| `/offline`             | Public             | Root      | PWA offline fallback page                          |

### API routes

| Path                  | Method   | Description                                    |
| --------------------- | -------- | ---------------------------------------------- |
| `/api/auth/[...path]` | GET/POST | Neon Auth catch-all handler                    |
| `/api/v1/ai/command`  | POST     | AI command endpoint                            |
| `/api/v1/ai/copilot`  | POST     | AI copilot endpoint                            |
| `/api/v1/join`        | GET      | Team invitation join endpoint                  |
| `/api/v1/manifest`    | GET      | Dynamic PWA manifest (locale-aware, cached 1h) |
| `/api/v1/push`        | GET      | Return VAPID public key                        |
| `/api/v1/push`        | POST     | Save push subscription for authenticated user  |
| `/api/v1/push`        | DELETE   | Remove push subscription                       |
| `/api/v1/upload`      | POST     | R2 file upload                                 |
| `/api/v1/health`      | GET      | Health check (returns `{ status: 'ok' }`)      |

### Route groups

| Group         | Purpose                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| `(auth)`      | Unauthenticated pages — login, register, onboarding. No shared layout beyond root.                      |
| `(dashboard)` | Authenticated pages with sidebar. Wrapped in `SidebarProvider` → `SessionProvider` → `CoursesProvider`. |

### Redirects

- `/` → `/dashboard` (permanent redirect in `next.config.ts`)

---

## Authentication Flow

**Provider:** Better Auth (`better-auth`) — stores users/sessions/accounts in Neon database via Drizzle adapter

**Request lifecycle:**

1. `proxy.ts` (NextProxy) intercepts all non-static requests
2. `auth.api.getSession()` validates session via signed HTTP-only cookies
3. Unauthenticated → redirect to `/login`
4. Authenticated but not onboarded (`onboarded_at` is null) → redirect to `/onboarding`
5. Onboarded accessing `/onboarding` → redirect to `/dashboard`
6. Authenticated accessing `/login` → redirect to `/dashboard`

**Token storage:** Better Auth manages session tokens in signed HTTP-only cookies. Session data is cached in cookies (5-minute TTL) to reduce API calls.

**Cookie prefix:** All app cookies use `gl` prefix. Better Auth session cookies use `gl` prefix via `advanced.cookiePrefix`.

**Auth instance:** `auth` — exported from `src/lib/auth.ts`, server-only (`betterAuth()`). Used in server components, server actions, and the proxy.

**Plugins:**

| Plugin          | Purpose                              |
| --------------- | ------------------------------------ |
| `username()`    | Username/display username support    |
| `admin()`       | Admin role management, user creation |
| `nextCookies()` | Next.js cookie integration           |

**Auth API route:** `src/app/api/auth/[...all]/route.ts` — catch-all handler for all auth requests (sign-in, sign-up, session management, password reset, admin operations)

**Email:** Nodemailer SMTP transport (`src/lib/email.ts`) for transactional emails (invitations, notifications). Auth server has its own transport for password reset emails.

**Database client:**

| Client | Location           | Use case                                    |
| ------ | ------------------ | ------------------------------------------- |
| `db`   | `src/db/client.ts` | Drizzle ORM client via `neon()` HTTP driver |

---

## Data Fetching

### Query pattern

```typescript
// 1. Define interface extending InferSelectModel (src/db/queries/<table>.ts)
export interface Certificate extends InferSelectModel<typeof certificates> {
  organization: InferSelectModel<typeof organizations>
  reviewer: InferSelectModel<typeof users> | null
}

// 2. Define parser for computed fields
export const parseUser = (data: InferSelectModel<typeof users> & { memberships: ..., regions: ... }) => ({
  ...data,
  canEdit: Boolean(data.isAdmin || data.isEditor),
})

// 3. Derive type from parser
export type User = ReturnType<typeof parseUser>
```

### Drizzle query pattern

```typescript
// Server action with cache
const fetchUser = async (id: string) => {
  'use cache'
  cacheTag(userTag(id))

  return await safeQuery(async () => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: userWith,
    })
    if (!user) throw new Error('User not found')
    return parseUser(user)
  })
}

// Exposed action with cache bypass option
export const findUser = async (id: string, { cache = true } = {}) => {
  if (!cache) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: userWith,
    })
    if (!user) throw new Error('User not found')
    return parseUser(user)
  }
  const { data, error } = await fetchUser(id)
  if (error || !data) throw error || new Error('User not found')
  return data
}
```

### Error handling

- `safeQuery()` wraps a query function in try/catch, returns `{ data, error: null }` or `{ data: null, error: { code, message } }`
- `queryError()` normalizes unknown errors into `{ code, message }` shape
- Server actions return `{ data, error }` or `{ error }` — callers check for errors
- Mutations that fail throw; queries that fail return error objects

### Cache strategy

**Cache tags** (defined in `src/lib/cache.ts` `CacheTag` enum):

| Tag                | Used by                                                                      | Pattern    |
| ------------------ | ---------------------------------------------------------------------------- | ---------- |
| `admin-users`      | `fetchAdminUsers`                                                            | Global     |
| `auth-user`        | `fetchAuthUser`                                                              | Global     |
| `auth-user-status` | `logout`                                                                     | Global     |
| `certificates`     | `fetchUserCertificates`, `fetchTutorCertificates`, `fetchUnassignedOrgCerts` | Per-record |
| `course`           | `fetchCourse`                                                                | Per-record |
| `courses`          | `fetchCourses`                                                               | Global     |
| `doc-categories`   | `fetchDocCategories`                                                         | Global     |
| `notifications`    | `fetchNotifications`                                                         | Per-record |
| `organizations`    | `fetchOrganizations`                                                         | Global     |
| `skill-groups`     | `listSkillGroups`                                                            | Global     |
| `team-members`     | `fetchTeamMembers`                                                           | Global     |
| `user`             | `fetchUser`                                                                  | Per-record |
| `user-email`       | `fetchUserEmail`                                                             | Global     |

**Per-record tag helpers** (`src/lib/cache.ts`):

| Helper                             | Tag format                        |
| ---------------------------------- | --------------------------------- |
| `userTag(id)`                      | `user-{id}`                       |
| `courseTag(slug)`                  | `course-{slug}`                   |
| `notificationsTag(userId)`         | `notifications-{userId}`          |
| `certificatesUserTag(userId)`      | `certificates-user-{userId}`      |
| `certificatesTutorTag(reviewerId)` | `certificates-tutor-{reviewerId}` |
| `certificatesOrgTag(orgId)`        | `certificates-org-{orgId}`        |

**Patterns:**

- `'use cache'` directive on inner fetch functions
- `cacheTag()` to tag cached data
- `cacheLife('max')` for long-lived caches
- `revalidateTag(tag, 'max')` after mutations
- React `cache()` for request-level deduplication
- `{ cache: false }` option to bypass `'use cache'` in actions

---

## Internationalization

**Library:** next-intl ^4.8.2

**Locales:** `en` (default), `es`, `it`

**Title-case locales:** `en` only

**Configuration:** `src/lib/i18n.ts` reads from `config/i18n.json`

**Request config:** `src/i18n.ts` — uses `getRequestConfig` from next-intl/server

**Locale storage:** Cookie named `NEXT_LOCALE` (no prefix)

**Message files:** `messages/{locale}.json`

**Namespace conventions:**

| Namespace                                   | Purpose                                                                |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| `Metadata`                                  | Page titles, descriptions, SEO                                         |
| `Common`                                    | Shared strings (actions, labels)                                       |
| `Components.*`                              | Component-specific (`Components.MultiSelect`, `Components.IconPicker`) |
| `Layout`                                    | Shell, navigation, footer                                              |
| `Auth`                                      | Authentication pages                                                   |
| `Courses`, `Certificates`, `Users`, `Admin` | Feature pages                                                          |
| `Intl.Countries.*`, `Intl.Languages.*`      | Country/language names                                                 |
| `Email.*`                                   | Email template strings                                                 |

**Key types:**

- `IntlRecord<T = string>` — `Record<Locale, T>` for multilingual DB fields
- `Translator<NestedKey>` — Typed translator function
- `Namespace` — Union of all valid namespace keys
- `MessageKey<T>` — Valid message keys for a namespace

**Adding a new translation:**

1. Add key to `messages/en.json` under the appropriate namespace
2. Add translations to `messages/es.json` and `messages/it.json`
3. Use `useTranslations('Namespace')` in client components or `getTranslations('Namespace')` in server components
4. Run `pnpm check i18n` to validate

---

## Component Patterns

### Export conventions

- **Named exports** preferred for components — always exported inline (see [Coding Patterns](#named-exports))
- **Default exports** for page components and email templates
- **Arrow functions (`const`)** for all components — never `function` keyword

### Server vs client components

- **Server Components** by default
- `'use client'` only when interactivity is needed (hooks, event handlers, browser APIs)
- Layout guards (admin, certificates) are server components that call `notFound()`
- **Page Suspense pattern:** Pages that fetch data async MUST use an inner async component + outer sync page with `<Suspense fallback={<LoadingFallback />}>`. The page header renders immediately while data loads. See `admin/page.tsx`, `certificates/page.tsx`, `organization/page.tsx` as reference.

### Variant pattern

CVA (`class-variance-authority`) for component variants:

```typescript
import { cva } from 'class-variance-authority'
const buttonVariants = cva('base-classes', {
  variants: { variant: { default: '...', outline: '...' }, size: { sm: '...', lg: '...' } },
  defaultVariants: { variant: 'default', size: 'sm' },
})
```

oxfmt `sortTailwindcss` recognizes `cn` and `cva` functions for class sorting.

### Context/Provider pattern

Split into two files:

- `*-context.tsx` — context creation, hook logic, `createContext`, provider component
- `*-provider.tsx` — server-side data fetching, wraps context provider

Provider hierarchy (root layout):

```
SearchParamsProvider → I18nProvider → PWAContextProvider → ThemeProvider
```

Dashboard layout adds:

```
SidebarProvider → SessionProvider → CoursesProvider
```

### Icon system

- **Lucide icons:** `lucide-react` with lazy loading via `src/components/icons/lucide.tsx`
  - Uses `Map` cache for `lazy()` components to avoid re-creation
  - Wrapped in `Suspense` with fallback
  - Import as `LucideIcon` with `name` prop (type: `IconName`)
- **Custom icons:** `src/components/icons/` — `GloreIcon`, `DashboardIcon`, `ErrorIcon`, etc.
- **Database icon field:** Courses store icon as `IconName` string

### URL state management

Uses `nuqs` for URL search params with type-safe parsers. Feature-specific `params.ts` + `use-params.ts` files define param schemas and hooks.

---

## Code Style

### Formatter (oxfmt — `.oxfmtrc.json`)

| Setting         | Value                          |
| --------------- | ------------------------------ |
| Quotes          | Single                         |
| Semicolons      | None (`semi: false`)           |
| Trailing commas | ES5                            |
| Arrow parens    | Avoid (`arrowParens: "avoid"`) |

### Import organization (oxfmt `sortImports`)

```
:BUILTIN:                       # Node built-ins
                                # blank line
react / react/**                # React imports
next / next/**                  # Next.js imports
                                # blank line
:EXTERNAL:                      # Third-party packages
                                # blank line
~/**                            # Config/messages aliases
@/**                            # Internal @/ aliases
                                # blank line
:RELATIVE:                      # Sibling/index (parent imports are blocked)
```

**Import type style:** Inline type imports (`import { type Foo }`)

### Restricted imports

| Import                         | Restriction | Alternative                   |
| ------------------------------ | ----------- | ----------------------------- |
| `cookies` from `next/headers`  | Blocked     | `@/actions/cookies`           |
| `useRouter` from `next/router` | Blocked     | `next/navigation`             |
| `cn` from `@udecode/cn`        | Blocked     | `@/lib/utils`                 |
| `default` from `zod`           | Blocked     | Use `z` named import          |
| `../**` (parent imports)       | Blocked     | Use path aliases (`@/`, `~/`) |

### Key lint rules (oxlint — `.oxlintrc.json`)

| Rule                                      | Setting                                                  |
| ----------------------------------------- | -------------------------------------------------------- |
| `unicorn/no-array-for-each`               | Error — use `for..of`, `map`, `reduce`                   |
| `unicorn/no-for-loop`                     | Error — use `for..of`                                    |
| `eslint/arrow-body-style`                 | Error — concise arrow body (`as-needed`)                 |
| `eslint/no-else-return`                   | Error — use early returns                                |
| `eslint/prefer-arrow-callback`            | Error — arrow functions in callbacks                     |
| `eslint/prefer-const`                     | Error                                                    |
| `eslint/prefer-template`                  | Error — template literals over concatenation             |
| `eslint/require-await`                    | Error — async functions must await                       |
| `eslint/no-console`                       | Warn — only `info`, `error`, `warn` allowed              |
| `eslint/no-restricted-imports`            | Error — `../**` parent imports blocked                   |
| `import/no-relative-parent-imports`       | Error — use `@/` or `~/` path aliases                    |
| `import/consistent-type-specifier-style`  | Error — inline type imports                              |
| `import/no-namespace`                     | Error (except `src/components/ui/*`, `src/db/client.ts`) |
| `import/no-cycle`                         | Error                                                    |
| `import/no-commonjs`                      | Error — ESM only                                         |
| `typescript/consistent-type-definitions`  | Error — prefer `interface`                               |
| `typescript/consistent-type-imports`      | Error — inline type imports                              |
| `typescript/array-type`                   | Error — shorthand (`T[]`)                                |
| `typescript/no-inferrable-types`          | Error — omit obvious types                               |
| `typescript/no-explicit-any`              | Warn (only `src/lib/types.ts` may use `any`)             |
| `unicorn/filename-case`                   | Error — kebab-case                                       |
| `react/jsx-fragments`                     | Error — syntax fragments (`<>`) only                     |
| `react/jsx-no-constructed-context-values` | Error                                                    |
| `react/self-closing-comp`                 | Error                                                    |
| `promise/prefer-await-to-then`            | Error — use `await` over `.then()`                       |

### Lint overrides

| Files                                         | Override                  |
| --------------------------------------------- | ------------------------- |
| `src/components/ui/*.tsx`, `src/db/client.ts` | `import/no-namespace` off |

---

## Type System

### TypeScript config

| Setting              | Value       |
| -------------------- | ----------- |
| `strict`             | `true`      |
| `noImplicitAny`      | `true`      |
| `noUnusedLocals`     | `true`      |
| `noUnusedParameters` | `true`      |
| `target`             | `esnext`    |
| `module`             | `esnext`    |
| `moduleResolution`   | `bundler`   |
| `jsx`                | `react-jsx` |

### Path aliases

| Alias          | Maps to        |
| -------------- | -------------- |
| `@/*`          | `./src/*`      |
| `~/config/*`   | `./config/*`   |
| `~/messages/*` | `./messages/*` |

### Custom type helpers (`src/lib/types.ts`)

| Type                      | Purpose                                               |
| ------------------------- | ----------------------------------------------------- |
| `Any`                     | Escape hatch (only in `src/lib/types.ts`)             |
| `AnyRecord`               | `Record<string \| number \| symbol, any>`             |
| `AnyFunction`             | `(...args: any[]) => any`                             |
| `AuthView`                | Union of valid auth view names (from `AUTH_VIEWS`)    |
| `CamelCase<S>`            | Convert snake/kebab string to camelCase at type level |
| `Icon<T>`, `IconProps<T>` | SVG component prop types extending LucideProps        |
| `IconName`                | Re-export from `lucide-react/dynamic`                 |
| `Rgb`                     | `[number, number, number]` tuple                      |
| `Enum<T>`                 | `T \| \`${T}\`` — allows string literal or template   |
| `HttpUrl`                 | `\`http://${string}\` \| \`https://${string}\``       |

### Database types (`src/db/types.ts`)

| Type             | Purpose                                                     |
| ---------------- | ----------------------------------------------------------- |
| `TableMap`       | Interface mapping snake_case names to Drizzle table objects |
| `TableName`      | Union of all table names (`keyof TableMap`)                 |
| `TableInsert<T>` | `InferInsertModel` for a table                              |
| `TableUpdate<T>` | `Partial<InferInsertModel>` for a table                     |
| `Enums`          | Interface of database enum types                            |
| `EnumType<T>`    | Extract a specific enum type                                |

### Enum pattern

- TypeScript `enum` only for `CacheTag`
- All other enums use `satisfies` + `as const` on arrays/objects
- Example: `COURSE_TYPES = ['intro', 'skill', 'learner'] satisfies Enums<'course_type'>[]`
- DB enums: `certificate_status` (`'draft' | 'submitted' | 'in_review' | 'changes_requested' | 'approved'`), `course_type` (`'intro' | 'skill' | 'learner'`), `organization_request_status` (`'pending' | 'accepted' | 'rejected'`), `role` (`'admin' | 'learner' | 'tutor' | 'representative' | 'volunteer'`)

---

## Utility Functions (`src/lib/utils.ts`)

| Function                    | Purpose                                                   |
| --------------------------- | --------------------------------------------------------- |
| `cn(...inputs)`             | Merge Tailwind classes (extended `tailwind-merge` + `cx`) |
| `hexToRgb(record)`          | Convert hex color record to RGB tuples                    |
| `isValidUsername(value)`    | Validate email or username format                         |
| `defaultFormDisabled(form)` | Check if form is pristine or has errors                   |
| `publicFile(file)`          | Resolve a public file URL relative to `APP_URL`           |
| `titleize(input)`           | Title-case string (words >3 chars capitalized)            |
| `camelize(input)`           | Convert to camelCase (typed)                              |
| `keysOf(record)`            | Type-safe `Object.keys()`                                 |
| `pluck(array, key)`         | Extract values of a key from array of objects             |
| `omit(record, keys)`        | Omit keys from object                                     |
| `debounce(callback, delay)` | Debounce with `.cancel()` and `.flush()`                  |
| `throttle(callback, limit)` | Throttle function calls                                   |
| `sleep(ms)`                 | Promise-based delay                                       |
| `noop()`                    | No-op function                                            |

---

## Custom Hooks

| Hook               | Purpose                               | Key behavior                                                                                                                                                                                                                                                                                                               |
| ------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useComposedRefs`  | Compose multiple refs into one        | Handles React 19 cleanup refs                                                                                                                                                                                                                                                                                              |
| `useCookies`       | Browser-side typed cookie management  | Uses `document.cookie`; JSON serialize/parse; supports prefix                                                                                                                                                                                                                                                              |
| `useDebounce`      | Debounce a value                      | Default 500ms delay                                                                                                                                                                                                                                                                                                        |
| `useDevice`        | Detect device type and touch          | Uses `window.matchMedia`; configurable breakpoint (default 768px)                                                                                                                                                                                                                                                          |
| `useFileUpload`    | UploadThing file upload with progress | Tracks progress, shows toast on error                                                                                                                                                                                                                                                                                      |
| `useI18n`          | Access i18n context                   | Reads from `I18nContext`; throws if outside provider                                                                                                                                                                                                                                                                       |
| `useMetadata`      | Client-side document metadata updates | Updates `<meta>` tags, PWA title formatting, 100ms delay                                                                                                                                                                                                                                                                   |
| `useMounted`       | Check if component has mounted        | For hydration-safe rendering                                                                                                                                                                                                                                                                                               |
| `usePWA`           | Detect PWA display mode               | Detects TWA, Standalone, MinimalUI, Fullscreen, Browser                                                                                                                                                                                                                                                                    |
| `useScroll`        | Track scroll position                 | Throttled at 100ms; returns `{ scroll, scrolled }`                                                                                                                                                                                                                                                                         |
| `useSession`       | Access session context                | Reads from `SessionContext`; throws if outside provider; user includes `isOrgAdmin` (true for `admin` or `representative` org role), `isLearner`, `isRepresentative`, `isTutor`, `isVolunteer` computed from active org role; org-owner-only operations (e.g., deletion) must check `membership.role === 'admin'` directly |
| `useSidebarResize` | Drag-to-resize sidebar                | Configurable min/max widths; collapse/expand thresholds                                                                                                                                                                                                                                                                    |
| `useTheme`         | Theme with cookie + view transitions  | Extends next-themes; uses View Transitions API; respects `prefers-reduced-motion`                                                                                                                                                                                                                                          |

---

## Theming & Styling

### Color system

Uses **OKLCH** color space. CSS custom properties defined in `src/app/globals.css` with light/dark variants.

**Semantic tokens:**

| Token                                                  | Purpose                                               |
| ------------------------------------------------------ | ----------------------------------------------------- |
| `--background` / `--foreground`                        | Base page colors                                      |
| `--card` / `--card-foreground`                         | Card surfaces                                         |
| `--popover` / `--popover-foreground`                   | Popover surfaces                                      |
| `--primary` / `--primary-foreground`                   | Primary actions                                       |
| `--secondary` / `--secondary-foreground`               | Secondary actions                                     |
| `--muted` / `--muted-foreground`                       | Muted/disabled elements                               |
| `--accent` / `--accent-foreground`                     | Accent highlights                                     |
| `--brand` / `--brand-accent` / `--brand-foreground`    | Brand primary (teal)                                  |
| `--brand-secondary` / `--brand-secondary-*`            | Brand secondary (olive)                               |
| `--brand-tertiary` / `--brand-tertiary-*`              | Brand tertiary (navy)                                 |
| `--link` / `--link-accent`                             | Link colors                                           |
| `--info` / `--success` / `--warning` / `--destructive` | Status colors (each with `-accent` and `-foreground`) |
| `--border` / `--input` / `--ring`                      | Interactive element borders                           |
| `--sidebar-*`                                          | Sidebar-specific tokens                               |
| `--editor-highlight`                                   | Rich text editor highlight                            |
| `--chart-1` through `--chart-5`                        | Chart colors                                          |

**Border radius:** `--radius: 0.625rem` with computed `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`.

**Custom utilities:** `text-stroke-*` (webkit text stroke width and color).

**Theme switching:** Uses `next-themes` with `class` attribute strategy. Supports `system`, `light`, `dark`. View Transitions API used for smooth theme changes (with fallback for browsers without support).

**Mobile breakpoint:** 768px (from `config/theme.json`)

---

## Form Patterns

**Library:** `react-hook-form` + `@hookform/resolvers` with `zod` validation.

**Patterns:**

- Zod schemas for form validation
- `defaultFormDisabled(form)` — utility to check if form submit button should be disabled
- `sonner` toast for user feedback: `toast.success()`, `toast.error()`
- Server actions called from form `onSubmit` handlers

---

## Email Templates

**Templates** in `src/emails/`:

| Template                  | Path                        |
| ------------------------- | --------------------------- |
| Auth recovery             | `auth/recovery`             |
| Auth invite               | `auth/invite`               |
| Auth verify email         | `auth/verify-email`         |
| Team invite               | `team/invite`               |
| Password changed          | `account/password-changed`  |
| Email changed             | `account/email-changed`     |
| Certificate assigned      | `certificate/assigned`      |
| Certificate review        | `certificate/review`        |
| Organization join request | `organization/join-request` |
| Organization member added | `organization/member-added` |

**SMTP config:** Nodemailer client with settings from env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SENDER`).

---

## Environment Variables

> **MANDATORY:** Every environment variable used by the Next.js app MUST be declared in `src/lib/env.ts`. Whenever a new variable is added, add it to the Zod schema in that file immediately. `GITHUB_TOKEN` and `VERCEL_TOKEN` are excluded — they are only used by external CLI tools and are not part of the runtime app.

| Variable               | Purpose                                          | Scope  | In `env.ts` |
| ---------------------- | ------------------------------------------------ | ------ | ----------- |
| `APP_URL`              | Application base URL                             | Server | Yes         |
| `BETTER_AUTH_SECRET`   | Better Auth secret key                           | Server | Yes         |
| `R2_ACCOUNT_ID`        | Cloudflare account ID                            | Server | Yes         |
| `R2_ACCESS_KEY_ID`     | R2 API token access key                          | Server | Yes         |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret                              | Server | Yes         |
| `R2_BUCKET_NAME`       | R2 bucket name                                   | Server | Yes         |
| `R2_PUBLIC_URL`        | R2 public base URL (custom domain or r2.dev URL) | Server | Yes         |
| `COOKIE_PREFIX`        | App cookie prefix (default: `gl_`)               | Server | Yes         |
| `DATABASE_URL`         | Neon Postgres connection string                  | Server | Yes         |
| `GEMINI_API_KEY`       | Google Gemini API key                            | Server | Yes         |
| `GEMINI_MODEL`         | Gemini model name (e.g., `gemini-2.0-flash`)     | Server | Yes         |
| `SMTP_HOST`            | SMTP server hostname                             | Server | Yes         |
| `SMTP_PORT`            | SMTP port                                        | Server | Yes         |
| `SMTP_USER`            | SMTP username                                    | Server | Yes         |
| `SMTP_PASSWORD`        | SMTP password                                    | Server | Yes         |
| `SMTP_SENDER`          | Email sender address                             | Server | Yes         |
| `VAPID_PUBLIC_KEY`     | VAPID public key for push notifications          | Server | Yes         |
| `VAPID_PRIVATE_KEY`    | VAPID private key for push notifications         | Server | Yes         |
| `VAPID_SUBJECT`        | VAPID subject (mailto: or URL)                   | Server | Yes         |
| `GITHUB_TOKEN`         | GitHub personal access token                     | Server | No          |
| `VERCEL_TOKEN`         | Vercel CLI token                                 | Server | No          |

### Validation schema (`src/lib/env.ts`)

Env vars are validated via a Zod schema exported as `validateEnv()` from `env.ts`. Validation runs at build time (via `next.config.ts`) and at server startup (via `src/instrumentation.ts`). The schema is also the source of the global `ProcessEnv` type augmentation.

| Variable               | Zod validator                                           | Notes                                                |
| ---------------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| `APP_URL`              | `z.url()`                                               |                                                      |
| `BETTER_AUTH_SECRET`   | `z.string().regex(/^[A-Za-z0-9+/]{43}=$/)`              | Generate with `openssl rand -base64 32`              |
| `COOKIE_PREFIX`        | `z.string().optional()`                                 | Defaults to `gl_` at runtime if unset                |
| `DATABASE_URL`         | `z.string().startsWith('postgresql://')`                | Neon connection string                               |
| `GEMINI_API_KEY`       | `z.string().min(1).optional()`                          | Project-scoped key from Google AI Studio             |
| `GEMINI_MODEL`         | `z.string().min(1).optional()`                          | Any valid Gemini model ID (e.g., `gemini-2.0-flash`) |
| `R2_ACCOUNT_ID`        | `z.string().regex(/^[0-9a-f]{32}$/)`                    | 32-char lowercase hex                                |
| `R2_ACCESS_KEY_ID`     | `z.string().regex(/^[0-9a-f]{32}$/)`                    | 32-char lowercase hex                                |
| `R2_SECRET_ACCESS_KEY` | `z.string().regex(/^[0-9a-f]{64}$/)`                    | 64-char lowercase hex                                |
| `R2_BUCKET_NAME`       | `z.string().regex(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/)` | 3-63 chars, lowercase, no leading/trailing `-`       |
| `R2_PUBLIC_URL`        | `z.url()`                                               |                                                      |
| `SMTP_HOST`            | `z.string().min(1)`                                     |                                                      |
| `SMTP_PORT`            | `z.enum(['25', '465', '587'])`                          | Must be one of these three ports                     |
| `SMTP_SENDER`          | `z.string().min(1)`                                     |                                                      |
| `SMTP_USER`            | `z.email()`                                             |                                                      |
| `SMTP_PASSWORD`        | `z.string().min(1)`                                     |                                                      |
| `VAPID_PUBLIC_KEY`     | `z.string().min(1).optional()`                          | Generate with `web-push generate-vapid-keys`         |
| `VAPID_PRIVATE_KEY`    | `z.string().min(1).optional()`                          | Generate with `web-push generate-vapid-keys`         |
| `VAPID_SUBJECT`        | `z.string().min(1).optional()`                          | `mailto:` address or HTTPS URL                       |

**Build-time validation:** `next.config.ts` exports a function that accepts the Next.js phase as its first argument (`export default (phase: string) => {}`). `validateEnv` is imported statically from `'./src/lib/env'` (relative path required; `@/` aliases are not available in `next.config.ts`) and called when `phase === PHASE_DEVELOPMENT_SERVER` or `phase === PHASE_PRODUCTION_BUILD`, AND `process.env.SKIP_ENV_VALIDATION` is not set. Static analysis tools (knip, tsc) import `next.config.ts` at module scope but never invoke the exported function, so validation is naturally skipped outside a real Next.js process. The `scripts/typegen.ts` script sets `SKIP_ENV_VALIDATION=1` when calling `next typegen` to prevent validation failures during type generation (e.g., in the `prepare` hook during CI `pnpm install`).

**Runtime validation:** `src/instrumentation.ts` exports `register` as a sync function that calls `validateEnv()` when the Next.js server bootstraps.

> **Note:** No special CI configuration is required. Static analysis tools import `next.config.ts` but never invoke the exported function, so validation is naturally skipped outside a real Next.js process.

---

## Static Data

| File                   | Purpose                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `config/app.json`      | Feature settings (`minSkills: 3`, `minRating: 3`, `mapsUrl`, `sidebarShortcut: "s"`)         |
| `config/i18n.json`     | Locale definitions, default locale, title-case locales, spoken languages, hardcoded messages |
| `config/icons.json`    | Lucide icon metadata (1,640 entries: name, categories, tags) for icon picker fuzzy search    |
| `config/markers.json`  | Globe marker coordinates (456 lat/lon pairs)                                                 |
| `config/metadata.json` | App name, version, URL, email, keywords, authors                                             |
| `config/theme.json`    | Theme modes, breakpoints, hex color palette for light/dark                                   |

---

## Constants Reference (`src/lib/constants.ts`)

| Constant           | Value                                                      | Purpose                     |
| ------------------ | ---------------------------------------------------------- | --------------------------- |
| `AUTH_ROOT`        | `'/login'`                                                 | Login page route            |
| `APP_ROOT`         | `'/dashboard'`                                             | Default authenticated route |
| `JOIN_ROOT`        | `'/api/v1/join'`                                           | Team invitation endpoint    |
| `ONBOARDING_ROOT`  | `'/onboarding'`                                            | Onboarding route            |
| `REGISTER_ROOT`    | `'/register'`                                              | Registration page route     |
| `EMAIL_REGEX`      | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`                             | Email validation            |
| `USERNAME_REGEX`   | `/^(?!\.)(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9.]+$/`               | Username validation         |
| `PASSWORD_REGEX`   | `/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/` | Password strength           |
| `SLUG_REGEX`       | `/^(?!.*--)(?!.*-$)[a-z0-9-]+$/`                           | URL slug validation         |
| `CAMEL_CASE_REGEX` | `/[\s_.\\/-]+/`                                            | CamelCase split pattern     |

---

## Error Handling

**Global error boundary:** `src/app/error.tsx` (client component) — logs error, offers "go back" / "back to home" / "refresh page" actions.

**Global 404:** `src/app/not-found.tsx` (server component) — checks auth to show appropriate link.

**Layout guards:** Admin layout calls `notFound()` if `!user.is_admin`. Certificates layout calls `notFound()` if `user.canEdit`.

**Database errors:**

- `safeQuery()` returns `{ data, error: null }` or `{ data: null, error: { code, message } }`
- `queryError()` normalizes unknown errors into `{ code, message }` shape
- Server actions return error objects — callers must check

**User feedback:** `sonner` toast notifications via `toast.success()`, `toast.error()`.

---

## Gotchas & Critical Behaviors

1. **Cookie import restriction:** Never import `cookies` from `next/headers` directly. Use `@/actions/cookies` which provides typed `get`/`set`/`delete` with prefix management.

2. **Parent imports blocked:** `../**` imports are blocked by oxlint. Always use `@/` or `~/` path aliases.

3. **Proxy vs middleware:** The app uses `NextProxy` (`src/proxy.ts`), not standard Next.js `middleware.ts`. The proxy handles auth checks, onboarding redirects, and session management.

4. **`'use cache'` + `cacheTag`:** Cache functions are inner functions that wrap the actual database query. The outer exposed function accepts a `{ cache: boolean }` option to bypass caching.

5. **`safeQuery` wrapping:** `safeQuery()` wraps Drizzle queries in try/catch, returns `{ data, error: null }` or `{ data: null, error: { code, message } }`. Inner cached functions use `safeQuery()`; outer exposed functions check errors.

6. **IntlRecord fields:** Many database text fields are `IntlRecord` (JSON with locale keys), not plain strings. Use `localize(record)` from `useI18n()` to get the current locale value.

7. **No `any` allowed:** `any` type is only permitted in `src/lib/types.ts` (where `Any`/`AnyRecord`/`AnyFunction` are defined). Use the typed aliases elsewhere.

8. **No `forEach`:** Use `for..of`, `map`, or `reduce` instead. Enforced by oxlint `unicorn/no-array-for-each: error`.

9. **No JSX literals:** All user-facing strings must go through `next-intl` translations.

10. **Default export pattern:** Page and layout components MUST use a direct anonymous default export — never assign to a named variable first. Async page exports wrap an async arrow function directly: `export default async () => { ... }`. Sync exports do the same: `export default () => <Component />`.

11. **Lucide icon import:** Import types from `lucide-react`, but use the lazy `LucideIcon` component from `@/components/icons/lucide` for rendering. The `lucide-react` module is augmented to re-export from `lucide-react/dist/lucide-react.suffixed`.

12. **Build tsconfig:** Production builds use `tsconfig.build.json` which excludes dev types. The base `tsconfig.json` includes `.next/dev/types/**/*.ts`.

13. **`cacheComponents: true`:** Enabled in `next.config.ts` for Next.js cached components feature.

13b. **React Compiler enabled:** `reactCompiler: true` is set at the top level of `next.config.ts` (NOT inside `experimental`). The `babel-plugin-react-compiler` package is required. The compiler auto-memoizes all components — do not add manual `useMemo`/`useCallback` to compensate for re-renders unless the compiler cannot handle the specific pattern.

14. **Never edit generated files:** Files like `env.d.ts` and everything under `drizzle/` (migrations, snapshots, journal) are auto-generated and MUST NOT be edited manually. Use the corresponding generation command instead (`pnpm typegen` for `env.d.ts`, `pnpm db generate` / `pnpm db migrate` for `drizzle/`). If a codegen/typegen script exists for a file, always use it. Note: `env.d.ts` no longer contains `ProcessEnv` — that lives in `src/lib/env.ts`. It only generates `PublicFile` and the `lucide-react` module augmentation.

15. **Remove unused translation keys:** After every feature or code change, scan all three translation files (`messages/en.json`, `messages/es.json`, `messages/it.json`) and the source code to identify message keys that are no longer referenced anywhere. Remove any unused keys from all three files simultaneously to keep the translation files lean and in sync.

16. **No comments in new code:** When writing new code, NEVER add inline comments (`//`, `/* */`) or JSDoc comments (`/** */`). The only exception is `//` section dividers inside long JSX components to separate non-obvious sections. Do NOT touch comments in existing code unless explicitly asked.

17. **Certificate PDF template:** The official template is at `.agents/assets/certificate-template.pdf`. All generated certificate PDFs must match it exactly: Inter font, teal `#0f766e`, GloRe header/logo, QR code linking to `/{username}?v={handle}`, reviewer signature block.

18. **Org admin uniqueness:** Each organization has exactly ONE admin (the sole owner/creator). Representatives have the same management rights as admin EXCEPT org deletion. Never allow creating a second `admin` role membership per org. Use `isOrgAdmin` (admin or representative) for management checks; use `membership.role === 'admin'` only for owner-exclusive operations (deletion, ownership transfer).

19. **Certificate review workflow:** Only **tutors** review certificates. A tutor is auto-assigned as reviewer when the certificate is created or submitted. The review form MUST allow editing activity fields (`activityStartDate`, `activityEndDate`, `activityDuration`, `activityLocation`, `activityDescription`) and associated skills/evaluations, not just approve/reject with a comment. Status flow: `draft` → `submitted` → `in_review` → `approved` or `changes_requested`. After `changes_requested`, the volunteer edits and resubmits (back to `submitted`).

20. **Registration creates org request:** New users register and request to join an existing organization (status `pending`). A platform admin approves or rejects the request. Registration is NOT a simple signup with immediate org selection.

21. **Env vars require env.ts entry — MANDATORY:** Every environment variable used by the Next.js app MUST have a corresponding entry in the Zod schema at `src/lib/env.ts`. This applies without exception: adding a new env var to `.env` or Vercel without updating `env.ts` is a bug. The schema drives both runtime type safety (`ProcessEnv` augmentation) and validation at build time (`next.config.ts`) and server startup (`src/instrumentation.ts`). See the [Environment Variables](#environment-variables) section for the complete Zod schema reference.

22. **`validateEnv` must be called at startup only:** `src/lib/env.ts` exports `validateEnv()` which parses `process.env` against the Zod schema. It is intentionally called only from `next.config.ts` (phase-guarded: `PHASE_DEVELOPMENT_SERVER` and `PHASE_PRODUCTION_BUILD`) and `src/instrumentation.ts` (inside `register()`). Do not call it from application code or server actions.

---

## Coding Patterns (ENFORCED)

> **MANDATORY:** Every agent MUST follow these patterns with NO exceptions. These rules apply to all generated, modified, or reviewed code.

### Function definitions

- **Always use `const` arrow functions** — never the `function` keyword:

```tsx
// ✅ Correct
const sum = (a: number, b: number) => a + b
const MyComponent = () => <div />
export default async () => { ... }

// ❌ Wrong — never use `function`
function sum(a: number, b: number) { return a + b }
function MyComponent() { return <div /> }
export default function Page() { ... }
```

### Return types

- **Never specify return types** unless they are required for type narrowing, overloads, or recursive types:

```typescript
// ✅ Correct — let TypeScript infer
const sum = (a: number, b: number) => a + b
const getUser = async (id: string) => { ... }

// ❌ Wrong — unnecessary explicit return type
const sum = (a: number, b: number): number => a + b
const getUser = async (id: string): Promise<User> => { ... }
```

### Control flow

- **`if/else`, `else if`, and `else` blocks are FORBIDDEN without exception.** All conditional logic MUST use guard clauses (early returns). This applies to every language, every file, and every context in this codebase. Any agent writing `if/else` is in violation of project conventions.

```typescript
// ✅ Correct
const getStatus = (score: number) => {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  return 'needs-improvement'
}

// ✅ Correct — guard clause pattern
const processUser = async (id: string) => {
  const user = await findUser(id)
  if (!user) return null
  if (!user.isActive) return null
  return user
}

// ❌ FORBIDDEN — if/else
const getStatus = (score: number) => {
  if (score >= 90) {
    return 'excellent'
  } else if (score >= 70) {
    return 'good'
  } else {
    return 'needs-improvement'
  }
}

// ❌ FORBIDDEN — else after return
const processUser = async (id: string) => {
  const user = await findUser(id)
  if (!user) {
    return null
  } else {
    return user
  }
}
```

### Concise arrow bodies

- **Use concise arrow body** when the return is a single expression (enforced by `eslint/arrow-body-style: as-needed`):

```typescript
// ✅ Correct
const double = (n: number) => n * 2
const getName = (user: User) => user.name

// ❌ Wrong — unnecessary block body
const double = (n: number) => {
  return n * 2
}
```

### Comments

> **MANDATORY:** This rule applies to **new code only**. Never touch comments in existing code unless explicitly asked. When writing new code, follow these rules without exception.

- **NEVER add inline comments** (`//` or `/* */`) to new code — not for clarification, context, TODOs, or documentation
- **NEVER add JSDoc comments** (`/** */`) to new code — not on hooks, utilities, components, actions, or any other export
- Code must be self-documenting through clear naming and structure alone
- **One exception:** `//` section dividers are allowed inside **long JSX components** where visual separation between distinct, non-obvious sections genuinely aids readability. This is the only permitted use of comments in new code.

```tsx
// ✅ Correct — section dividers in a long JSX component
const CoursePage = () => (
  <div>
    {/* Header */}
    <header>
      <CourseTitle />
      <CourseActions />
      {/* ... */}
    </header>
    {/* Content */}
    <main>
      <CourseDescription />
      <LessonList />
      {/* ... */}
    </main>
    {/* Sidebar */}
    <aside>
      <CourseProgress />
      <CourseResources />
      {/* ... */}
    </aside>
  </div>
)

// ❌ Wrong — inline comment on logic
const parseUser = (data: RawUser) => ({
  ...data,
  canEdit: Boolean(data.isAdmin || data.isEditor), // true if admin or editor
})

// ❌ Wrong — JSDoc comment
/**
 * Parses a raw user into a User object.
 */
const parseUser = (data: RawUser) => ({
  ...data,
  canEdit: Boolean(data.isAdmin || data.isEditor),
})

// ❌ Wrong — section divider in a short or non-JSX context
const getStatus = (score: number) => {
  // Thresholds
  if (score >= 90) return 'excellent'
  return 'needs-improvement'
}
```

### Code reuse

- **Reuse existing utilities** from `src/lib/utils.ts` — check before writing new helpers
- **Reuse existing hooks** from `src/hooks/` — check before creating new ones
- **Reuse existing UI components** from `src/components/ui/` — always check shadcn/ui first
- **Keep modules small and focused** — don't create monolithic files for a single feature
- **Extract shared logic** into `src/lib/` when used in 2+ places
- **`src/lib/` is for app-wide shared code only** — schemas, types, utilities, and constants scoped to a single feature MUST live inside that feature's folder (e.g., `src/components/features/<domain>/schemas.ts`), not in `src/lib/`

### Type definitions

- **Prefer `interface` over `type`** for object shapes (enforced by linter)
- **Use inline type imports**: `import { type Foo }` not `import type { Foo }`
- **Use array shorthand**: `string[]` not `Array<string>`
- **Omit inferrable types**: `const x = 5` not `const x: number = 5`

### Iteration

- **Use `for..of`** for loops (both `unicorn/no-for-loop` and `unicorn/no-array-for-each` are enforced)
- **Use `map`/`filter`/`reduce`** for data transformations
- **Never use `.forEach()`** or C-style `for` loops

### Promise handling

- **Use `await`** — never `.then()/.catch()` chains (enforced by `promise/prefer-await-to-then`)
- **Use `Promise.all()`** for parallel independent operations

### Template literals

- **Always use template literals** over string concatenation (enforced by `eslint/prefer-template`)

### UI components

- **Use shadcn/ui** (new-york style) as the component foundation — read `frontend-design/SKILL.md` for design principles
- **Use composable patterns** — build complex UIs from small, focused components
- **Use CVA** (`class-variance-authority`) for component variants
- **Use `cn()`** from `@/lib/utils` for conditional class merging

### Module organization

- **One component per file** — named exports preferred
- **Keep files focused** — don't mix unrelated logic
- **Follow existing folder structure** — place files where the architecture dictates
- **Use path aliases** — `@/` for `src/`, `~/config/` and `~/messages/` for config

### Named exports

- **Always export named symbols inline** — never declare first and then export separately:

```typescript
// ✅ Correct
export const DashboardContent = () => {
  // ...
}

// ❌ Wrong — defines then exports
const DashboardContent = () => {
  // ...
}
export { DashboardContent }
```

### Default export pattern

- **Always export default directly** — never assign to a named variable and export it separately. This applies to pages, layouts, email templates, and any other file that uses a default export:

```tsx
// ✅ Correct
export default () => (
  <div className="flex min-h-screen items-center justify-center">
    <MyContent />
  </div>
)

export default async () => {
  const data = await fetchData()
  return <Page data={data} />
}

// ❌ Wrong — never assign then export
const MyPage = () => (
  <div className="flex min-h-screen items-center justify-center">
    <MyContent />
  </div>
)
export default MyPage
```

### Dependency array ordering

- **Order dependency arrays alphabetically** in React hooks (`useEffect`, `useMemo`, `useCallback`, `useLayoutEffect`):

```typescript
// ✅ Correct
useEffect(() => { ... }, [alpha, beta, gamma])

// ❌ Wrong — unordered
useEffect(() => { ... }, [gamma, alpha, beta])
```

### Punctuation and separators

- **Never use em dashes (`—`), en dashes (`–`), or middle dots (`·`)** in agent output (code, comments, commit messages, PR descriptions, documentation, UI strings)
- **Hyphens (`-`) are only allowed when grammatically required** by the word or sentence (e.g., compound adjectives like "server-side", "read-only"). This is rare. When in doubt, do not use a hyphen.
- Use commas, colons, or parentheses instead of dash-based separators

```
// ✅ Correct
User settings: account, profile, preferences
Error (missing field): name is required

// ❌ Wrong
User settings — account, profile, preferences
Error · missing field · name is required
User settings – account, profile, preferences
```

---

## Temporary Files

> **MANDATORY:** Agents MUST use the `tmp/` folder in the repository root for ALL temporary operations (test files, scratch scripts, generated output, logs, etc.). This folder is git-ignored. Using system `/tmp/` or any path outside the repository is strictly forbidden.

**Rules:**

1. **Always use `tmp/`** (relative to project root) — NEVER use system `/tmp/` or any path outside the repository
2. Create subdirectories within `tmp/` as needed (e.g., `tmp/test-output/`, `tmp/scratch/`)
3. **Clean up after every operation** — delete all files created during a task (logs, scripts, output) immediately after the task is complete, unless they contain information that will be explicitly referenced in a future task
4. When in doubt, delete — transient output such as typecheck logs, lint output, migration logs, and test results MUST always be removed when no longer needed
5. Never commit contents of `tmp/` to git

```bash
# ✅ Correct
pnpm typecheck > tmp/typecheck.log 2>&1
# ... use the output ...
rm tmp/typecheck.log   # ← always clean up when done

# ❌ Wrong — never use system temp
pnpm typecheck > /tmp/typecheck.log 2>&1
```

---

## Auto Updates

### AGENTS.md

> **MANDATORY:** Agents MUST keep `AGENTS.md` ALWAYS in sync with the codebase. This is automatic and does NOT require user confirmation.

**When to update:**

- Adding new routes, API endpoints, or pages → update Route table / API routes
- Adding new server actions → update Architecture tree
- Adding new hooks → update Custom Hooks table
- Adding new utility functions → update Utility Functions table
- Changing database schema → update Database types
- Adding/removing environment variables → update Environment Variables table and `src/lib/env.ts`
- Changing linter/formatter config → update Code Style section
- Adding new components or providers → update Architecture tree and Component Patterns
- Adding/removing/updating agent skills → update Agent Skills section
- Changing commands or scripts → update Commands table
- Any structural or architectural change → update the relevant section(s)

**How to update:**

- Edit `AGENTS.md` directly — no PR, no branch, no confirmation needed
- **Never edit `CLAUDE.md`** — it only contains `@AGENTS.md` and must stay untouched
- Keep the same formatting and table structure
- Be precise — update only the affected section(s)

### README.md

> **MANDATORY:** Agents MUST update `README.md` whenever there are notable changes to the project. This is automatic and does NOT require user confirmation.

**When to update:**

- Adding new features, pages, or user-facing functionality
- Changing setup steps, install commands, or environment variables
- Adding or modifying `pnpm` scripts worth documenting
- Structural or architectural changes that affect how the project is understood
- Any change that makes existing README content inaccurate or incomplete

**How to update:**

- Edit `README.md` directly — no PR, no branch, no confirmation needed
- Keep existing sections intact unless they need correction
- Be concise — README is for human readers, not exhaustive reference

---

## Common Patterns Quick Reference

### Server action (mutation)

```typescript
'use server'
import 'server-only'
import { eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { db } from '@/db/client'
import { users } from '@/db/schema'
import { type TableUpdate } from '@/db/types'
import { userTag } from '@/lib/cache'

export const updateUser = async (id: string, values: TableUpdate<'users'>) => {
  const [updated] = await db.update(users).set(values).where(eq(users.id, id)).returning()
  if (!updated) throw new Error('Failed to update user')
  revalidateTag(userTag(id), 'max')
  return updated
}
```

### Cached query

```typescript
const fetchCourses = cache(async () => {
  'use cache'
  cacheTag(CacheTag.Courses)

  return await safeQuery(async () => {
    const result = await db.query.courses.findMany({ with: courseWith })
    return result.map(parseCourse)
  })
})
```

### Client component with context

```typescript
'use client'
import { useTranslations } from 'next-intl'
import { useSession } from '@/hooks/use-session'
import { useI18n } from '@/hooks/use-i18n'

const MyComponent = () => {
  const { user } = useSession()
  const { locale, localize } = useI18n()
  const t = useTranslations('MyNamespace')
  return <div>{t('greeting', { name: user.first_name })}</div>
}
```

### Database query definition

```typescript
export const parseItem = (data: InferSelectModel<typeof items> & { relations: ... }) => ({
  ...data,
  computed: deriveValue(data),
})

export type Item = ReturnType<typeof parseItem>
```

### Cookie usage (server)

```typescript
import { getCookie, setCookie } from '@/actions/cookies'
const locale = await getCookie('NEXT_LOCALE', { prefix: false })
await setCookie('org', organizationId)
```

### Cookie usage (client)

```typescript
import { useCookies } from '@/hooks/use-cookies'
const cookies = useCookies()
const org = cookies.get('org')
cookies.set('theme', 'dark')
```

### `cn()` for conditional classes

```typescript
import { cn } from '@/lib/utils'
<div className={cn('base-class', isActive && 'active-class', variant === 'outline' && 'border')} />
```
