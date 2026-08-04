# Code style reference

Formatter, linter, and import conventions. Configured in `.oxfmtrc.json` (oxfmt) and `.oxlintrc.json` (oxlint), both standalone and both auto-discovered, so no invocation passes `-c`.

## Formatter (oxfmt)

`singleQuote: true` (double in CSS via a `**/*.css` override), `semi: false`, `es5` trailing commas (`none` for `*.jsonc`), `arrowParens: 'avoid'`, `sortPackageJson: false`. `sortTailwindcss` recognizes `clsx`, `cn`, and `cva`.

Ignored by the formatter: `*.d.ts`, `AGENTS.md`, `.agents/**`, `.claude/**`, `drizzle/**`.

## Git hooks

Hooks live in `.githooks`, wired by `scripts/prepare.mts` setting `core.hooksPath` on install. `pre-commit` formats and autofixes staged files with oxfmt and oxlint, then restages them; `commit-msg` runs commitlint; `pre-push` runs commitlint then `pnpm run check`. A file with both staged and unstaged changes is reported and skipped, never reformatted, so staging a single hunk still commits.

## Import order (oxfmt `sortImports`)

Groups separated by blank lines (`newlinesBetween: true`):

```
:BUILTIN:                       # Node built-ins

react / react/**                # React, then
next / next/**                  # Next.js (same group, custom 'react' pattern)

:EXTERNAL:                      # Third-party packages

~/**                            # Config / messages aliases
@/**                            # Internal aliases

:RELATIVE:                      # index / sibling (parent imports blocked)
```

`internalPattern` covers `~/` and `@/`. Side-effect and style imports sort first.

**Type imports are inline only** (`import { type Foo }`, never `import type { Foo }`), enforced by `import/consistent-type-specifier-style: prefer-inline` and `typescript/consistent-type-imports` with `fixStyle: inline-type-imports`.

## Restricted imports

`eslint/no-restricted-imports`. Blocked everywhere: `cookies` from `next/headers` (use `@/actions/cookies`), `cnfast` (use `@/lib/utils`, which re-exports `cn`), and parent imports `../**` (use `@/` or `~/`).

A scoped override for the shared layers (`src/components/ui/**`, `src/components/icons/**`, `src/hooks/**`, `src/lib/**`) also blocks `@/components/features/**`, `@/app/**`, and `@/actions/**`, keeping those layers domain-free. oxlint overrides REPLACE the base rule for matched files, so the override restates the base patterns; `src/lib/utils.ts` carries a further override dropping the `cnfast` restriction, since it is the re-export source.

Enforced elsewhere or by review: `next/navigation` not `next/router`, `cn` from `@/lib/utils` not `@udecode/cn`, and the named `z` import from `zod`.

## Key lint rules (oxlint)

Categories `correctness`, `pedantic`, `perf`, `style`, and `suspicious` are all `error`; `nursery` and `restriction` are `allow`. `denyWarnings: true`, so warnings fail CLI runs.

| Rule                                     | Setting                                        |
| ---------------------------------------- | ------------------------------------------------ |
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
| `import/no-anonymous-default-export`     | Error (off for `*.config.ts`)                  |
| `promise/prefer-await-to-then`           | Error: `await`, not `.then()` chains           |
| `react/jsx-curly-brace-presence`         | Error: no braces on props, always on children  |
| `eslint/prefer-template`                 | Error: template literals over concatenation    |

## Plugins and type-aware mode

Loaded plugins: `import`, `jsdoc`, `jsx-a11y`, `nextjs`, `node`, `promise`, `react`, `react-perf`. JS plugins (`jsPlugins` entries, which knip resolves natively as an oxlint config, so they need no `ignoreDependencies` entry): `react-compiler` (`eslint-plugin-react-hooks`), `react-doctor` (`oxlint-plugin-react-doctor`), `tailwindcss` (`oxlint-tailwindcss`).

All 379 `react-doctor` rules are listed explicitly (352 `error`, 27 `off`) because oxlint runs a JS-plugin rule only when it is named in `rules`: there is no wildcard or category shorthand, and an unlisted rule is simply disabled. A `react-doctor` upgrade therefore does NOT pick up new rules on its own. Regenerate the block and diff it against the config with:

```sh
node -e "import('oxlint-plugin-react-doctor').then(m => console.log(Object.keys((m.default ?? m).rules).join('\n')))"
```

**Tailwind rules (`oxlint-tailwindcss`):** `settings.tailwindcss.entryPoint` is `src/app/globals.css`. Almost every rule is `error`, covering the canonical/sorting/shorthand set (`enforce-canonical`, `enforce-sort-order`, `enforce-shorthand`, `enforce-physical`, `consistent-variant-order`, `no-duplicate-classes`, `no-unnecessary-whitespace`), the correctness set (`no-conflicting-classes`, `no-deprecated-classes`, `no-unknown-classes`), plus `no-hardcoded-colors` and `prefer-theme-tokens`. `no-unknown-classes` carries `allowlist: ['font-heading', 'markdown', 'prose']` and `ignorePrefixes: ['slate-', 'ignore-click-outside/', 'prose-']`. Only `no-arbitrary-value` and `no-contradicting-variants` are `off`; `src/components/ui/**` also turns off `no-hardcoded-colors`. oxfmt's `sortTailwindcss` still writes last in the `pre-commit` hook (fmt, lint, fmt), so class order comes out of the formatter.

`typeAware: true`, so CLI runs (`pnpm run check:lint`, pre-commit, pre-push, CI) include `no-floating-promises`, `no-misused-promises`, and `unbound-method`. The editor LSP has `typeAware` off for speed, explained under "Dev environment and performance" in `reference.md`. `typeCheck: false`: oxlint does not type-check, `tsgo` does via `pnpm run check:types`.

**Per-path overrides:** `src/components/ui/**` relaxes several jsx-a11y, react-compiler, and react-doctor rules; `src/hooks/**` relaxes `set-state-in-effect` and `no-initialize-state`; `*.config.ts` allows anonymous default exports and template curlies in strings.
