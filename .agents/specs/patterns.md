# Component and authoring patterns

Authoring conventions: components, types, utilities, hooks, i18n, forms, emails. Theming and the release UI kit: `ui.md`. Routing: `routes.md`. Auth, data fetching, cache, env vars: `reference.md`.

## Component patterns

### CVA variants

- Use shadcn/ui, new-york style.
- Define variants with `cva` from `class-variance-authority`.
- Merge classes with `cn` from `@/lib/utils`, which re-exports `cnfast`.
- oxfmt `sortTailwindcss` recognizes `cn`, `cva`, and `clsx`, so class strings inside them sort automatically.

```tsx
const button = cva('inline-flex items-center', {
  variants: { variant: { default: 'bg-primary', ghost: 'bg-transparent' }, size: { sm: 'h-8', md: 'h-10' } },
  defaultVariants: { variant: 'default', size: 'md' },
})
```

### Forward root-element props

- Every component, exported or not, accepts the props of its root element, merges `className` through `cn()`, and spreads the rest.
- Type props as `React.ComponentProps<Root>` intersected with the component's own props.
- `Root` is `'div'` or similar for a DOM root, and `typeof Inner` when the root is another component.
- Destructure `className` and `...props`, then spread. This keeps components restyleable and composable from the call site.

```tsx
const CourseCard = ({ className, course, ...props }: React.ComponentProps<'div'> & { course: Course }) => (
  <div className={cn('rounded-md border p-3', className)} {...props}>
    {/* ... */}
  </div>
)
```

- A provider with no DOM root is the only exemption: type its props as `React.PropsWithChildren<{...}>` and forward to whatever inner element has a root.

### Compose, don't configure

- Build components by composition (compound components, context, slots, polymorphic `as` or `asChild`).
- Do not accrete boolean or config props.
- A growing list of `isX` or `showY` booleans signals a restructure into composed subcomponents.
- A third boolean prop means the API should be composition instead.

### Context and provider hierarchy

- App-wide providers are flat single files in `src/components/providers/` (`i18n.tsx`, `motion.tsx`, `search-params.tsx`, `session.tsx`, `theme.tsx`), each owning its `use<X>` hook.
- Feature-scoped contexts live in `src/components/features/<domain>/`.
- Split a provider into `context.tsx`, `provider.tsx`, and `index.ts` ONLY when it needs a server-side data fetch. Otherwise keep it one file.
- Barrels use named re-exports.

| Layout    | Provider order, outer to inner                                                         |
| --------- | -------------------------------------------------------------------------------------- |
| Root      | `SearchParamsProvider` > `I18nProvider` > `ThemeProvider` > `MotionProvider`           |
| Dashboard | `SidebarProvider` > `SessionProvider`, plus `CoursesProvider` in the `courses/` layout |

### Icon system

- lucide-react icons render from the static registry `src/components/icons/registry.ts` (`ICONS`, `IconName`, `isIconName`, `iconNodeOf` for the PDF).
- Never use `lucide-react/dynamic` or `dynamicIconImports`: Turbopack compiled all ~1,900 icons as chunks per route and blew up dev memory.
- Add new icons to `ICONS`.
- Render with `<LucideIcon name={...} />`. A name from data that is not in the registry renders `circle-help`.
- The icon picker offers the registry icons only.
- Nothing outside `src/components/icons/**` and the vendored `ui/rich-text-editor/` imports `lucide-react`, types included (`LucideProps` is re-exported from `registry.ts`). A lint rule blocks it (`code.md`).
- Custom, non-lucide icons live as components in `src/components/icons/`.
- The course `icon` field is stored as an `IconName` string.
- Use a dynamic name (`icon?: IconName`, rendered `<LucideIcon name={icon} />`) when the icon comes from data.
- Config objects hardcode registry names too (`icon: 'award'` typed `IconName`, rendered `<LucideIcon name={icon} />`), never lucide components.
- `Button` and `Input` take `icon?: Icon | IconName`: a registry name for Lucide icons, a component only for custom icons from `src/components/icons/` (Gmail, Outlook, and the like).

