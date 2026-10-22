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

App-wide providers are flat single files in `src/components/providers/` (`i18n.tsx`, `motion.tsx`, `search-params.tsx`, `session.tsx`, `theme.tsx`), each owning its `use<X>` hook. Feature-scoped contexts live in `src/components/features/<domain>/`. Split a provider into `context.tsx` + `provider.tsx` + `index.ts` ONLY when it needs a server-side data fetch; otherwise keep it one file. Barrels use named re-exports.

| Layout    | Provider order, outer to inner                                                         |
| --------- | -------------------------------------------------------------------------------------- |
| Root      | `SearchParamsProvider` > `I18nProvider` > `ThemeProvider` > `MotionProvider`           |
| Dashboard | `SidebarProvider` > `SessionProvider`, plus `CoursesProvider` in the `courses/` layout |

### Icon system

lucide-react icons render from the static registry `src/components/icons/registry.ts` (`ICONS`, `IconName`, `isIconName`, `iconNodeOf` for the PDF). Never use `lucide-react/dynamic` or `dynamicIconImports`: they made Turbopack compile all ~1,900 icons as separate client and SSR chunks for every route, which blew up dev memory. To use a new icon, add it to `ICONS`. Render with `<LucideIcon name={...} />`; a name from data that is not in the registry renders `circle-help`. The icon picker offers the registry icons only.

Import icon TYPES from `lucide-react` but RENDER through `LucideIcon`; only `registry.ts` imports icon components. Custom, non-lucide icons live as components in `src/components/icons/`. The course `icon` field is stored as an `IconName` string. Two prop shapes coexist: a dynamic name (`icon?: IconName`, rendered `<LucideIcon name={icon} />`) when the icon comes from data, and a static component (`icon: Icon` from `@/lib/types`, rendered `<Icon />`) when a config object hardcodes it.

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
- **Lazy-load only heavy, conditional UI** with `next/dynamic`: the editor sortable grid, course settings, account and organization tabs, the image crop dialog, the calendar, and the search palette. Keep small pieces that render on every card static: lazy per-card actions moved hydration into one 150ms task (4x CPU) to save 3KB.
- **`next/dynamic` without `loading` adds no Suspense boundary** while `ssr` is on, so it suspends to the nearest parent and can show a page skeleton. Wrap it in a local `<Suspense>` or pass `loading`. Use `ssr: false` for client-only widgets and inside `notFound()` renders, where an SSR dynamic import caused React error #419.
- **Motion:** render `m.*` components inside `MotionFeatures` (`src/components/ui/motion-features.tsx`, a scoped `LazyMotion` with synchronous `domMax`), never `motion.*`. Never add a root `LazyMotion` (11KB on routes without animation) or load features asynchronously (their activation lands in one long task after hydration).

## Release UI kit

Shared primitives live in `src/components/ui/`. They accept root props and localized labels; feature components own domain data and permission checks.

- `ArrowsMotif` uses vector paths extracted from the certificate template. It is decorative and hidden from assistive technology.
- `LevelDots` takes a level from 1 to 5 and a localized level label. `Timeline` and `TimelineItem` compose dated entries, with ISO `dateTime` values and separately localized display times.
- `DataTable` takes rows, stable row IDs, columns with optional sort accessors, a filters slot, and a row-actions slot. It sorts and paginates the supplied rows locally, announces counts, and provides loading and empty states. Pass `pagination` (page, pageCount, total, onPageChange) for server-paged rows.
- `StatCard` composes `NumberTicker`; formatting follows next-intl, and the ticker respects reduced motion. `Banner` supplies semantic status variants. `SegmentedControl` and `SegmentedControlItem` use Radix radio semantics and keyboard navigation.
- `CopyButton` handles clipboard failures and ignores stale completions after its value changes. `QrCode` imports the QR encoder on demand and provides loading and error states. `AvatarStack` lives in `avatar-stack.tsx`, requires stable avatar IDs and labels, and always renders a fallback.
- `Chart` loads `chart-renderer.tsx` through `next/dynamic` with a local skeleton. Only the renderer imports Recharts; its targeted lint override accounts for this boundary. Charts use semantic chart tokens, localize values, disable chart animation, and include an accessible data table. Mount charts only on analytics surfaces with real data.
- Personal skills use the AA-checked `brand-quaternary` teal tokens; chart colors use text variants to preserve contrast in both themes.

