# Courses and translation

Course authoring, the AI writing assistant, content and interface translation, and skill level descriptions. Roles and the other features: `app.md`. Message catalogs and `useTranslations`: `patterns.md`, "Internationalization".

## Courses

- Editors and admins author multilingual content in Plate.js with AI assistance.
- Ordered lessons hold rich text, multiple-choice questions, evaluations (self-assessment prompts), and one final assessment per lesson (skill courses only, last step).
- Members see an overview and enroll with an explicit Start, which records the locale. Progress is binary per lesson.
- Start and the first lesson open one confirmation dialog. Confirming enrolls the member and opens the first lesson.
- A lesson link of a course that is not started shows a start prompt, not a redirect.
- Volunteers keep a skill compass (up to 3 strengths, 5 goals) that drives course recommendations.
- The server grades quizzes and returns the explanation of each answer. There are no streaks or leaderboards (D15).
- Publication states: archived, draft, partial, published.
- Course types: `intro` (all members, not skill-linked, no assessment), `skill` (volunteers, counts toward certification, has assessment), `learner` (learners, not skill-linked, no assessment).

## AI writing assistant

- The Plate.js editor offers slash commands (`/api/v1/ai/command`: generate, improve, summarize, translate).
- An editor may send 20 commands a minute (`ai:command:<id>`) and 150 an hour (`ai-command:<id>`). Past a limit the route answers 429.
- Google Gemini only, through `@ai-sdk/google` and `GEMINI_API_KEY` (free tier).
- The model chain is `aiModels` in `config/app.json` (`gemini-3.8-flash`, then `gemini-3.5-flash-lite`). `GEMINI_MODEL` is an optional override tried first.
- `src/lib/ai.ts` moves to the next model when one fails before any text streams (404 retired, 429 quota, 5xx).
- It also moves on when a model sends no first token within `aiFirstTokenMs`, because an overloaded model queues requests instead of failing. The last model has no limit.
- A failure after streaming starts is an error part.
- A missing key answers 503 `ai_not_configured`.
- The menu shows a translated error with retry.

## Content translation

- `content_translations` has one row per entity (`course`, `lesson`, `doc_article`, `doc_category`, `skill_group`) and non-default locale: status (`machine`, `draft`, `reviewed`), `source_hash`, translator and reviewer.
- `classifyTranslation` (`db/queries/content-translation.ts`) derives the state. No content is `missing`, content without a row is `draft`, and a `source_hash` that differs from the current English text is `outdated`.
- A course covers its title, description, and outcomes. Each lesson is its own target (title, content, questions, options, evaluations, assessment descriptions).
- A manual save in a non-default locale sets `draft` and keeps the old hash, so a stale locale stays `outdated` until re-translation.
- Doc categories have no editor UI. No screen marks a translation as reviewed. Old `content.translation_reviewed` events keep their audit label.
- `translateEntity` (`actions/translations/ai.ts`) translates one entity per call and has no UI caller left. Human text needs `overwrite`.
- AI translation is limited to 150 an hour per editor (`content-translate:<id>`, `RATE_LIMITED`). Every translation write expires `CacheTag.ContentTranslations` (`expireTranslationCaches`).
- It validates keys, placeholders, link URLs, and length before saving as `machine`. `src/lib/translate.ts` skips code blocks, inline code, and text without letters.

### Editors

- The course editor translates with AI from any language that has text.
- The Translate button beside the lesson tabs lists the other languages that have text for the current lesson ("Translate from <language>", or a message when none has).
- A selection translates the lesson title, body, and activities (questions, options, explanations, evaluations, assessment) into the editing language and replaces the text there without confirmation.
- It is disabled for an unsaved lesson. There is no whole-course translation. The course title and description have their own field menus (shown while the field is focused) with the same source list.
- Both menus call `POST /api/v1/ai/translate` (NDJSON stream, 2 runs per user, 3000 units an hour). The result lands in the draft as unsaved changes and is the current text.
- A result is dropped if the field changed after the run started. The normal save path applies (`markTranslationsEdited`). There is no per-field origin and no review step in the course editor.
- The doc article editor uses the same flow on the draft (`docs/article-editor/translation.tsx`, `field-translate-button.tsx`): the title and excerpt have focus-revealed field menus, and the Translate menu beside the language tabs translates title, excerpt, and body (as a Plate value, saved back as markdown).
- It has no status or review step.
- The skill group dialog (Add and Edit, `skill-framework/group-dialog.tsx`) uses the same flow on its own state.
- It has the icon picker first, language tabs with a status dot (green when the locale has a name and a description, grey otherwise, plus a warning dot for unsaved edits), one name input and one description textarea.
- Each label row has an always visible translate button (`group-field-translate.tsx`) with a source menu of the other locales that have text for the field (a disabled message when none).
- The result lands in the dialog as unsaved text and saves with the dialog. There are no review cards.

### Publishing and coverage

- `doc_articles.languages` publishes a doc per locale next to the `published` master switch, and unpublished locales are blanked for non-editors.
- Changing `courses.languages` or `doc_articles.languages` records `course.locale_published` or `doc.locale_published`.
- The editor dashboard shows Content health (a complete-share bar and a check matrix of all live courses, needing work first, that scrolls on its own, with a `View all N courses` link to `/courses`) beside an informative Translation gaps card (`actions/translations/coverage.ts`).
- Gaps count, per kind of content and locale, the parts with no text in that locale. From `xl`, the two cards share one row and one height.

