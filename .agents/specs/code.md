# Code style reference

Formatter, linter, and import conventions for the GloRe codebase. Configured in `.oxfmtrc.json` (oxfmt) and `.oxlintrc.json` (oxlint), both standalone and both auto-discovered, so no invocation passes `-c`.

## Formatter (oxfmt)

| Setting         | Value                                                             |
| --------------- | ----------------------------------------------------------------- |
| Quotes          | Single (`singleQuote: true`); double in CSS (`**/*.css` override) |
| Semicolons      | None (`semi: false`)                                              |
| Trailing commas | `es5`; `none` for `*.jsonc`                                       |
| Arrow parens    | Avoid (`arrowParens: 'avoid'`)                                    |
| Tailwind sort   | `sortTailwindcss` recognizes `clsx`, `cn`, `cva`                  |
| Package.json    | Not sorted (`sortPackageJson: false`)                             |

Ignored by the formatter: `*.d.ts`, `AGENTS.md`, `.agents/**`, `.claude/**`, `drizzle/**`.

## Import order (oxfmt `sortImports`)

Groups, separated by blank lines (`newlinesBetween: true`):

```
:BUILTIN:                       # Node built-ins

react / react/**                # React, then
next / next/**                  # Next.js (same group, custom 'react' pattern)

:EXTERNAL:                      # Third-party packages

~/**                            # Config / messages aliases
@/**                            # Internal aliases

:RELATIVE:                      # index / sibling (parent imports blocked)
```

`internalPattern` covers `~/` and `@/`. Side-effect and style imports sort first. Parent (`../**`) imports are blocked by lint.

**Type imports:** inline only (`import { type Foo }`, not `import type { Foo }`). Enforced by `import/consistent-type-specifier-style: prefer-inline` and `typescript/consistent-type-imports` (`fixStyle: inline-type-imports`).

## Restricted imports

`eslint/no-restricted-imports` (`.oxlintrc.json`). Base rule, everywhere:

| Import                        | Restriction | Alternative                   |
| ----------------------------- | ----------- | ----------------------------- |
| `cookies` from `next/headers` | Blocked     | `@/actions/cookies`           |
| `cnfast`                      | Blocked     | `@/lib/utils` (re-exports `cn`) |
| `../**` (parent imports)      | Blocked     | Use path aliases (`@/`, `~/`) |

Scoped override for shared layers (`src/components/ui/**`, `src/components/icons/**`, `src/hooks/**`, `src/lib/**`): also blocks `@/components/features/**`, `@/app/**`, and `@/actions/**` to keep those layers domain-free (dependencies flow shared -> features -> app). oxlint overrides REPLACE the base rule for matched files, so the override restates the base patterns/paths; `src/lib/utils.ts` has a further override that drops the `cnfast` restriction (it is the re-export source).

Conventions enforced elsewhere or by review (not in `no-restricted-imports`): use `next/navigation` not `next/router`, `cn` from `@/lib/utils` not `@udecode/cn`, and the named `z` import from `zod`.

## Key lint rules (oxlint)

Categories: `correctness`, `pedantic`, `perf`, `style`, `suspicious` all `error`; `nursery` and `restriction` `allow`. `denyWarnings: true`, so warnings fail CLI runs.

| Rule                                     | Setting                                          |
| ---------------------------------------- | ------------------------------------------------ |
| `unicorn/no-array-for-each`              | Error: use `for..of`, `map`, `reduce`            |
| `eslint/no-else-return`                  | Error: use early returns                         |
| `func-style`                             | Error, `expression`: arrow functions only        |
| `import/no-relative-parent-imports`      | Error: use `@/` or `~/`                          |
| `import/consistent-type-specifier-style` | Error: inline type imports                       |
| `typescript/consistent-type-definitions` | Error, `interface`: interface over type          |
| `typescript/array-type`                  | Error, `array`: `string[]` not `Array<string>`   |
| `typescript/no-inferrable-types`         | Error: omit inferrable type annotations          |
| `typescript/no-explicit-any`             | Warn (only `src/lib/types.ts` may use `any`)     |
| `unicorn/filename-case`                  | Error: kebab-case (ignores `$`-prefixed)         |
| `import/no-anonymous-default-export`     | Error (off for `*.config.ts`)                    |
| `promise/prefer-await-to-then`           | Error: `await`, not `.then()` chains             |
| `react/jsx-curly-brace-presence`         | Error: no braces on props, always on children    |
| `eslint/prefer-template`                 | Error: template literals over concatenation      |

## Plugins and type-aware mode

Loaded oxlint plugins: `import`, `jsdoc`, `jsx-a11y`, `nextjs`, `node`, `promise`, `react`, `react-perf`. JS plugins (`jsPlugins` entries in `.oxlintrc.json`, which knip resolves natively as an oxlint config, so they need no `ignoreDependencies` entry): `react-compiler` (`eslint-plugin-react-hooks`), `react-doctor` (`oxlint-plugin-react-doctor`), `tailwindcss` (`oxlint-tailwindcss`). All 379 `react-doctor` rules are listed explicitly (352 `error`, 27 `off`), because oxlint runs a JS-plugin rule only when it is named in `rules`: there is no wildcard or category shorthand, and an unlisted rule is simply disabled. A `react-doctor` upgrade therefore does NOT pick up new rules on its own; regenerate the block with `node -e "import('oxlint-plugin-react-doctor').then(m => console.log(Object.keys((m.default ?? m).rules).join('\n')))"` and diff it against the config.

**Tailwind rules (`oxlint-tailwindcss`):** `settings.tailwindcss.entryPoint` is `src/app/globals.css`. Almost every rule is `error`, including the canonical/sorting/shorthand set (`enforce-canonical`, `enforce-sort-order`, `enforce-shorthand`, `enforce-physical`, `consistent-variant-order`, `no-duplicate-classes`, `no-unnecessary-whitespace`), the correctness set (`no-conflicting-classes`, `no-deprecated-classes`, `no-unknown-classes`), and `no-hardcoded-colors` + `prefer-theme-tokens`. `no-unknown-classes` carries `allowlist: ['font-heading', 'markdown', 'prose']` and `ignorePrefixes: ['slate-', 'ignore-click-outside/', 'prose-']`. Only `no-arbitrary-value` and `no-contradicting-variants` are `off`; `src/components/ui/**` also turns off `no-hardcoded-colors`. oxfmt's `sortTailwindcss` still writes last in the `pre-commit` hook (fmt > lint > fmt), so class order comes out of the formatter.

`typeAware: true` in `.oxlintrc.json`, so CLI runs (`pnpm run check:lint`, pre-commit, pre-push, CI) include type-aware rules: `no-floating-promises`, `no-misused-promises`, `unbound-method`. The editor LSP has `typeAware` off for speed (see "Dev environment and performance" in `reference.md`). `typeCheck: false` (oxlint does not run type-checking; that is `tsgo` via `pnpm run check:types`).

**Per-path overrides:** `src/components/ui/**` relaxes several jsx-a11y, react-compiler, and react-doctor rules; `src/hooks/**` relaxes `set-state-in-effect` and `no-initialize-state`; `*.config.ts` allows anonymous default exports and template curlies in strings.
