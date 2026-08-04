# Component and authoring patterns

Authoring conventions: components, types, utilities, hooks, theming, forms, emails. Routing, auth, data fetching, cache, env vars: `reference.md`.

## Component patterns

### CVA variants

shadcn/ui, new-york style. Variants use `cva` from `class-variance-authority`; merge classes with `cn` from `@/lib/utils`, which re-exports `cnfast`. oxfmt `sortTailwindcss` recognizes `cn`, `cva`, and `clsx`, so class strings inside them sort automatically.

```tsx
const button = cva('inline-flex items-center', {
  variants: { variant: { default: 'bg-primary', ghost: 'bg-transparent' }, size: { sm: 'h-8', md: 'h-10' } },
  defaultVariants: { variant: 'default', size: 'md' },
})
```

### Forward root-element props

Every component, exported or not, accepts the props of its root element, merges `className` via `cn()`, and spreads the rest. Type props as `React.ComponentProps<Root>` (`Root` is `'div'` and similar for a DOM root, or `typeof Inner` when the root is another component) intersected with the component's own props; destructure `className` and `...props`, then spread. This keeps components restyleable and composable from the call site without editing them.

```tsx
const CourseCard = ({ className, course, ...props }: React.ComponentProps<'div'> & { course: Course }) => (
  <div className={cn('rounded-md border p-3', className)} {...props}>
    {/* ... */}
  </div>
)
```

A provider with no DOM root of its own is the only exemption: type its props as `React.PropsWithChildren<{...}>` and forward to whatever inner element has a root.

### Compose, don't configure

Build components by composition (compound components, context, slots, polymorphic `as` / `asChild`) rather than accreting boolean or config props. A growing list of `isX` / `showY` booleans is the signal to restructure into composed subcomponents; reaching for a third boolean prop means it should be composition instead.

### Context and provider hierarchy

App-wide providers are flat single files in `src/components/providers/` (`i18n.tsx`, `search-params.tsx`, `session.tsx`, `theme.tsx`), each owning its `use<X>` hook. Feature-scoped contexts live in `src/components/features/<domain>/`. Split a provider into `context.tsx` + `provider.tsx` + `index.ts` ONLY when it needs a server-side data fetch; otherwise keep it one file. Barrels use named re-exports.

| Layout    | Provider order, outer to inner                            |
| --------- | ----------------------------------------------------------- |
| Root      | `SearchParamsProvider` > `I18nProvider` > `ThemeProvider`  |
| Dashboard | `SidebarProvider` > `SessionProvider` > `CoursesProvider`  |

### Icon system

lucide-react icons are lazy-loaded through `src/components/icons/lucide.tsx`: a module `Map` caches `lazy()` components keyed by name, each rendered inside `Suspense`. Render with `<LucideIcon name={...} />` where `name` is an `IconName`; an optional `fallback` shows while loading.

Import icon TYPES from `lucide-react` but RENDER through `LucideIcon`. Custom, non-lucide icons live as components in `src/components/icons/`. The course `icon` field is stored as an `IconName` string. Two prop shapes coexist: a dynamic name (`icon?: IconName`, rendered `<LucideIcon name={icon} />`) when the icon comes from data, and a static component (`icon: Icon` from `@/lib/types`, rendered `<Icon />`) when a config object hardcodes it.

### URL state (nuqs)

Type-safe URL state, split by the client/server boundary so a slice's param keys stay importable from a server `page.tsx`:

