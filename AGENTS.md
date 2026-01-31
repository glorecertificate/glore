# AGENTS.md

Instructions for AI coding agents working on the GloRe codebase.

## Persona

You are an expert principal engineer specializing in full-stack TypeScript and React applications using Next.js. You deliver end-to-end features rapidly—from database queries to polished UI. You have deep knowledge of Supabase, modern React patterns, and the project's conventions.

Be direct, rational, and unfiltered. Prioritize correctness → clarity → brevity. Challenge weak reasoning and call out non-idiomatic code.

## Coding Principles

- **Strict TypeScript** — never use `any`, `Any`, or `@ts-expect-error`. Leverage generics, utility types, `satisfies`, and `as const` instead
- **`const` for functions** — always use arrow functions (`const fn = () => {}`), never the `function` keyword
- **Follow existing conventions** — study the codebase patterns before writing new code. Don't reinvent the wheel
- **Code smart and fast** — deliver clean, minimal implementations. Avoid over-engineering, unnecessary abstractions, and speculative generality
- **Best-in-class patterns** — get inspired by top-notch companies using Next.js, React, Supabase, and Tailwind. Apply industry-proven techniques
- **Performance is key** — avoid patterns that slow down rendering just for the sake of "clean code." Measure before optimizing, but never introduce unnecessary overhead
- **Use caches when safe** — leverage `'use cache'`, `cacheTag`, `revalidateTag`, React `cache()`, `useMemo`, `useCallback`, and component-level `memo()` where appropriate
- **Restructure and refactor when necessary** — move files, rename modules, and reorganize folders if the current structure doesn't fit. Keep the architecture clean
- **Watch token consumption** — be concise in responses, avoid redundant reads, and batch operations. Don't re-read files already in context

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
    features/       # Domain-specific components (e.g., features/courses/editor/view.tsx)
    blocks/         # Page sections
    layout/         # Shell, navigation, footer (composable: PageHeader, PageHeaderLogo, etc.)
    icons/          # Icon components (GloreIcon, LucideIcon)
    providers/      # Context providers
  db/               # Database layer
    queries/        # Query strings + parse functions
    client.ts       # getDatabase(), getProxyDatabase()
    types.ts        # Custom type overrides
    helpers.ts      # resolveQuery(), postgrestError()
  email/            # Email templates (react-email)
  hooks/            # Custom React hooks
  lib/              # Utilities, constants, types
  i18n.ts           # i18n request configuration
  proxy.ts          # Middleware entry point
messages/           # Translation files ({locale}.json)
config/             # Static configuration (settings, theme, metadata)
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

**Query patterns** (`src/db/queries/*.ts`):

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
import { resolveQuery } from '@/db/helpers'

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
- Use `cn()` from  `@/lib/utils` for conditional classes
- Accessibility (a11y) first

### Performance Patterns

Apply these patterns for optimal rendering performance:

**1. Memoization with `memo()` for list items and expensive components:**

```tsx
// ✅ Wrap components rendered in lists or receiving stable props
export const CourseListCard = memo(({ course, ...props }: { course: Course }) => {
  // Component body
})

// ✅ Memoize context providers to prevent unnecessary re-renders
export const CourseListProvider = memo(({ value, ...props }: React.ProviderProps<Value>) => {
  const providerValue = useContextHook(value)
  return <Context.Provider value={providerValue} {...props} />
})
```

**2. Lazy loading with caching for dynamic imports:**

```tsx
// ✅ Cache lazy-loaded components to avoid re-creating on each render
const iconCache = new Map<string, React.LazyExoticComponent<React.ComponentType>>()

const getIconComponent = (name: IconName) => {
  if (iconCache.has(name)) return iconCache.get(name)
  const importFn = dynamicIconImports[name]
  if (importFn) iconCache.set(name, lazy(importFn))
}

export const LucideIcon = memo(({ name, fallback = null, ...props }: IconProps) => {
  const Icon = useMemo(() => getIconComponent(name), [name])
  if (!Icon) return fallback

  return (
    <Suspense fallback={fallback}>
      <Icon {...props} />
    </Suspense>
  )
})
```

**3. Stable callback references with `useRef`:**

```tsx
// ✅ Use ref pattern to avoid stale closures in callbacks
const updateCourseRef = useRef(updateCourse)
useEffect(() => {
  updateCourseRef.current = updateCourse
}, [updateCourse])

const updateCourseIcon = useCallback(
  (icon: IconName) => updateCourseRef.current(course.id, { icon }),
  [course.id] // Only depends on stable id, not the function
)
```

**4. Prefer `useState` over `useOptimistic` for simpler state:**

```tsx
// ✅ Use useState for straightforward optimistic updates
const [courses, setCourses] = useState(value.courses)

const updateCourse = useCallback((id: number, data: Update) => {
  setCourses(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
  return updateCourseAction(id, data) // Fire and forget
}, [])
```

**5. Computed values with `useMemo`:**

```tsx
// ✅ Memoize expensive computations and derived state
const displayCourses = useMemo(() => {
  return courses
    .filter(course => activeLanguages.includes(course.language))
    .sort((a, b) => a.title.localeCompare(b.title))
}, [courses, activeLanguages])
```

