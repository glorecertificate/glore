# Component & authoring patterns

Authoring conventions: components, types, utilities, hooks, theming, forms, emails. Routing, auth, data fetching, cache, env vars: see `reference.md`.

## Component patterns

### CVA variants

shadcn/ui (new-york style). Variants use `cva` from `class-variance-authority`; merge classes with `cn` from `@/lib/utils`.

```tsx
const button = cva('inline-flex items-center', {
  variants: { variant: { default: 'bg-primary', ghost: 'bg-transparent' }, size: { sm: 'h-8', md: 'h-10' } },
  defaultVariants: { variant: 'default', size: 'md' },
})
```

`cn` wraps `cx` + a `tailwind-merge` extended with custom `text-stroke-width` / `text-stroke-color` groups. oxfmt `sortTailwindcss` recognizes both `cn` and `cva`, so class strings inside them sort automatically.

### Context / provider hierarchy

Global, app-wide providers are flat single files in `src/components/providers/` (`i18n.tsx`, `search-params.tsx`, `session.tsx`, `theme.tsx`); each module owns its `use<X>` hook. Feature-scoped contexts live in `src/components/features/<domain>/`.

Split a provider into `context.tsx` + `provider.tsx` + `index.ts` ONLY when it needs a server-side data fetch; otherwise keep it one file. Barrels use named re-exports.

| Layout         | Provider order (outer to inner)                            |
| -------------- | ---------------------------------------------------------- |
| Root           | `SearchParamsProvider` > `I18nProvider` > `ThemeProvider`  |
| Dashboard      | `SidebarProvider` > `SessionProvider` > `CoursesProvider`  |

### Icon system

lucide-react icons are lazy-loaded through `src/components/icons/lucide.tsx`: a module `Map` caches `lazy()` components keyed by name, each rendered inside `Suspense`. Render with `<LucideIcon name={...} />` where `name` is an `IconName`; an optional `fallback` shows while loading.

Import icon TYPES from `lucide-react` but RENDER via `LucideIcon` from `@/components/icons/lucide`. Custom (non-lucide) icons live as components in `src/components/icons/`. The course `icon` field is stored as an `IconName` string.

### URL state (nuqs)

Type-safe URL state via nuqs. Per feature: a `params.ts` declares parsers, a `use-params.ts` exposes the typed hook. Found in `certificates/`, `courses/course-editor/`, `courses/course-list/`.

## Type system

### tsconfig flags