The organization roster uses `DataTable`; its overview uses `StatCard` and `AvatarStack`. Certificate views consume the sharing, timeline, and level primitives. These are foundation integrations; the later feature lanes still own their release flows.

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

A TS `enum` is used ONLY for `CacheTag` in `src/lib/cache.ts`. Every other enum uses `satisfies ... as const`. The `pgEnum` values are `certificate_status` (`draft`, `submitted`, `in_review`, `changes_requested`, `approved`, `rejected`, `withdrawn`, `revoked`), `certificate_review_decision` (`approved`, `changes_requested`, `rejected`), `course_type` (`intro`, `skill`, `learner`), `organization_request_status` (`pending`, `accepted`, `rejected`), `role` (`admin`, `learner`, `tutor`, `representative`, `volunteer`), and `skill_compass_kind` (`strength`, `goal`).

## Utilities and hooks

Check these before writing a new helper. `src/lib/utils.ts` exports `cn`, `hexToRgb`, `isValidUsername`, `defaultFormDisabled`, `publicFile`, `camelize`, `keysOf`, `pluck`, `omit`, `debounce` (default 500ms, with `.cancel()` and `.flush()`), `throttle`, `sleep`, and the `tempId()` / `isTempId()` pair for client-created records. Course-tree primary keys are `integer` identity columns, so `tempId()` returns a negative placeholder (never `Date.now()`, which overflows `int4`) and `isTempId()` decides insert vs. update.

`src/hooks/` holds `use-composed-refs`, `use-cookies`, `use-debounce`, `use-device`, `use-file-upload` (presigned R2 PUT flow), `use-metadata`, `use-mounted`, `use-navigation-guard` (blocks navigation on unsaved changes), `use-poll` (visible-tab polling with `refresh`), `use-pwa` (captures `beforeinstallprompt` at module scope so late mounts still see it), `use-scroll`, `use-search`, `use-sidebar-resize`, and `use-theme`.

`useCookies` writes script-visible cookies (no `HttpOnly`, URI-encoded values). A server `setCookie` for a cookie the client also writes passes `{ httpOnly: false }`, because a script cannot overwrite an `HttpOnly` cookie.

`useI18n` and `useSession` are NOT in `src/hooks/`: each is owned by its provider module in `src/components/providers/`. `useSession` exposes `isOrgAdmin` (owner only, membership role `admin`), `isRepresentative`, `isLearner`, `isTutor`, and `isVolunteer`; use `membership.role === 'admin'` for owner-exclusive operations. A client feature component typically pairs `useTranslations('<Namespace>')` with `useI18n()` for `localize` and `useSession()` for role checks.

## Theming and styling