- **`params.ts`** (no `'use client'`) is the server-safe layer: param-key constants, enum value tuples and their types, plus the parser objects for slices whose parsers run server-side via `createSearchParamsCache` (e.g. `auth/params.ts` exports `authParsers`). Server pages import from here. Present in `auth/`, `certificates/`, `courses/course-editor/`, `courses/course-list/`.
- **`use-params.ts`** (`'use client'`) holds the client hooks (`useQueryState` wrappers) built on `params.ts`. Add it ONLY when a slice has client param hooks worth extracting: `certificates/` and `courses/course-list/` have one, `auth/` does not (its parsers run server-side), `courses/course-editor/` does not (its param hooks live in that slice's `context.tsx`). Never create an empty `use-params.ts` for symmetry.

### Performance patterns (React Compiler)

React Compiler auto-memoizes derived values, callbacks, and components in production, so never add `useMemo`, `useCallback`, or `React.memo` by hand. Treat `vercel-react-best-practices` as the authoritative checklist; these are how it applies here.

- **Don't prop-drill a high-frequency subscription.** Subscribing at a parent and threading the value down re-renders every child on each tick. Isolate the subscription in a leaf component.
- **Don't call `form.watch()` at the top of a form.** It re-renders the whole form on every keystroke. Lift the dependent UI into a subcomponent and call `useWatch({ control, name })`. Known violations to fix rather than copy: `features/auth/login-form.tsx`, `features/auth/register-form.tsx`, `features/auth/password-request-form.tsx`, `features/certificates/new/certificate-form.tsx`.
- **Split high-churn context.** When a provider mixes a fast-changing value with stable actions, split it so consumers subscribe only to what they use.
- **Prefer derived state over a syncing effect.** Use `useDeferredValue` to gate expensive recomputation (see `src/hooks/use-search.ts`), or set state during render to mirror a prop, rather than a `useEffect` that copies props into state.
- **Stabilize interval and listener callbacks** that close over fresh values with a ref or `useEffectEvent`, so a long-lived `setInterval` or subscription does not restart every render.
- **No dead cleanup.** Setting state in an unmount cleanup is a no-op. Reserve `return () => { ... }` for real teardown (`clearTimeout`, `removeEventListener`).

## Type system

`strict`, `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters` all true; `target` and `module` `esnext`, `moduleResolution: bundler`, `jsx: react-jsx`. Production builds use `tsconfig.build.json`, which excludes dev types.

| Alias          | Maps to        |
| -------------- | -------------- |
| `@/*`          | `./src/*`      |
| `~/config/*`   | `./config/*`   |
| `~/messages/*` | `./messages/*` |

`src/lib/types.ts` holds `Any`, `AnyRecord`, `AnyFunction` (the only sanctioned `any` site), `AuthView`, `CamelCase<S>`, `Icon<T>` / `IconProps<T>`, `IconName` (re-export), `Rgb`, `Enum<T>`, `HttpUrl`, `Theme` / `ResolvedTheme`, and a `usePathname` override returning `Route`.

`src/db/types.ts` holds `TableMap` (snake_case table name to Drizzle table), `TableName`, `TableInsert<T>`, and `TableUpdate<T>` (a `Partial<Insert>`). `Enums` is derived from each `pgEnum`'s `enumValues` rather than hand-maintained; read one member with `EnumType<T>`.

### Validation schemas

Two layers, deliberately separate because UI shapes diverge from table columns:

- **Direct DB write:** `src/db/schemas.ts`, imported as `@/db/schemas`. drizzle-zod `createInsertSchema` / `createUpdateSchema`, named `<table>InsertSchema` / `<table>UpdateSchema` (e.g. `docArticleInsertSchema`). At an action boundary that writes straight to the DB, `safeParse` the input with the matching schema and pass the typed data through.
- **Form input:** `src/components/features/**/schemas.ts`, hand-written zod, UI-shaped.

### Enum pattern

A TS `enum` is used ONLY for `CacheTag` in `src/lib/cache.ts`. Every other enum uses `satisfies ... as const`. The `pgEnum` values are `certificate_status` (`draft`, `submitted`, `in_review`, `changes_requested`, `approved`), `course_type` (`intro`, `skill`, `learner`), `organization_request_status` (`pending`, `accepted`, `rejected`), and `role` (`admin`, `learner`, `tutor`, `representative`, `volunteer`).

## Utilities and hooks

Check these before writing a new helper. `src/lib/utils.ts` exports `cn`, `hexToRgb`, `isValidUsername`, `defaultFormDisabled`, `publicFile`, `titleize`, `camelize`, `keysOf`, `pluck`, `omit`, `debounce` (default 500ms, with `.cancel()` and `.flush()`), `throttle`, `sleep`, and the `tempId()` / `isTempId()` pair for client-created records (see gotcha 8 in `AGENTS.md`).

`src/hooks/` holds `use-composed-refs`, `use-cookies`, `use-debounce`, `use-device`, `use-file-upload` (presigned R2 PUT flow), `use-metadata`, `use-mounted`, `use-navigation-guard` (blocks navigation on unsaved changes), `use-pwa`, `use-scroll`, `use-search`, `use-sidebar-resize`, and `use-theme`.

`useI18n` and `useSession` are NOT in `src/hooks/`: each is owned by its provider module in `src/components/providers/`. `useSession` exposes `isOrgAdmin` (admin OR representative), `isLearner`, `isTutor`, and `isVolunteer`; use `membership.role === 'admin'` for owner-exclusive operations. A client feature component typically pairs `useTranslations('<Namespace>')` with `useI18n()` for `localize` and `useSession()` for role checks.

## Theming and styling

- Color is OKLCH via CSS custom properties in `src/app/globals.css`, with light and dark blocks. Token groups: surface, cards and popovers, primary/secondary/muted/accent, brand (`--brand` teal, `--brand-secondary` olive, `--brand-tertiary` navy), links, status (info, success, warning, destructive), borders, sidebar, editor highlight, and 5 chart colors.
- `--radius` is `0.625rem` with `sm`/`md`/`lg`/`xl` derivatives. `globals.css` also defines a `text-stroke-*` utility (`@utility text-stroke-*`).
- Theme switching uses the next-themes class strategy (`system`/`light`/`dark`) with the View Transitions API, respecting `prefers-reduced-motion`.
- Route view transitions run under `experimental.viewTransition: true`. `globals.css` suppresses the default root transition so only a named `<ViewTransition>` with a transition type animates (e.g. `course-created` on course create).
- `AnimatedList` and `AnimatedListItem` (`src/components/ui/animated-list.tsx`) wrap `AnimatePresence mode="popLayout"`: `variant` `card` or `row`, plus `asChild` and `exitOnly` for dnd-kit sortable lists, paired with `animateLayoutChangesAlways` and `measureAlways` from `src/components/ui/sortable.tsx`.
- The mobile breakpoint is 768px, sourced from `config/theme.json`.

## Internationalization

Config lives in `src/lib/i18n.ts`, sourced from `config/i18n.json`; the next-intl request config is `src/i18n.ts`.

Top-level namespaces match feature domains: `Auth`, `Courses`, `Certificates`, `Admin`, `Layout`, `Common`, `Metadata`. `Components.<Name>` is reserved for generic primitives in `src/components/ui/`, `Intl.Countries.*` and `Intl.Languages.*` carry i18n data, and `Email.*` covers email templates.

## Forms

react-hook-form with `@hookform/resolvers` and zod. Disable the submit button with `defaultFormDisabled(form)`, call the server action from `onSubmit`, and surface the result with sonner (`toast.success` / `toast.error`).

## Email templates

`src/emails/` (React Email), sent over SMTP through Nodemailer. Templates and their triggers: `auth/recovery` (password reset), `auth/invite`, `auth/verify-email`, `team/invite`, `account/password-changed`, `account/email-changed`, `certificate/assigned`, `certificate/review` (review update), `organization/join-request`, `organization/member-added`.
