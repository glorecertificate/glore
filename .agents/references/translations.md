# Translations and team content

Design of the team-edited copy, shipped in v0.7. Decisions U18 to U20 are in `decisions.md`. Re-verify each detail against the code before you act on it.

## Goal

The GloRe team edits all team-owned copy in the app, with no pull request or deploy: UI strings, legal texts, docs, course translations, and contact settings.

Nothing an editor saves can break a page.

## Principles

- Code owns keys, message structure, and default copy in `messages/{locale}.json`. Developers add keys with features, as today.
- The database owns everything the team edits. The bundled catalog is always the fallback.
- An override is validated against the current `en` signature when it is saved and again at runtime, so a deploy that changes a key never breaks rendering.
- Crowdin is removed. A translation management system can later sync through its API into drafts. The database stays the source of truth.

## Constraints found in code

- Production precompiles messages (`next.config.ts`, `precompile: !isDevServer`), and the precompiled formatter returns a plain string as-is.
  - Overrides are compiled with `icu-minify/compile` before the merge.
  - A production-build e2e test proves interpolation.
- Five loaders read catalogs, and all go through one `loadMessages(locale)`:
  - `src/i18n.ts` and `getClientMessages` (`src/actions/i18n.ts`)
  - `messagesFor` (`src/lib/email.ts`) and `generate-pdf.ts`
  - `src/emails/translate.ts` with the template defaults.
- Email and cron render outside a request, so the loader is a plain cached function with no request APIs.
- Issued certificate PDFs re-render with the current labels. The approval snapshot stores the labels, so an issued certificate never changes wording.
- `Help`, `About`, and `Intl.Countries` are read raw (`useMessages`, `getMessages`). Overrides may change wording, not add entries.
- Message types come from `typeof messages/en.json`, so overrides leave the type surface unchanged.
- Skill groups already have a name, description, and icon editor (`saveSkillGroup`).

## Data model

### Messages