- Color is OKLCH via CSS custom properties in `src/app/globals.css`, with light and dark blocks. The palette comes from the logo: `--brand` is the logo light-blue in both themes (slightly deeper in light mode) with an ink foreground, `--brand-secondary` is olive (dark foreground), `--brand-tertiary` is navy. `--primary` is a deeper, AA-safe brand blue with white text in light mode (`oklch(0.56 0.11 228)`, 4.5:1) and equals `--brand` in dark mode, so default buttons, checked controls, and selected chips use the brand color; `--secondary` is the dark navy fill. Neutrals carry a faint navy tint (hue 256). Every text and fill pair meets WCAG AA; check new pairs before adding them.
- Status colors are tokens only (`success`, `warning`, `destructive`, `info`); for text use `brand-text`, `warning-text`, `success-text`, `info-text`, `destructive-text`, `brand-secondary-text`, and `brand-tertiary-text`, since the fills fail AA as text on white or on their own tint. Never put `text-muted-foreground/NN` on meaningful text. Fills, icons, and charts keep `brand`.
- Brand roles: blue for primary actions, active navigation, focus, and links; olive for achievement and secondary data; navy (`brand-tertiary-text` as text) for tertiary data. Status colors mark state only, never decoration. Fonts are variables on `<html>`: Geist (`--font-geist-sans`) for UI text and Bricolage Grotesque (`font-display`), which `globals.css` applies to `h1` to `h3` and every `[data-slot$='-title']`. Never use raw Tailwind palette colors (`amber-500`, `green-500`) for state; use the `Badge` status variants (`success`, `warning`, `destructive`, `info`) or `bg-<status>/10 text-<status>-text`.
- Elevation: the Tailwind shadow scale (`shadow-2xs` to `shadow-lg`) is overridden with layered shadows tinted by `--shadow-ink` and per-theme alpha tokens, so components keep standard classes.
- Motion: `--ease-out` and `--ease-in-out` replace the weak Tailwind defaults. JS animation uses `EASE_OUT`, `SPRING`, and `TRANSITION` from `src/lib/motion.ts`; `MotionProvider` sets `MotionConfig reducedMotion="user"` app-wide. Enter and exit animations come from `tw-animate-css`. Never use `transition-all`; list the animated properties.
- `--radius` is `0.6rem` with `sm`/`md`/`lg`/`xl` derivatives. `globals.css` also defines a `text-stroke-*` utility (`@utility text-stroke-*`).
- Email templates use their own Tailwind config in `src/emails/layout.tsx`; its `brand` hex stays the deep teal `#267997`, because email buttons carry white text.
- Theme switching uses the next-themes class strategy (`system`/`light`/`dark`) with the View Transitions API, respecting `prefers-reduced-motion`.
- Route view transitions use React `<ViewTransition>` with no Next.js flag. `globals.css` suppresses the default root transition so only a named `<ViewTransition>` with a transition type animates (e.g. `course-created` on course create).
- `AnimatedList` and `AnimatedListItem` (`src/components/ui/animated-list.tsx`) wrap `AnimatePresence mode="popLayout"`: `variant` `card` or `row`, plus `asChild` and `exitOnly` for dnd-kit sortable lists, paired with `animateLayoutChangesAlways` and `measureAlways` from `src/components/ui/sortable.tsx`.
- The mobile breakpoint is 768px, sourced from `config/theme.json`.

## Internationalization

Config lives in `src/lib/i18n.ts`, sourced from `config/i18n.json`; the next-intl request config is `src/i18n.ts`. The locale lives in the `NEXT_LOCALE` cookie with no path prefix. Copy is sentence case, never CSS `capitalize`. Use "Log in" and "Log out" (es "Iniciar sesión" and "Cerrar sesión", it "Accedi" and "Esci"), the `…` character instead of three dots, and informal "tu" in es and it. Show roles through `formatRoleLabel`, never by titleizing the raw value.

Top-level namespaces match feature domains: `Auth`, `Courses`, `Certificates`, `Admin`, `Layout`, `Common`, `Metadata`. `Components.<Name>` is reserved for generic primitives in `src/components/ui/`, `Intl.Countries.*` and `Intl.Languages.*` carry i18n data, and `Email.*` covers email templates.

## Forms

react-hook-form with `@hookform/resolvers` and zod. Disable the submit button with `defaultFormDisabled(form)`, call the server action from `onSubmit`, and surface the result with sonner (`toast.success` / `toast.error`).

## Email templates and notifications

Templates live in `src/emails/<group>/<name>.tsx` (React Email), registered in `TEMPLATES` in `src/lib/email.ts`; events, `notify`, and the catalog are in `architecture.md` "Events, notifications, and email".