### URL state (nuqs)

- URL state is type-safe and split by the client and server boundary, so a slice's param keys stay importable from a server `page.tsx`.
- `params.ts` (no `'use client'`) is the server-safe layer.
- It holds param-key constants, enum value tuples and their types, and the parser objects for slices whose parsers run server-side through `createSearchParamsCache` (for example `authParsers` in `auth/params.ts`).
- Server pages import from `params.ts`. It exists in `auth/`, `certificates/`, `courses/course-editor/`, and `courses/course-list/`.
- `use-params.ts` (`'use client'`) holds the client hooks (`useQueryState` wrappers) built on `params.ts`.
- Add `use-params.ts` ONLY when a slice has client param hooks worth extracting. `certificates/` and `courses/course-list/` have one.
- `auth/` has none because its parsers run server-side. `courses/course-editor/` has none because its param hooks live in that slice's `context.tsx`.
- Never create an empty `use-params.ts` for symmetry.

### Performance patterns (React Compiler)

- React Compiler auto-memoizes derived values, callbacks, and components in production, so never add `useMemo`, `useCallback`, or `React.memo` by hand.
- Treat `vercel-react-best-practices` as the authoritative checklist. The rules below show how it applies here.
- Do not prop-drill a high-frequency subscription: subscribing at a parent and threading the value down re-renders every child on each tick. Isolate the subscription in a leaf component.
- Do not call `form.watch()` at the top of a form: it re-renders the whole form on every keystroke.
- Lift the dependent UI into a subcomponent and call `useWatch({ control, name })`.
- Known violations to fix rather than copy: `features/auth/login-form.tsx`, `features/auth/password-request-form.tsx`, `features/courses/course-editor/settings.tsx`.
- Split a high-churn context: when a provider mixes a fast-changing value with stable actions, split it so consumers subscribe only to what they use.

#### Effects and loading

- Prefer derived state over a syncing effect.
- Use `useDeferredValue` to gate expensive recomputation (see `src/hooks/use-search.ts`), or set state during render to mirror a prop, instead of a `useEffect` that copies props into state.
- Stabilize interval and listener callbacks that close over fresh values with a ref or `useEffectEvent`, so a long-lived `setInterval` or subscription does not restart every render.
- Write no dead cleanup: setting state in an unmount cleanup is a no-op. Reserve `return () => { ... }` for real teardown (`clearTimeout`, `removeEventListener`).
- Lazy-load only heavy, conditional UI with `next/dynamic`.
- Lazy candidates: the editor sortable grid, course settings, account and organization tabs, the image crop dialog, the calendar, and the search palette.
- Keep small pieces that render on every card static: lazy per-card actions moved hydration into one 150ms task (4x CPU) to save 3KB.
- `next/dynamic` without `loading` adds no Suspense boundary while `ssr` is on, so it suspends to the nearest parent and can show a page skeleton. Wrap it in a local `<Suspense>` or pass `loading`.
- Use `ssr: false` for client-only widgets and inside `notFound()` renders, where an SSR dynamic import caused React error #419.
- Render `m.*` components inside `MotionFeatures` (`src/components/ui/motion-features.tsx`, a scoped `LazyMotion` with synchronous `domMax`), never `motion.*`.
- Never add a root `LazyMotion` (11KB on routes without animation). Never load features asynchronously (their activation lands in one long task after hydration).

## Type system

- `tsconfig.json` sets `strict`, `noImplicitAny`, `noUnusedLocals`, and `noUnusedParameters` to true.
- `target` and `module` are `esnext`, `moduleResolution` is `bundler`, and `jsx` is `react-jsx`.
- Production builds use `tsconfig.build.json`, which excludes dev types.

| Alias          | Maps to        |
| -------------- | -------------- |
| `@/*`          | `./src/*`      |
| `~/config/*`   | `./config/*`   |
| `~/messages/*` | `./messages/*` |

