# Implementation Review Design

**Date:** 2026-03-22
**Status:** Approved

## Problem

The GloRe codebase has grown substantially across multiple feature sprints with no formal cross-cutting review. While individual features are functional, there may be accumulated issues in code organization, performance, security, scalability, and developer experience that have not been systematically examined. This spec defines a structured approach to produce a comprehensive, actionable review of the entire codebase and infrastructure.

## Goal

Produce a ranked, actionable implementation review report covering all engineering dimensions, then populate the ship roadmap with the resulting improvement tasks.

## Scope

Everything: the Next.js application (`src/`), database schema and queries, server actions, infrastructure configuration (Vercel, Cloudflare R2, Neon), environment variable management, and developer tooling.

## Approach

Seven specialized sub-agents run in parallel, each focused on a single review domain. A final aggregation agent merges their findings into a single structured report.

## Review Domains

| Agent         | Domain                        | Examines                                                                              |
| ------------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| `features`    | Feature completeness and UX   | Missing features, incomplete flows, UX rough edges, untested edge cases               |
| `performance` | Client and server performance | Bundle size, RSC/Suspense patterns, caching strategy, slow or inefficient queries     |
| `code-org`    | Code organization             | File structure, module boundaries, naming conventions, coupling, oversized files      |
| `scalability` | Scalability                   | DB schema design, query efficiency, cache invalidation patterns, server action design |
| `security`    | Security and auth             | Auth configuration, cookie security, input validation, exposed secrets, RBAC gaps     |
| `dx`          | Developer experience          | Linting config, TypeScript strictness, test coverage gaps, tooling improvements       |
| `infra`       | Infrastructure                | Vercel config, R2 setup, Neon configuration, env var validation, deployment pipeline  |

## Finding Format

Each agent outputs findings in this structure:

```
- area: <domain>
- severity: critical | high | medium | low
- title: short one-line description
- detail: what the problem is and why it matters
- suggestion: concrete fix or improvement with enough detail to act on
```

Each agent writes its findings to `tmp/review-<domain>.md`. The aggregation agent reads all seven files, deduplicates, and generates a unique kebab-case `slug` for each finding derived from its title (e.g., "Missing rate limiting on auth routes" → `missing-auth-rate-limiting`).

## Output

**Report file:** `.agents/reviews/YYYY-MM-DD-implementation-review.md`

Structure:

- Summary section: counts per severity across all domains
- Findings grouped by domain, sorted by severity within each group
- Each finding has a unique kebab-case slug for roadmap reference

**Roadmap update:** After the user approves the report, actionable findings are added to `.agents/skills/ship/references/roadmap.md` under the appropriate priority tier (`P0`-`P3`), using the finding slug as the task slug. The aggregation agent must inspect the existing roadmap file to match its table format exactly before writing entries.

## Execution Flow

1. Launch all 7 domain agents simultaneously
2. Each agent explores relevant source files, configs, and patterns
3. Once all complete, a general-purpose aggregation agent:
   - Reads all 7 outputs
   - Deduplicates overlapping findings
   - Resolves severity conflicts
   - Writes the final report
4. Commit the report to git
5. User reviews the report
6. On approval, populate the ship roadmap

## Success Criteria

- Every finding includes a concrete, actionable suggestion
- No finding is duplicated across domains
- Severity ratings are justified, not inflated
- Report is self-contained: a developer can act on any finding without additional context
- Roadmap items are properly prioritized (critical/high as P0-P1, medium as P2, low as P3)