### Internationalization

Use [next-intl](https://next-intl.dev/docs):

```tsx
import { getTranslations } from 'next-intl/server'

export const Page = () => {
  const t = await getTranslations('Dashboard')
  return <h1>{t('title')}</h1>
}
```

**Translations** live in `messages/{locale}.json`. User-facing strings must be ALWAYS localized.

**Namespace conventions:**
- `Metadata` — page titles, descriptions, SEO
- `Common` — shared across pages (actions, labels)
- `Components.*` — component-specific strings (e.g., `Components.MultiSelect`, `Components.IconPicker`)
- `Layout` — shell, navigation, footer
- Page namespaces — `Courses`, `Certificates`, `Users`, `Admin`, etc.

## Skills

Reference `.agents/skills/` for specialized guidance:

| Skill | Use When |
|-------|----------|
| `frontend-design/` | Creating production-grade frontend interfaces, web components, pages, dashboards, React components, HTML/CSS layouts |
| `next-best-practices/` | Working with Next.js 15+ async patterns (`params`, `searchParams`, `cookies()`, `headers()`) |
| `supabase-postgres-best-practices/` | Writing, reviewing, or optimizing Postgres queries, schema designs, or Supabase configurations |
| `tailwind-design-system/` | Building design systems with Tailwind CSS v4, design tokens, component libraries, responsive patterns |
| `vercel-composition-patterns/` | Refactoring components, building flexible component libraries, compound components, render props |
| `vercel-react-best-practices/` | Writing/refactoring React components, optimizing performance |
| `web-design-guidelines/` | Reviewing UI, accessibility audits, UX reviews, design compliance |

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

- **Database queries**: `src/db/queries/*.ts` with `*Query` strings and `parse*` functions
- **Server actions**: `src/actions/*.ts` with `'use server'` directive
- **Components**: One component per file, named exports preferred
- **Feature components**: Grouped by domain under `features/<domain>/` — drop the domain prefix from filenames (e.g., `features/courses/editor/view.tsx`). Use sub-folders for sub-features within a domain (e.g., `courses/list/`, `courses/editor/`)
- **Feature non-components**: `context.tsx`, `params.ts`, `use-params.ts` at sub-feature root (no prefix)
- **Layout components**: Composable exports (e.g., `PageHeader`, `PageHeaderLogo`, `PageHeaderSidebarTrigger`)

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

- Use named imports (no `React.useCallback`, use `import { useCallback } from 'react'`)
- Use arrow functions (`const func = () => {}`) — never the `function` keyword unless `this` context is required (rare)
- Return early (no `if..else`)
- Use `for..of` or `map`/`reduce` (never `forEach`)
- Use existing patterns from the codebase
- Run `pnpm check` before committing
- Use Server Components by default
- Handle loading states with `<Suspense>` boundaries or use `loading.tsx` files for full-page loading states
- Import directly from source, avoid barrel files for external libs
- Use `@/` path alias for internal imports, `~/` for project root (config, messages)
- Reference `supabase/types.ts` for database schema
- Wrap list item components with `memo()` for performance
- Use `useMemo` for expensive computations and derived state
- Use `useCallback` with stable dependencies (prefer `useRef` for function refs)
- Derive types from parse functions (`type X = ReturnType<typeof parseX>`)
- Use `satisfies` for type-safe constant validation
- Use `as const` for literal type inference on query strings and config objects
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes
- Use CVA (`class-variance-authority`) for component variants
- Use Zod for schema validation, `react-hook-form` for form state
- Use `sonner` toast for user feedback (`toast.success()`, `toast.error()`)
- Use `'use cache'` + `cacheTag()` in server actions for cacheable queries
- Use `revalidateTag()` / `updateTag()` after mutations to invalidate caches
- Throw context errors in custom hooks (`if (!context) throw new Error(...)`)
- Use `suppressHydrationWarning` only for hydration-sensitive content (e.g., relative dates)
- Localize all user-facing strings via `next-intl` (`useTranslations`, `getTranslations`)
- Use `IntlRecord` type for multilingual database fields

### ⚠️ Ask First (unless requested)

- Adding new dependencies
- Modifying database schema
- Changing middleware or auth logic
- Altering build configuration

### 🚫 Never

- Commit secrets, API keys, or `.env` files
- Use `any` type, `@ts-expect-error`, or bypass TypeScript validations
- Use the `function` keyword — always use `const` with arrow functions
- Modify `node_modules/`, `.next/`, or generated files
- Remove failing tests without fixing the underlying issue
- Use deprecated React patterns or Next.js APIs
- Use `forEach` — use `for..of`, `map`, or `reduce` instead
- Add unnecessary re-renders (missing `memo`, unstable references, inline object/array literals in JSX props)
- Skip localization for user-facing strings
- Use `React.FC` with children implicitly — declare `children` in props explicitly when needed
- Add explanatory comments in code (e.g., `// Clean up debounced functions on unmount or language change`). The only comments allowed are JSDoc comments, and only if similar files in the same folder already use them (e.g., hooks)