- `src/lib/types.ts` holds `Any`, `AnyRecord`, and `AnyFunction` (the only sanctioned `any` site).
- It also holds `AuthView`, `CamelCase<S>`, `Icon<T>` and `IconProps<T>`, `IconName` (re-export), `Rgb`, `Enum<T>`, `HttpUrl`, and `Theme` and `ResolvedTheme`.
- It also holds a `usePathname` override that returns `Route`.
- `src/db/types.ts` holds `TableMap` (snake_case table name to Drizzle table), `TableName`, `TableInsert<T>`, and `TableUpdate<T>` (a `Partial<Insert>`).
- `Enums` derives from each `pgEnum`'s `enumValues` instead of a hand-maintained list. Read one member with `EnumType<T>`.

### Validation schemas

The two layers stay separate because UI shapes diverge from table columns.

- Direct DB write: `src/db/schemas.ts`, imported as `@/db/schemas`, holds drizzle-zod `createInsertSchema` and `createUpdateSchema` results.
- Name them `<table>InsertSchema` and `<table>UpdateSchema` (for example `docArticleInsertSchema`).
- At an action boundary that writes straight to the DB, `safeParse` the input with the matching schema and pass the typed data through.
- Form input: `src/components/features/**/schemas.ts`, hand-written zod, UI-shaped.

### Enum pattern

- A TS `enum` is used ONLY for `CacheTag` in `src/lib/cache.ts`.
- Every other enum uses `satisfies ... as const`.
- `certificate_status`: `draft`, `submitted`, `in_review`, `changes_requested`, `approved`, `rejected`, `withdrawn`, `revoked`.
- `certificate_review_decision`: `approved`, `changes_requested`, `rejected`.
- `course_type`: `intro`, `skill`, `learner`.
- `organization_request_status`: `pending`, `accepted`, `rejected`.
- `role`: `admin`, `learner`, `tutor`, `representative`, `volunteer`.
- `skill_compass_kind`: `strength`, `goal`.

## Utilities and hooks

### Utilities

- Check these before writing a new helper.
- `src/lib/utils.ts` exports `cn`, `hexToRgb`, `isValidUsername`, `publicFile`, `serializeJsonLd`, `camelize`, `keysOf`, `pluck`, `omit`, `debounce`, `throttle`, and `sleep`.
- `debounce` defaults to 500ms and has `.cancel()` and `.flush()`.
- `tempId()` and `isTempId()` serve client-created records.
- Course-tree primary keys are `integer` identity columns, so `tempId()` returns a negative placeholder. Never use `Date.now()`, which overflows `int4`.
- `isTempId()` decides insert versus update.

### Hooks

- `src/hooks/` holds `use-composed-refs`, `use-cookies`, `use-debounce`, `use-device`, `use-form-disabled`, `use-metadata`, `use-mounted`, `use-scroll`, `use-search`, `use-sidebar-resize`, and `use-theme`.
- `use-action-error`: returns `(error, fallback)`, which resolves the impersonation lock code to `Common.impersonationLocked` and otherwise the fallback message.
- `use-country-name`: returns `(code)`, which resolves a country code of any case to its `Intl.Countries` name (`countryName` in `lib/country.ts`) and falls back to the upper-cased code.
- `use-file-upload`: presigned R2 PUT flow.
- `use-navigation-guard`: blocks navigation on unsaved changes.
- `use-poll`: visible-tab polling with `refresh`.
- `use-pwa`: captures `beforeinstallprompt` at module scope so late mounts still see it.
- `use-scroll-edges`: overflow state for `TabsList`, which scrolls with a fade edge.
- `useCookies` writes script-visible cookies (no `HttpOnly`, URI-encoded values).
- A server `setCookie` for a cookie the client also writes passes `{ httpOnly: false }`, because a script cannot overwrite an `HttpOnly` cookie.
- `useI18n` and `useSession` are NOT in `src/hooks/`: each is owned by its provider module in `src/components/providers/`.
- `useSession` exposes `isOrgAdmin` (owner only, membership role `admin`), `isRepresentative`, `isLearner`, `isTutor`, and `isVolunteer`.
- Use `membership.role === 'admin'` for owner-exclusive operations.
- A client feature component typically pairs `useTranslations('<Namespace>')` with `useI18n()` for `localize` and `useSession()` for role checks.