## Skill level descriptions

- A skill course's final assessment holds three descriptions, one per `skill_level` (`intermediate`, `good`, `advanced`).
- Each is an `IntlRecord` of at most 200 characters (`skill_level_descriptions`, unique on assessment and level, deleted with the assessment).
- Only admins and editors write them. Tutors and members never edit them. Volunteers see them without the level, in an order that says nothing about it (`certificates.md`, "Blind level choice").
- The editor edits them in the final assessment card of the last lesson (`course-editor/lesson-activities.tsx`, `LevelsItem`), added through "Add activity".
- On a skill course the card shows the three level fields instead of the prompt, with a 200-character counter each.
- They live in the editor state (`assessment.levelDescriptions`, `tempId()` for new rows) and save through the normal course save (`context.tsx`).
- `upsertLevelDescriptions` and `deleteLevelDescriptions` (`actions/courses/management.ts`) require an editor, at most 200 characters, and a skill course. A row emptied in every locale is deleted.
- Only editors load the rows with the course (`buildCourseWith`, `catalog: false`).
- They are fields of the last lesson's translation entity (`lessonTarget`), so the course translation popover and the coverage count them with the lesson. The editor tab percentages count them too.

### Seeding and reads

- `pnpm run content:levels --target <local|qa|staging|production>` reads the `levels:` map of each skill course's last lesson (`content/README.md`) and inserts the missing rows.
- It never updates an existing row and is allowed on production. It marks the lesson as `machine` in `es` and `it`. `db:seed` runs the same insert (`scripts/seed-levels.mts`).
- Read path for other features: `fetchLevelDescriptions(courseIds)` (`actions/courses/level-descriptions.ts`, cached, tag `courses`) resolves the rows through each course's assessment.
- It returns `Record<courseId, Partial<Record<SkillLevel, IntlRecord & { id }>>>`, built by the pure `parseSkillLevelDescriptions`.

## Interface translations

- `/translations` (`app/(dashboard)/translations/page.tsx`) edits interface text. It sits outside the admin layout because editors reach it, as `/emails` does.
- `/admin/translations` redirects to it (`next.config.ts`). The nav entry `admin-translations` (group `content`, `visible: isTeam`) sits before `admin-emails`.
- The sidebar shows the `content` group (translations, email previews, legal documents) under its own Content label, apart from the Admin group.
- `loadTranslations` (`actions/translations.ts`) calls `authorizeEditor`, then returns the three bundled catalogs and every override. `maxDuration` is 60.
- The table (`features/translations/`) is a real `<table>` virtualized with `@tanstack/react-virtual`: one row per `en` key, a cell per locale, and state badges.
- Below `md` the list scrolls with the page through `useWindowVirtualizer` (`translation-list.tsx`, `'use no memo'` because the React Compiler would cache the visible rows).
- From `md` it keeps the fixed-height inner scroller with a sticky header. The choice follows `matchMedia`, and the editor sheet is the same on both.
- URL params (`translations-params.ts`): `filter`, `key` (opens the editor sheet), `namespace`, `q`.
- Filters (`TRANSLATION_STATES`): missing, overridden, outdated, incompatible, orphaned, unreviewed. Rows, filters, and counts are pure helpers in `lib/translation-table.ts`.

### Editing

- `LocaleEditor` validates as you type with `validateOverride` (`lib/message-validation.ts`, client-safe) and previews ICU through `lib/message-preview.ts`.
- Save draft, publish, discard, and reset live in `actions/messages.ts`, with shared guards in `actions/message-helpers.ts`. `listMessageHistory` returns 30 revisions.
- Protected namespaces (`PROTECTED_NAMESPACES`) need `requireAdmin` on the server and show "Admins only" to editors.
- Deleting an override whose key left the `en` bundle (orphaned) is admin only.
- `suggestMessage` drafts `es` and `it` text with the AI chain (`lib/message-suggestion.ts`). It needs `GEMINI_API_KEY`, allows 40 calls per hour per user, saves origin `machine`, and never publishes.
- A suggestion that fails `validateOverride` is dropped with `AI_INCOMPATIBLE`, `AI_INVALID`, or `AI_EMPTY`.
- All page copy is in the `Translations` namespace.

### Override scripts

- `pnpm run i18n:overrides --target <local|staging|production>` counts overrides per locale and stale state. It reads inside a read-only transaction.
- `pnpm run i18n:pull --target <env>` writes published overrides in the `current` state into `messages/*.json` (`--include-outdated`, `--dry-run`) for a normal PR. It never touches the database.
- `scripts/i18n/rename-key.mts <old> <new>` renames a key in every catalog and prints the SQL for `message_overrides` and `message_override_revisions`. It does not run it.
- The scripts import `classifyOverride` through `#lib/*`, so `lib/message-overrides.ts` and `lib/message-validation.ts` use relative imports.

### Stale override notice

- Daily maintenance runs `notifyStaleOverrides` (`actions/maintenance/stale-overrides.ts`). It counts incompatible and orphaned overrides and records `messages.stale` for platform admins, in-app only.
- It repeats only when the counts change or after 7 days, and links to `/translations?filter=orphaned` or `incompatible`.
