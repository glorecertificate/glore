# Agent Skills Reference

Full configuration and management details for agent skills in the GloRe Certificate project.

---

## Setup

```bash
pnpm skills                           # Install all skills from skills-lock.json
skills add <owner/repo>               # Install a new external skill
skills list                           # List installed skills
skills --help                         # Show all CLI commands
```

---

## Installed skills

| Skill                                 | Source                        | Purpose                                                            | When to use                                                                         |
| ------------------------------------- | ----------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `better-auth-best-practices`          | `better-auth/skills`          | Better Auth server/client setup, plugins, sessions                 | When configuring auth, adding plugins, or setting up email/password authentication  |
| `better-auth-security-best-practices` | `better-auth/skills`          | Rate limiting, CSRF, secrets, session hardening                    | When securing auth, preventing brute force, or hardening a Better Auth deployment   |
| `email-and-password-best-practices`   | `better-auth/skills`          | Email verification, password reset, hashing policy                 | When implementing login/sign-up flows, password security, or email verification     |
| `frontend-design`                     | `anthropics/skills`           | Production-grade UI design with bold aesthetics                    | **ALWAYS** when building/styling UI components, pages, layouts                      |
| `neon-drizzle`                        | `neondatabase/ai-rules`       | Drizzle ORM + Neon database setup                                  | When creating/modifying schemas, migrations, or database configuration              |
| `neon-postgres`                       | `neondatabase/agent-skills`   | Neon Serverless Postgres best practices                            | When working with database queries, branching, or Neon platform features            |
| `vercel-react-best-practices`         | `vercel-labs/agent-skills`    | 58 performance optimization rules for React/Next.js                | **ALWAYS** when writing/reviewing React components, data fetching, or Next.js pages |
| `web-design-guidelines`               | `vercel-labs/agent-skills`    | Web Interface Guidelines compliance review                         | When reviewing UI accessibility, UX patterns, or design compliance                  |
| `email-best-practices`                | `resend/email-best-practices` | Email deliverability, compliance, transactional/marketing patterns  | **ALWAYS** when creating or modifying email templates in `src/emails/`              |
| `react-email`                         | `resend/react-email`          | react-email components, styling, i18n, and sending patterns        | **ALWAYS** when creating or modifying email templates in `src/emails/`              |
| `cloudflare`                          | `cloudflare/skills`           | Cloudflare Workers, Pages, D1, R2, KV, AI, WAF, Tunnel, Terraform  | When working with Cloudflare APIs, services, or infrastructure                      |
| `agents-md`                           | custom                        | Update AGENTS.md via `/agents-md <instruction>`                    | When adding rules, syncing with codebase, or performing major AGENTS.md updates     |
| `skill-creator`                       | `anthropics/skills`           | Create and optimize skills; run evals and measure performance      | When creating, editing, or optimizing agent skills for this project                 |
| `commit`                              | custom                        | Finalize and commit staged changes using conventional commits      | After completing a feature, before merging to main                                  |
| `release`                             | custom                        | Controlled release workflow: preview, confirm, publish             | When cutting a release (`/release`)                                                 |
| `shadcn`                              | `shadcn/ui`                   | Manages shadcn components and projects                             | When adding, modifying, or debugging shadcn/ui components                           |

---

## Superpowers workflow skills

These skills define the full superpowers development workflow. Invoke them at the right phase.

> **Priority:** AGENTS.md rules and user instructions ALWAYS take precedence over workflow skill instructions.

| Skill                            | Purpose                                                                                        | When to invoke                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `brainstorming`                  | Socratic design refinement; saves spec to `.agents/specs/`                                     | Complex or ambiguous feature design (Phase 2: Plan)                            |
| `dispatching-parallel-agents`    | Concurrent subagent workflows for multiple independent problems                                | Independent sub-problems (Phase 3: Implement); codebase audit (`scan` command) |
| `executing-plans`                | Batch plan execution with human checkpoints                                                    | Executing a written plan in a parallel session (Phase 3: Implement)            |
| `finishing-a-development-branch` | Verify tests, present merge/PR/discard options, clean up worktree                              | After Phase 5: merge/PR/discard decision                                       |
| `receiving-code-review`          | Technical evaluation of review feedback; verify before implementing                            | When code review feedback is received                                          |
| `requesting-code-review`         | Dispatch code-reviewer subagent with precise context (git SHAs + requirements)                 | After completing a task (Phase 5: Complete)                                     |
| `subagent-driven-development`    | Fresh subagent per task with two-stage review (spec compliance, then code quality)              | Executing implementation plans in the current session (Phase 3: Implement)     |
| `systematic-debugging`           | 4-phase root cause process: reproduce, localize, identify root cause, verify fix               | Bug, test failure, or unexpected behavior (Phase 3: Implement)                 |
| `test-driven-development`        | RED-GREEN-REFACTOR: write failing test, watch it fail, pass with minimal code                  | Any feature or bug fix implementation (Phase 3: Implement)                     |
| `using-git-worktrees`            | Isolated workspace per feature branch with safety verification                                 | Feature branch isolation (before Phase 2: Plan)                                |
| `using-superpowers`              | Overview of the superpowers workflow system                                                     | When orienting to the superpowers system or onboarding to the workflow         |
| `verification-before-completion` | Run verification commands and confirm output before making any success claim                   | Before any completion claim (Phase 4: Verify)                                  |
| `writing-plans`                  | Bite-sized tasks (2-5 min each) with file paths, code, verify steps; saves to `.agents/plans/` | Large features needing a detailed plan (Phase 2: Plan)                         |
| `writing-skills`                 | Create and test new skills following agentskills.io best practices                             | When creating or improving agent skills                                        |

---

## Creating custom skills

Custom skills can be created in `.agents/skills/` following the [Agent Skills format](https://agentskills.io):

1. Create a folder in `.agents/skills/<skill-name>/` with at minimum a `SKILL.md` file
2. The `SKILL.md` must have YAML frontmatter with `name` and `description` fields
3. **To track a custom skill in git:** Add `!<skill-name>` to `.agents/skills/.gitignore` (external skills installed via `skills` CLI are gitignored by default; only custom skills need explicit tracking)
4. If an agent creates a custom skill, it MUST ask the user whether to track it in git, and if yes, add the exclusion to `.agents/skills/.gitignore`

---

## Gitignore enforcement

The `.agents/skills/.gitignore` file controls which skills are tracked in git:

- **External skills** (listed in `skills-lock.json`) MUST NOT be tracked. They behave like `node_modules`.
- **Custom skills** (created by the user or an agent, NOT in `skills-lock.json`) MUST be added as exceptions (`!<skill-name>`) to be tracked.

Before adding any skill to `.gitignore`, always check `skills-lock.json`. If the skill appears there, it is external and must remain ignored.

```gitignore
# CORRECT
/*/
!agents-md
!commit
!release

# WRONG (external skills must not be exceptions)
/*/
!better-auth-best-practices
!shadcn
```

---

## Skills directory structure

```
.agents/
└── skills/
    ├── .gitignore                            # Ignores all folders; add !<name> to track custom skills
    ├── agents-md/                            # AGENTS.md update skill (custom, git-tracked)
    ├── commit/                               # Commit workflow skill (custom, git-tracked)
    ├── release/                              # Release workflow skill (custom, git-tracked)
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
    ├── web-design-guidelines/                # Web Interface Guidelines (external)
    ├── writing-plans/                        # Implementation plan creation (external, workflow)
    └── writing-skills/                       # New skill creation workflow (external, workflow)
```