## Internationalization

- Config is `src/lib/i18n.ts` (from `config/i18n.json`), request config is `src/i18n.ts`, and the locale is the `NEXT_LOCALE` cookie with no path prefix.
- `login` and `signInToAcceptInvitation` call `applyUserLocale` (`actions/cookies.ts`) so a fresh browser opens in the language stored on the account; an account without a language keeps the cookie as it is.
- Pass messages to `I18nProvider` through `clientMessages()`, which drops the namespaces listed in `serverNamespaces` (`config/i18n.json`).
- `loadMessages` layers `en` under the locale, then applies published `message_overrides` rows.
- An override must pass three checks: the key exists in `en`, its `messageSignature` matches `en`, and `icu-minify/compile` works in builds.
- Overrides load in an inner `'use cache'` function tagged `messagesTag(locale)`. Publishing calls `updateTag` for it, and an `en` publish for every locale.
- Raw text for override hashes comes from `messages/*.json` on disk, because builds precompile the bundled catalogs.
- Protected keys (`PROTECTED_NAMESPACES` and `Email` subjects) need `requireAdmin`, others `requireEditor`.
- `classifyOverride` returns `orphaned`, `incompatible`, `outdated`, or `redundant`.
- A client locale switch calls the `getClientMessages` action (`actions/i18n.ts`), which returns the target locale without the server-only namespaces.
- `pnpm run check:i18n` fails when a server-only namespace is used from a module reachable from a `'use client'` file, or when a namespace used only on the server is missing from the list.
- Write copy in sentence case (never CSS `capitalize`) with `…`.
- Use US English in `en`, Peninsular informal "tú" in `es`, and informal "tu" in `it`.
- Use "Log in" and "Log out" (es "Iniciar sesión", "Cerrar sesión"; it "Accedi", "Esci").
- Show roles through `formatRoleLabel`.
- Namespaces match feature domains.
- Certificate copy lives in `Certificate<Area>` namespaces: `Credential`, `Detail`, `Eligibility`, `Errors`, `List`, `Org`, `Public`, `Queue`, `Review`, `Share`, `Status`, `Verify`, and `Wizard`.
- Course copy lives in `CourseCommon` (settings dialog and strings both screens use), `CourseEditor`, and `CourseList`. A string the tab bar builds from a value (`t(value)`) stays in `CourseList`.
- Catalogs stay one file per locale. Per-namespace files would not shrink what the client receives, because `clientMessages()` and `getClientMessages` already filter by namespace, and they would split every Crowdin diff.
- When a new namespace is used only in server code (route handlers, emails, metadata, server pages), add it to `serverNamespaces`.
- `Components.<Name>` serves `src/components/ui/`, `Intl.*` serves country and language data, and `Email.*` serves templates.

## Forms

- Use react-hook-form with `@hookform/resolvers` and zod.
- Disable the submit button with `useFormDisabled(form.control)`, and read the error state with `useFormErrored(form.control)`. Both opt out of the compiler with `'use no memo'`, because RHF mutates `errors` in place.
- Never pass `form` to a helper that reads its state in render: the build-only React Compiler memoizes the call and freezes the value.
- Call the server action from `onSubmit` and surface the result with sonner (`toast.success`, `toast.error`).

## Email templates and notifications

- Templates live in `src/emails/<group>/<name>.tsx` (React Email) and register in `TEMPLATES` in `src/lib/email.ts`.
- Events, `notify`, and the catalog: `architecture.md`, "Events, notifications, and email".
