# GloRe Project AI Coding Instructions

## Project Overview

GloRe is a multilingual e-learning platform for verifying volunteering activities and soft skills certification. Built as a **Turborepo monorepo** with Next.js app + Supabase backend + shared packages architecture.

## Architecture & Structure

### Monorepo Organization

- **apps/elearning/** - Next.js 15 app (main application)
- **apps/www/** - Main website (secondary)
- **packages/** - Shared libraries (`ui`, `i18n`, `utils`, `env`, `cli`)
- **config/** - Global configurations (i18n, metadata, themes, translations)

### Key Technologies

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS with custom design system via `packages/ui`
- **Build System**: Turborepo with pnpm workspaces
- **I18n**: next-intl with custom extensions for dynamic translations

## Development Workflows

### Database Operations (Critical Commands)

```bash
# Start local development (includes Supabase)
pnpm dev

# Database commands via custom CLI
pnpm db prepare     # Initialize and start local Supabase
pnpm db reset       # Reset database + run seeds
pnpm db typegen     # Generate TypeScript types from schema
pnpm db dump <name> # Create migration from schema changes
pnpm db push        # Push local changes to remote (production)
```

### Build & Deployment

```bash
# Build all packages (run this first for apps to build correctly)
pnpm build:packages

# Full project build
pnpm build

# Type checking across monorepo
pnpm type-check

# Linting with auto-fix
pnpm lint:fix
```

## Critical Conventions

### Internationalization (i18n) Patterns

- **Static translations**: Use `useTranslations('Namespace.key')`
- **Dynamic translations**: Use `t.dynamic(key)` for runtime keys (bypasses type safety)
- **Components**: Always support `locale` prop for server-side rendering
- **File structure**: `config/translations/{locale}.json` with nested namespaces
- **Localization utilities**: Use `localize(record, locale)` for JSON objects, `localizeDate()` for dates

### UI Component Architecture

- **Base components**: Located in `packages/ui/src/components`
- **App-specific components**: `apps/elearning/src/components/ui`
- **Always extend Radix UI primitives** with shadcn/ui patterns
- **Use `cn()` utility** (clsx + tailwind-merge) for conditional classes
- **Component exports**: Use named exports, avoid default exports for components
- **Styling**: Template literal strings for multi-line Tailwind classes

### Supabase Integration

- **Types**: Auto-generated in `supabase/types.ts` via `pnpm db typegen`
- **Client**: Use `createClient<Database>()` with typed interfaces
- **Migrations**: Always use `pnpm db dump <name>` to create migrations from schema changes
- **RLS**: All tables have Row Level Security enabled
- **Seeds**: TypeScript files in `supabase/seeds` for test data

### TypeScript Conventions

- **Strict configuration**: `strict: true`, `noUncheckedIndexedAccess: true`
- **Import aliases**: Use `@/` for app imports, `@glore/` for package imports
- **Interface naming**: Use `Props` suffix (e.g., `ButtonProps`)
- **Generic components**: Extend standard HTML props with intersection types

### Tailwind CSS Patterns

- **Custom design tokens**: Defined in `packages/ui/src/styles.css`
- **Component variants**: Use `class-variance-authority` (cva) for complex variants
- **Multi-line classes**: Use template literals for readability
- **Dark mode**: Use `dark:` prefix, configured via next-themes

## File & Naming Conventions

### Package Structure

- **Export pattern**: Use `exports` field in package.json for granular imports
- **Package naming**: `@glore/` prefix for internal packages
- **CLI tools**: Shell scripts in `packages/cli/scripts` called via the `glore` command

### Component Files

- **One component per file** with same-named export
- **Co-locate types** in same file as component
- **Hook files**: `use-*` prefix in `hooks` directories
- **Utility functions**: Place in `packages/utils` for reusability

### Configuration Files

- **Global config**: JSON files in `config` directory
- **Environment**: `.env` files with `packages/env` for validation
- **Prettier/ESLint**: Shared configs in `packages/dev`

## Performance Considerations

- **Bundle optimization**: `transpilePackages: ['@glore/ui']` in Next.js config
- **Image optimization**: Use Next.js `Image` with Supabase storage patterns
- **Code splitting**: Leverage Next.js App Router automatic splitting
- **Build cache**: Turborepo cache configured for CI/CD optimization

## Integration Points

- **Supabase Auth**: Integrated with Next.js middleware for protected routes
- **File uploads**: UploadThing integration for media handling
- **Analytics**: Vercel Analytics + Speed Insights configured
- **AI Features**: OpenAI SDK integration for content generation

## Common Gotchas

- **Package dependencies**: UI package must be built before apps can build
- **Database types**: Regenerate after schema changes or builds fail
- **I18n**: Server/client components handle translations differently
- **Tailwind**: Purging requires proper content paths in each package
- **Supabase**: Local/remote environments use different connection patterns

## Testing & Quality

- **Type safety**: Strict TypeScript with comprehensive type checking
- **Linting**: ESLint + Prettier with shared configurations
- **Git hooks**: Husky for pre-commit type/lint checks
- **CI/CD**: GitHub Actions for automated testing and deployment

Focus on maintaining type safety, following established patterns, and leveraging the monorepo structure for code reuse across the platform.
