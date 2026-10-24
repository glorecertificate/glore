# Code style reference

Formatter, linter, and import conventions. Configured in `.oxfmtrc.json` (oxfmt) and `.oxlintrc.json` (oxlint), both standalone JSON and both auto-discovered, so no invocation passes `-c`.

## Config traps

- Keep both configs as JSON: oxlint and oxfmt auto-discover only the JSON names, and a `.ts` config silently falls back to built-in defaults without an explicit `-c`.
- Never pin an oxc binary path in `.vscode/settings.json`. Its only config pin is `oxc.configPath` (`workflow.md`, "Editor lint and save chain").
- Never reintroduce `vite-plus`: its `oxlint` bin collided with the direct `oxlint` dependency and silently dropped every editor rule.
- When the CLI lints but the editor shows nothing, read Output > Oxc (Lint) and check the `Using server binary at:` line, then run "Oxc: Restart Server".
- When CLI lint is slow, suspect the JS plugins (`jsPlugins`, mostly `oxlint-tailwindcss`) first. tsgolint adds under a second.
- `package.json` sets `"type": "module"`, so a JSON import in Node-run scripts and Playwright specs needs `with { type: 'json' }`.
- `typescript/consistent-type-imports` is not type-aware and misses a type-only import used only in a `satisfies` clause. Add the inline `type` qualifier by hand.

## Formatter (oxfmt)

- `singleQuote: true` (double in CSS through a `**/*.css` override), `semi: false`, `es5` trailing commas, `arrowParens: 'avoid'`, `sortPackageJson: false`.
- `sortTailwindcss` recognizes `clsx`, `cn`, and `cva`.
- The formatter ignores `*.d.ts`, `drizzle/**`, `.agents/skills/**`, and `.claude/skills/**`.
- `AGENTS.md`, `.agents/specs/`, and `.claude/settings.json` are formatted and checked.

## Git hooks

- Hooks are defined in `lefthook.yml` and installed by `scripts/prepare.mts` (`lefthook install --reset-hooks-path`) on install.
- Jobs call `node_modules/.bin` binaries directly, because `pnpm exec` adds a dependency check to every call.
- `pre-commit` formats, lint-fixes, and reformats staged files (oxfmt, oxlint, oxfmt), then restages them.
- Lefthook hides the unstaged hunks of partially staged files while it runs, so staging a single hunk still commits.
- `commit-msg` runs commitlint.
- `pre-merge-commit` fails every merge that would create a merge commit (`workflow.md`, "Git history").
- `pre-push` runs in parallel: commitlint over `origin/HEAD..HEAD`, `tsc`, knip, a merge-commit check over the same range, plus oxlint and `oxfmt --check` on pushed files only.
- CI's `pnpm run check` stays the full gate. It catches type-aware lint errors that a pushed change causes in files the push did not touch.

## Release age

- CI runs `pnpm install --frozen-lockfile`, and pnpm enforces a built-in `minimum-release-age` of 24h on every lockfile entry. Nothing in the repo overrides it.
- Local `pnpm install` accepts a fresher package, so a bump can pass locally and fail CI with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`.
- When CI is already red, re-run the job after the package is 24h old. Or add a scoped `minimumReleaseAgeExclude` entry to `pnpm-workspace.yaml`, and delete it after the run.
- Never lower `minimumReleaseAge` or set `trustLockfile: true`: both disable the check for every future install.

## Import order (oxfmt `sortImports`)

Groups are separated by blank lines (`newlinesBetween: true`):

```
:BUILTIN:                       # Node built-ins

