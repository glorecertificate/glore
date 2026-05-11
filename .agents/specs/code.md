# Code Style Reference

Formatter, linter, and import conventions for the GloRe codebase. Configured in `vite.config.ts`.

---

## Formatter (oxfmt)

| Setting         | Value                          |
| --------------- | ------------------------------ |
| Quotes          | Single                         |
| Semicolons      | None (`semi: false`)           |
| Trailing commas | ES5                            |
| Arrow parens    | Avoid (`arrowParens: "avoid"`) |

---

## Import Order (oxfmt `sortImports`)

```
:BUILTIN:                       # Node built-ins

react / react/**                # React imports
next / next/**                  # Next.js imports

:EXTERNAL:                      # Third-party packages

~/**                            # Config/messages aliases
@/**                            # Internal @/ aliases

:RELATIVE:                      # Sibling/index (parent imports are blocked)
```

**Import type style:** Inline type imports (`import { type Foo }`, not `import type { Foo }`)

---

## Restricted Imports

| Import                         | Restriction | Alternative                   |
| ------------------------------ | ----------- | ----------------------------- |
| `cookies` from `next/headers`  | Blocked     | `@/actions/cookies`           |
| `useRouter` from `next/router` | Blocked     | `next/navigation`             |
| `cn` from `@udecode/cn`        | Blocked     | `@/lib/utils`                 |
| `default` from `zod`           | Blocked     | Use `z` named import          |
| `../**` (parent imports)       | Blocked     | Use path aliases (`@/`, `~/`) |

---

## Key Lint Rules (oxlint)

| Rule                                     | Setting                                      |
| ---------------------------------------- | -------------------------------------------- |
| `unicorn/no-array-for-each`              | Error: use `for..of`, `map`, `reduce`        |
| `eslint/no-else-return`                  | Error: use early returns                     |
| `import/no-relative-parent-imports`      | Error: use `@/` or `~/` path aliases         |
| `import/consistent-type-specifier-style` | Error: inline type imports                   |
| `typescript/no-explicit-any`             | Warn (only `src/lib/types.ts` may use `any`) |
| `unicorn/filename-case`                  | Error: kebab-case                            |