- `message_overrides`:
  - `id`, `locale`, `key` (dotted path), `namespace`
  - `value` (published ICU, null keeps the bundled value) and `draft_value`
  - `source_hash` (`en` bundled value at edit time) and `base_hash` (this locale's bundled value at edit time)
  - `origin` (`human`, `machine`, `import`, `tms`) and `external_id`
  - `updated_by_id`, `published_by_id`, `published_at`, timestamps
  - unique `(locale, key)`, index `(locale, namespace)`, partial index on pending drafts.
- `message_override_revisions`: append-only `id`, `locale`, `key`, `value`, `action` (`draft`, `publish`, `reset`, `discard`), `actor_id`, `created_at`.

### Legal

- `legal_documents`: `slug` (`privacy`, `terms`, `quality-charter`), `requires_acceptance`, `current_version_id`.
- `legal_versions`:
  - `id`, `document_slug`, `version`, `status` (`draft`, `published`, `superseded`)
  - `material`, `change_note`, `effective_at`, `published_at`, `published_by_id`
  - unique `(document_slug, version)`. Published rows are immutable in the mutation layer.
- `legal_translations`: key `(version_id, locale)`, `title`, `body` (Markdown), `status` (`draft`, `machine`, `reviewed`), `source_hash`, `updated_by_id`, `reviewed_by_id`, `updated_at`.
- `legal_acceptances`: `id`, `user_id`, `version_id`, `locale`, `accepted_at`. Unique `(user_id, version_id)`.

### Content and settings

- `content_translations`:
  - key `(entity_type, entity_id, locale)` for `course`, `lesson`, `doc_article`, `doc_category`, `skill_group`
  - `status` (`machine`, `draft`, `reviewed`), `source_hash`, `translated_by_id`, `reviewed_by_id`, `updated_at`
  - index `(locale, status)`. The `IntlRecord` JSON stays in its row.
- `doc_articles.languages text[]`: per-locale publishing, as courses have.
- `app_settings`: `key`, `value jsonb`, `updated_by_id`, `updated_at`, for contact email, phone, website, social links, and legal entity. `config/metadata.json` stays the default.

## Runtime

- `src/lib/messages.ts` `loadMessages(locale)` layers the bundled catalog over `en` for gaps, then applies published overrides that pass three checks:
  - the key exists in `en`
  - the `messageSignature` tokens match the current `en`
  - compilation succeeds in production.
- `messageSignature` moves from `scripts/i18n/catalogs.mts` to `src/lib/icu.ts`, shared by the script, the editor, and the loader. `icu-minify` becomes a direct dependency.
- Overrides load in an inner `'use cache'` function with `cacheLife('max')` and `cacheTag(messagesTag(locale))`. The merge is memoized per locale and overrides version.
- Publishing calls `updateTag(messagesTag(locale))`. An `en` publish expires every locale. Draft preview uses an editor-only cookie and `{ cache: false }`.
- Legal reads the current published version through `legalTag(slug)` and keeps the `en` fallback banner. Settings read through `CacheTag.Settings`.
- If entries go stale across Vercel instances, the override loader moves to `'use cache: remote'`.

## Stale overrides

- The editor classifies each override against the deployed bundle:
  - `orphaned`: the key was removed. The loader ignores it, and the editor offers to delete it.
  - `incompatible`: arguments or tags changed. It is disabled at runtime.
  - `outdated`: `en` changed since the edit. It applies with a flag.
  - `redundant`: it equals the bundle. Cleanup removes it.
- `pnpm run i18n:overrides --target <env>` reports counts. `pnpm run i18n:pull` folds published overrides back into `messages/*.json` through a normal PR.
- `scripts/i18n/rename-key.mts` renames a key in every catalog and emits the SQL that moves its overrides.
- The daily cron notifies admins when stale overrides exist.

## Workflows

### Translations and content

- Translations page (`/translations`, shipped outside the admin layout so editors can reach it):
  - a virtualized table with en, es, and it side by side, searchable by key, text, and namespace
  - filters: missing, overridden, outdated, orphaned, unreviewed
  - inline ICU validation and preview, reset to default, publish, history, and "Suggest with AI".
- Content: the course, doc, and skill group editors show a status per locale (missing, machine, draft, reviewed, outdated).
  - "Translate with AI" translates Plate text leaves, keeps the structure, and saves with status `machine`.
  - A person marks the translation `reviewed`.
- AI calls go through `generateTextWithFallback` (`src/lib/ai.ts`) behind `requireEditor` and a rate limit. ICU output is re-validated, and the prompt carries the style rules in `patterns.md`.

### Legal

- Admins edit a draft version, publish it with `effective_at` and `material`, and keep history. Heading parity moves from `check:i18n` to publish time.
- Terms acceptance: registration and onboarding record acceptance of the current terms.
  - A `material` terms version sends signed-in users to `/legal/accept` from the dashboard layout, never from `proxy.ts`.
  - Privacy stays informational, and counsel confirms the scope.

## Roles

- Editors draft and publish non-protected namespaces, courses, docs, skill groups, and legal drafts and translations.
- Admins also publish legal versions, edit settings, own the protected namespaces (`CertificatePdf`, `CertificatePublic`, `Legal`, `Metadata`, and `Email` subjects), and delete stale overrides.

## Audit

- New events: `messages.published`, `messages.reset`, `legal.version_published`, `legal.accepted`, `content.translation_reviewed`.
- Also `course.locale_published`, `doc.locale_published`, `skill_group.updated`, and `settings.updated`.
- `AUDIT_ACTIONS` gains `content` and `legal` categories. Per-key history lives in the revisions table.

## Retirement

- `content/` stays as seed fixtures for local, staging, and e2e. `content:import --target production` refuses once any course or doc exists, unless `--bootstrap` is passed.
- `content/legal` seeds the legal tables on a fresh database only.
- `crowdin.yml` and the Crowdin sections of `workflow.md` and `README.md` are deleted.

## New locales

- A locale gets `status: "beta"` in `config/i18n.json`, visible to team roles only. `check:i18n` allows gaps for beta locales because `en` sits underneath.
- Developers may add an AI-drafted `messages/<locale>.json`, and the team reviews it in the Translations page.
- Courses and docs stay unpublished in the new locale until translated, legal falls back to `en`, and `CertificatePdf` labels need an admin review.
- Hard-coded locale lists (`account-form.tsx`, `onboarding/schema.ts`, `scripts/content/config.mts`, `scripts/seed-demo-copy.ts`) read `LOCALES` instead.

## Tests

- Vitest: merge, signature filter, compile, hashes, stale classification, and AI output validation with a mocked model.
- DB-backed Vitest: legal immutability and publish transactions.
- e2e: `translations.spec.ts`, `legal.spec.ts`, and `content-translation.spec.ts`.
- A `@prod` smoke run on `next build` and `next start`, because precompile runs only in builds.
- Mailpit checks an overridden email subject.