react / react/**                # React, then
next / next/**                  # Next.js (same group, custom 'react' pattern)

:EXTERNAL:                      # Third-party packages

~/**                            # Config / messages aliases
@/**                            # Internal aliases

:RELATIVE:                      # index / sibling (parent imports blocked)
```

- `internalPattern` covers `~/` and `@/`. Side-effect and style imports sort first.
- Type imports are inline only (`import { type Foo }`, never `import type { Foo }`).
- `import/consistent-type-specifier-style: prefer-inline` and `typescript/consistent-type-imports` with `fixStyle: inline-type-imports` enforce this.

## Restricted imports

- `eslint/no-restricted-imports` blocks everywhere: `cookies` from `next/headers` (use `@/actions/cookies`).
- It also blocks `cnfast` (use `@/lib/utils`, which re-exports `cn`) and parent imports `../**` (use `@/` or `~/`).
- Node-run scripts import dependency-free `src/lib` files through the `#lib/*` subpath import in `package.json`.
- It blocks `lucide-react` outside `src/components/icons/**` and the vendored `src/components/ui/rich-text-editor/**`, which a later override exempts (render through `LucideIcon`).
- A scoped override for the shared layers (`src/components/ui/**`, `src/components/icons/**`, `src/hooks/**`, `src/lib/**`) also blocks `@/components/features/**`, `@/app/**`, and `@/actions/**`.
- That override keeps those layers domain-free.
- oxlint overrides REPLACE the base rule for matched files, so the override restates the base patterns.
- `src/lib/utils.ts` carries a further override that drops the `cnfast` restriction, since it is the re-export source.
- Enforced elsewhere or by review: `next/navigation` not `next/router`, `cn` from `@/lib/utils` not `@udecode/cn`, and the named `z` import from `zod`.

## Key lint rules (oxlint)

- Categories `correctness`, `pedantic`, `perf`, `style`, and `suspicious` are all `error`. `nursery` and `restriction` are `allow`.
- `denyWarnings: true`, so warnings fail CLI runs.
- oxlint, `oxlint-tsgolint`, and `oxfmt` upgrade together, because oxlint needs a matching `oxlint-tsgolint` peer.
- A new oxlint or `oxlint-plugin-react-doctor` can switch rules on through the categories, so run `oxlint` after a bump and decide per rule.
- Switched off on purpose: `one-var`, `react/function-component-definition`, `max-params`, `no-redeclare`, `node/no-sync`, and the native `react/*` compiler rules, which duplicate `react-compiler/*`.
- Also off: the `react-doctor` ports of the `react-perf`, `jsx-max-depth`, `no-autofocus`, and `no-unstable-nested-components` rules that were already off.
- Also off in `react-doctor`: `js-set-map-lookups`, `no-tiny-text`, `no-layout-property-animation`, `no-pass-data-to-parent`, and `effect-needs-cleanup`.
- The vendored editor gets a scoped override instead of source edits, and its one hardcoded color class sits in the `tailwindcss/no-hardcoded-colors` allow list.

| Rule                                     | Setting                                        |
| ---------------------------------------- | ---------------------------------------------- |
| `unicorn/no-array-for-each`              | Error: use `for..of`, `map`, `reduce`          |
| `eslint/no-else-return`                  | Error: use early returns                       |
| `func-style`                             | Error, `expression`: arrow functions only      |
| `import/no-relative-parent-imports`      | Error: use `@/` or `~/`                        |
| `import/consistent-type-specifier-style` | Error: inline type imports                     |
| `typescript/consistent-type-definitions` | Error, `interface`: interface over type        |
| `typescript/array-type`                  | Error, `array`: `string[]` not `Array<string>` |
| `typescript/no-inferrable-types`         | Error: omit inferrable type annotations        |
| `typescript/no-explicit-any`             | Warn (only `src/lib/types.ts` may use `any`)   |
| `unicorn/filename-case`                  | Error: kebab-case (ignores `$`-prefixed)       |
| `import/no-anonymous-default-export`     | Error everywhere, call expressions included    |
| `promise/prefer-await-to-then`           | Error: `await`, not `.then()` chains           |
| `react/jsx-curly-brace-presence`         | Error: no braces on props, always on children  |
| `eslint/prefer-template`                 | Error: template literals over concatenation    |

## Plugins and type-aware mode

- Loaded plugins: `import`, `jsdoc`, `jsx-a11y`, `nextjs`, `node`, `promise`, `react`, `react-perf`.
- JS plugins (`jsPlugins` entries): `react-compiler` (`eslint-plugin-react-hooks`), `react-doctor` (`oxlint-plugin-react-doctor`), `tailwindcss` (`oxlint-tailwindcss`).
- Knip resolves `jsPlugins` natively as an oxlint config, so they need no `ignoreDependencies` entry.
- All 380 `react-doctor` rules are listed explicitly (352 `error`, 28 `off`).
- oxlint runs a JS-plugin rule only when `rules` names it. There is no wildcard or category shorthand, and an unlisted rule is disabled.
- A `react-doctor` upgrade therefore does NOT pick up new rules on its own. Regenerate the block and diff it against the config:

```sh
node -e "import('oxlint-plugin-react-doctor').then(m => console.log(Object.keys((m.default ?? m).rules).join('\n')))"
```

### Tailwind rules (`oxlint-tailwindcss`)

- `settings.tailwindcss.entryPoint` is `src/app/globals.css`.
- Almost every rule is `error`.
- The canonical, sorting, and shorthand set: `enforce-canonical`, `enforce-sort-order`, `enforce-shorthand`, `enforce-physical`, `consistent-variant-order`, `no-duplicate-classes`, `no-unnecessary-whitespace`.
- The correctness set: `no-conflicting-classes`, `no-deprecated-classes`, `no-unknown-classes`. Also on: `no-hardcoded-colors` and `prefer-theme-tokens`.
- `no-unknown-classes` carries `allowlist: ['font-heading', 'markdown', 'prose']` and `ignorePrefixes: ['slate-', 'ignore-click-outside/', 'prose-']`.
- Only `no-arbitrary-value` and `no-contradicting-variants` are `off`. `src/emails/**` also turns off `no-hardcoded-colors`.
- oxfmt's `sortTailwindcss` still writes last in the `pre-commit` hook (fmt, lint, fmt), so class order comes out of the formatter.

### Type-aware mode

- `typeAware: true`, so CLI runs (`pnpm run check:lint`, pre-commit, pre-push, CI) include `no-floating-promises` and `no-misused-promises`.
- The editor LSP has `typeAware` off for speed (`workflow.md`, "Editor lint and save chain").
- `typeCheck: false`: oxlint does not type-check, `tsc` does through `pnpm run check:types`.

### Per-path overrides

- `src/components/ui/**` relaxes several jsx-a11y, react-compiler, and react-doctor rules.
- `src/hooks/**` relaxes `set-state-in-effect` and `no-initialize-state`.
- `*.config.ts` allows template curlies in strings.
- `src/components/**` and `src/emails/**` turn off the hydration-time rule.
- `src/emails/**` allows hardcoded colors.
- `src/db/helpers.ts` and `src/db/mutations/**` relax the react-doctor async rules.
- `src/lib/utils.ts` may import `cnfast`.

## Change order

- Land schema changes in this order: additive changes, then data moves, then drops.
- Add a zod schema, parser, or `CacheTag` with its first consumer, because knip fails on unused exports.
