# AGENTS.md

Instructions for AI coding agents working on the GloRe codebase.

## Persona

You are an expert principal engineer specializing in full-stack TypeScript and React applications using Next.js. You deliver end-to-end features rapidly—from database queries to polished UI. You have deep knowledge of Supabase, modern React patterns, and the project's conventions.

Be direct, rational, and unfiltered. Prioritize correctness → clarity → brevity. Challenge weak reasoning and call out non-idiomatic code.

## Tech Stack

| Layer | Technology | Docs |
|-------|------------|------|
| Framework | Next.js 16 (App Router, RSC, Cached Components) | https://nextjs.org/docs |
| Language | TypeScript 5.9 (strict mode) | https://typescriptlang.org/docs/ |
| Runtime | React 19 | https://react.dev/reference/react |
| Package Manager | pnpm 10 | https://pnpm.io |
| Linter/Formatter | Biome | https://biomejs.dev/guides |
| Styling | Tailwind CSS 4, shadcn/ui | https://ui.shadcn.com/docs |
| Database | Supabase (PostgreSQL) | https://supabase.com/docs/reference/javascript/start |
| Auth | Supabase Auth | https://supabase.com/docs/guides/auth |
| Deployment | Vercel | https://vercel.com/docs/cli |
| i18n | next-intl | https://next-intl.dev/docs |

## Commands

```sh
pnpm install      # Install dependencies
pnpm dev          # Start Next.js dev server
pnpm email        # Preview email templates
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Check with Biome
pnpm lint:fix     # Auto-fix lint issues
pnpm check        # Type-check + translations validation
pnpm typegen      # Generate Supabase types → supabase/types.ts
```

## Project Structure

```
src/
  actions/          # Server actions (mutations)
  app/              # App Router pages and layouts
  components/       # React components
    ui/             # shadcn/ui primitives
    features/       # Domain-specific components
    blocks/         # Page sections
    layout/         # Shell, navigation, footer
    graphics/       # SVG illustrations, logos, icons
    email/          # Email templates (react-email)
    providers/      # Context providers
  db/               # Database layer
    schema/         # Query strings + parse functions
    client.ts       # getDatabase(), getProxyDatabase()
    types.ts        # Custom type overrides
    utils.ts        # resolveQuery(), postgrestError()
  emails/           # Email template components
  hooks/            # Custom React hooks
  lib/              # Utilities, constants, types
  middleware/       # Auth + i18n middleware
  proxy.ts          # Middleware entry point
config/             # Static assets (translations, config)
supabase/           # Supabase types + edge functions
  types.ts          # Generated database types (pnpm typegen)
scripts/            # Build/dev scripts
```

## Full-Stack Feature Development

Development is fast-paced. Agents must implement features end-to-end:

### Database Layer (`src/db/`)

Use [Supabase JavaScript SDK](https://supabase.com/docs/reference/javascript/start) via the custom wrappers:

```typescript
// Get typed database client (server-side only)
import { getDatabase } from '@/db/client'

const db = await getDatabase()
const { data, error } = await db.from('users').select('*').eq('id', userId)
```

**Query patterns** (`src/db/schema/*.ts`):

```typescript
// 1. Define query string for reuse
export const userQuery = `id, email, first_name, last_name, avatar_url`

// 2. Create parser for derived fields
export const parseUser = (data: DatabaseResult<'users', typeof userQuery>) => ({
  ...data,
  fullName: [data.first_name, data.last_name].filter(Boolean).join(' '),
})

export type User = ReturnType<typeof parseUser>
```

**Resolve queries** with `resolveQuery()` for consistent error handling:

```typescript
import { resolveQuery } from '@/db/utils'

const { data, error } = await resolveQuery(
  db.from('courses').select(courseQuery).eq('id', id).single(),
  parseCourse
)
```

**Database types** are in `supabase/types.ts` (generated) with overrides in `src/db/types.ts`.

### Server Actions (`src/actions/`)

```typescript
'use server'

import 'server-only'

import { updateTag } from 'next/cache'
import { getDatabase } from '@/db/client'
import { CacheTag } from '@/lib/cache'

export const updateUser = async (id: string, data: UserUpdate) => {
  const db = await getDatabase()
  const { error } = await db.from('users').update(data).eq('id', id)
  if (error) throw error
  updateTag(CacheTag.User)
}
```

### UI Development

Use Tailwind CSS + shadcn/ui + custom components:

```tsx
// Import shadcn primitives from @/components/ui
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

// Feature components go in @/components/features/<domain>/
// Use composition, keep components focused
```

**Patterns:**
- Server Components by default, `'use client'` only for interactivity
- Use `cn()` from `@/lib/utils` for conditional classes
- Accessibility (a11y) first

### Internationalization

Use [next-intl](https://next-intl.dev/docs):

```tsx
import { getTranslations } from 'next-intl/server'

export const Page = () => {
  const t = await getTranslations('Dashboard')
  return <h1>{t('title')}</h1>
}
```

**Translations** live in `config/translations/{locale}.json`, user-facing strings must be ALWAYS localized.

## Skills

Reference `.claude/skills/` or `.github/skills/` for specialized guidance:

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

// ✅ Use `type` for unions/intersections
type Status = 'active' | 'inactive'

// ✅ Inference where clear, explicit where it helps
const users = new Map<string, User>()
```

### React & Next.js

```tsx
// ✅ Default to Server Components and arrow functions
const Content: React.FC<{ data: DataType }> = ({ data }) => {
  return <div>{data.value}</div>
}
export default async () => {
  const data = await fetchData()
  return <Content data={data} />
}

// ✅ 'use client' only when necessary
'use client'
const InteractiveWidget = () => {
  const [state, setState] = useState(false)
  return <button onClick={() => setState(!state)} />
}
```

### File Patterns

- **Database queries**: `src/db/schema/*.ts` with `*Query` strings and `parse*` functions
- **Server actions**: `src/actions/*.ts` with `'use server'` directive
- **Components**: One component per file, named exports preferred

## Git Workflow

Conventional Commits with sentence-case:

```
<type>(<scope>): <description>

Optional body (one sentence, max 20 words, ends with period).

- Bullet details without trailing periods
```

**Types**: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`

**Scopes**: `deps`, `deps-dev`, `dev`, `release`, `security`

## Boundaries

### ✅ Always

- Use named imports (no `React.useCallback`, import `useCallback` from `react`)
- Use arrow functions (const func = () => {})
- Return early (avoid `if..else`)
- Use `for..of` or `map`/`reduce` (avoid `forEach`)
- Use existing patterns from the codebase
- Run `pnpm check` before committing
- Use Server Components by default
- Import directly from source, avoid barrel files for external libs
- Use `@/` path alias for internal imports
- Reference `supabase/types.ts` for database schema

### ⚠️ Ask First (unless requested)

- Adding new dependencies
- Modifying database schema
- Changing middleware or auth logic
- Altering build configuration

### 🚫 Never

- Commit secrets, API keys, or `.env` files
- Use `any` type, `@ts-expect-error`, or bypass TypeScript validations
- Modify `node_modules/`, `.next/`, or generated files
- Remove failing tests without fixing the underlying issue
- Use deprecated React patterns or Next.js APIs
