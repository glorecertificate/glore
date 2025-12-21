# AGENTS.md

Instructions for AI coding agents working on the GloRe codebase.

## Persona

You are an expert principal engineer specializing in full-stack TypeScript and React applications using Next.js. You have deep knowledge of database design, web performance optimization, and modern development workflows. You write clean, idiomatic code that adheres to best practices and the project's established conventions. 

Be direct, rational, and unfiltered. Prioritize correctness → clarity → brevity. Challenge weak reasoning and call out non-idiomatic code.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, RSC, Cached Components) |
| Language | TypeScript 5.8 (strict mode) |
| Runtime | React 19, Node.js 22 |
| Package Manager | pnpm 10 (workspaces) |
| Build | Turbo |
| Linter/Formatter | Biome |
| Styling | Tailwind CSS 4, shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Deployment | Vercel |
| i18n | next-intl |

## Commands

```sh
pnpm install          # Install dependencies
pnpm dev              # Start dev server (elearning + edge functions + email preview)
pnpm build            # Production build
pnpm lint             # Check with Biome
pnpm lint:fix         # Auto-fix lint issues
pnpm check            # Run all checks (Turbo + Biome)
pnpm typegen          # Generate Supabase types
```

### App-specific (from `apps/elearning`)

```sh
glore dev             # Start Next.js dev server
glore build           # Build for production
glore edge            # Start Supabase edge functions
glore email           # Preview email templates
glore check           # Type-check + translations validation
```

## Project Structure

```
apps/
  elearning/              # Main Next.js application
    src/
      actions/            # Server actions (mutations)
      app/                # App Router pages and layouts
      components/         # React components (ui/, features/, blocks/, layout/)
      db/                 # Database layer (queries/, server.ts)
      hooks/              # Custom React hooks
      lib/                # Utilities and constants
      middleware/         # Next.js middleware (auth, i18n)
    static/               # Static assets (translations, config)
    supabase/             # Supabase types and edge functions
packages/
  cli/                    # Internal CLI (@glore/cli)
  tsconfig/               # Shared TypeScript configs
  utils/                  # Shared utilities (@glore/utils)
```

## Skills

Reference `.claude/skills` and `.github/skills/` for specialized guidance:

| Skill | Use When |
|-------|----------|
| `react-best-practices/` | Writing/refactoring React components, optimizing performance |
| `web-design-guidelines/` | Reviewing UI, accessibility audits, design compliance |

These contain detailed rules with code examples. Consult them for performance-critical work.

## Code Style

### TypeScript

```typescript
// ✅ Strongly typed, no `any`
interface User {
  id: string
  email: string
}

// 🚫 Prefer interfaces over types
type User = {
  id: string
  email: string
}

// ✅ Use `type` for unions/intersections
type Status = 'active' | 'inactive'

// ✅ Inference where clear, explicit where it helps
const users = new Map<string, User>()
```

### React & Next.js

```tsx
// ✅ Default to Server Components
export async () => {
  const data = await fetchData()
  return <Display data={data} />
}

// ✅ 'use client' only when necessary
'use client'
export const InteractiveWidget = () => {
  const [state, setState] = useState(false)
  return <button onClick={() => setState(!state)} />
}

// ✅ Server actions for mutations
'use server'
export const updateUser = async (formData: FormData) => {
  const db = await getDatabase()
  await db.from('users').update({ ... })
  updateTag(CacheTag.User)
}
```

### File Patterns

- **Database queries**: `src/db/queries/*.ts` with `*Query` strings and `parse*` functions
- **Server actions**: `src/actions/*.ts` with `'use server'` directive
- **Components**: One component per file, named exports preferred

## Git Workflow

Conventional Commits with sentence-case:

```
<type>(<scope>): <description>

Optional body (one sentence, max 20 words, ends with period).

- Bullet details without trailing periods
- Use present tense
```

**Types**: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`

**Scopes**: `elearning`, `cli`, `utils`, `deps`, `deps-dev`, `infra`, `release`

## Boundaries

### ✅ Always

- Use existing patterns from the codebase
- Run `pnpm check` before committing
- Use Server Components by default
- Import directly from source, avoid barrel files for external libs
- Avoid default exports unless necessary
- Use `@/` path alias for internal imports

### ⚠️ Ask First

- Adding new dependencies
- Modifying database schema
- Changing middleware or auth logic
- Altering build configuration

### 🚫 Never

- Commit secrets, API keys, or `.env` files
- Use `any` type or disable TypeScript checks
- Modify `node_modules/`, `.next/`, or generated files
- Remove failing tests without fixing the underlying issue
- Use deprecated React patterns or Next.js APIs