`strict: true`, `noImplicitAny: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `target: esnext`, `module: esnext`, `moduleResolution: bundler`, `jsx: react-jsx`. Production builds use `tsconfig.build.json` (excludes dev types).

| Alias          | Maps to        |
| -------------- | -------------- |
| `@/*`          | `./src/*`      |
| `~/config/*`   | `./config/*`   |
| `~/messages/*` | `./messages/*` |

### `src/lib/types.ts` helpers

`Any`, `AnyRecord`, `AnyFunction` (the only sanctioned `any` site), `AuthView`, `CamelCase<S>`, `Icon<T>` / `IconProps<T>`, `IconName` (re-export), `Rgb`, `Enum<T>`, `HttpUrl`. Also `Theme` / `ResolvedTheme` and a `usePathname` override returning `Route`.

### `src/db/types.ts` helpers

`TableMap` (snake_case table name to Drizzle table), `TableName`, `TableInsert<T>`, `TableUpdate<T>` (= `Partial<Insert>`). `Enums` is derived from each `pgEnum`'s `enumValues` (not hand-maintained); read one member via `EnumType<T>`.

### Validation schemas

| Layer            | Location                                      | Shape                                                    |
| ---------------- | --------------------------------------------- | -------------------------------------------------------- |
| Direct DB write  | `src/db/schemas.ts` (drizzle-zod)             | `createInsertSchema` / `createUpdateSchema`, DB-shaped   |
| Form input       | `src/components/features/**/schemas.ts`       | hand-written zod, UI-shaped                              |

At an action boundary that writes directly to the DB, `safeParse` the input with the drizzle-zod schema, then pass the typed data through. Form schemas stay separate because UI shapes diverge from table columns.

### Enum pattern

TS `enum` is used ONLY for `CacheTag` (`src/lib/cache.ts`). Every other "enum" uses `satisfies ... as const`. DB enums (from `pgEnum`):

| Enum                          | Values                                                       |
| ----------------------------- | ------------------------------------------------------------ |
| `certificate_status`          | `draft` `submitted` `in_review` `changes_requested` `approved` |
| `course_type`                 | `intro` `skill` `learner`                                    |
| `organization_request_status` | `pending` `accepted` `rejected`                              |
| `role`                        | `admin` `learner` `tutor` `representative` `volunteer`       |

## Utility functions

`src/lib/utils.ts` exports:

| Function              | Purpose                                                              |
| --------------------- | ------------------------------------------------------------------- |
| `cn`                  | Merge class names (cx + extended tailwind-merge)                    |
| `hexToRgb`            | Map a record of hex strings to `Rgb` tuples                         |
| `isValidUsername`     | True if value matches email or username regex                      |
| `defaultFormDisabled` | Disable submit when form is pristine or has errors                 |
| `publicFile`          | Prefix a public file path with `APP_URL`                           |
| `titleize`            | Title-case words longer than 3 chars                               |
| `camelize`            | Convert snake/kebab string to `CamelCase`                          |
| `keysOf`              | Typed `Object.keys`                                                 |
| `pluck`               | Map an array of records to one key's values                        |
| `omit`                | Return a copy without the given key(s)                             |
| `debounce`            | Debounce (default 500ms); has `.cancel()` and `.flush()`           |
| `throttle`            | Throttle a callback to a time limit                                |
| `sleep`               | Resolve a promise after `ms`                                       |

## Custom hooks

`src/hooks/`:

| Hook                   | Purpose                                                    |
| ---------------------- | ---------------------------------------------------------- |
| `use-composed-refs`    | Merge multiple refs into one callback ref                  |
| `use-cookies`          | Client cookie read/write                                   |
| `use-debounce`         | Debounce a value or callback                               |
| `use-device`           | Device / breakpoint detection                              |
| `use-file-upload`      | File-upload state (presigned R2 PUT flow)                  |
| `use-metadata`         | Page metadata helpers                                      |
| `use-mounted`          | True after first client mount                              |
| `use-navigation-guard` | Block navigation on unsaved changes                        |
| `use-pwa`              | PWA install / display-mode state                           |
| `use-scroll`           | Scroll position / direction                                |
| `use-search`           | Search input + results state                               |
| `use-sidebar-resize`   | Persisted sidebar width drag                               |
| `use-theme`            | Theme read/set wrapper                                     |

`useI18n` and `useSession` are NOT in `src/hooks/`: each is owned by its provider module in `src/components/providers/`. `useSession` exposes `isOrgAdmin` (admin OR representative), `isLearner`, `isTutor`, `isVolunteer`; use `membership.role === 'admin'` for owner-exclusive operations.

## Theming & styling

- Color in OKLCH via CSS custom properties in `src/app/globals.css`, with light and dark blocks. Token groups: surface, cards/popovers, primary/secondary/muted/accent, brand (`--brand` teal, `--brand-secondary` olive, `--brand-tertiary` navy), links, status (info/success/warning/destructive), borders, sidebar, editor highlight, 5 chart colors.
- `--radius` is `0.625rem` with `sm`/`md`/`lg`/`xl` derivatives. `text-stroke-*` utilities are available (see `cn`).
- Theme switching uses next-themes class strategy (`system`/`light`/`dark`) with the View Transitions API; respects `prefers-reduced-motion`.
- Route view transitions: `experimental.viewTransition: true`. `globals.css` suppresses the default root transition so only a named `<ViewTransition>` with a transition type animates (e.g. `course-created` on course create).
- `AnimatedList` / `AnimatedListItem` (`src/components/ui/animated-list.tsx`) wrap `AnimatePresence mode="popLayout"`: `variant` `card`/`row`, `asChild`, `exitOnly` for dnd-kit sortable lists (paired with `animateLayoutChangesAlways` + `measureAlways` from `src/components/ui/sortable.tsx`).
- Mobile breakpoint is 768px, sourced from `config/theme.json`.

## Form patterns

react-hook-form + `@hookform/resolvers` + zod. Disable the submit button with `defaultFormDisabled(form)`. Call the server action from `onSubmit`. Surface results with sonner (`toast.success` / `toast.error`).

## Email templates

`src/emails/` (React Email). Sent over SMTP via Nodemailer (`SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_SENDER`).

| Path                              | Trigger                          |
| --------------------------------- | -------------------------------- |
| `auth/recovery`                   | Password reset                   |
| `auth/invite`                     | Auth invite                      |
| `auth/verify-email`               | Email verification               |
| `team/invite`                     | Team member invite               |
| `account/password-changed`        | Password change confirmation     |
| `account/email-changed`           | Email change confirmation        |
| `certificate/assigned`            | Certificate assigned             |
| `certificate/review`              | Certificate review update        |
| `organization/join-request`       | Org join request                 |
| `organization/member-added`       | Org member added                 |

## Common patterns quick reference

Server action mutation:

```tsx
export const updateCourse = async (id: string, input: CourseInput) => {
  const session = await getSession()
  if (!session) return { error: 'unauthorized' }
  return await transaction(tx => editCourse(tx, id, input))
}
```

Cached query (inner cached fn wraps the DB call; outer accepts `{ cache }` to bypass):

```tsx
const getCoursesCached = async (orgId: string) => {
  'use cache'
  cacheTag(CacheTag.Courses)
  return await safeQuery(() => parseCourses(db.query.courses.findMany(...)))
}
```

Client component with context:

```tsx
'use client'
const t = useTranslations('Courses')
const { localize } = useI18n()
const { isOrgAdmin } = useSession()
```

DB query definition (parser flattens IntlRecord / profile fields):

```tsx
export const parseCourse = (row: CourseRow) => ({ ...row, title: row.title as IntlRecord })
```

Cookies, server (never import `cookies` from `next/headers`):

```tsx
import { getCookie, setCookie } from '@/actions/cookies'
const locale = await getCookie('NEXT_LOCALE')
await setCookie('NEXT_LOCALE', 'it')
```

Cookies, client:

```tsx
const { get, set } = useCookies()
```

Conditional classes:

```tsx
<div className={cn('rounded-md', isActive && 'bg-accent', className)} />
```
