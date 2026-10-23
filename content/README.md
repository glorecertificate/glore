# Content

Course, skill group, and documentation content for GloRe, written as files and imported into the database.

Authors write Markdown and JSON only. The importer converts lesson Markdown to the Plate values the course editor stores, so imported lessons render and edit like hand-made ones. Docs are stored as the Markdown strings the docs editor uses.

## Layout

```
content/
  skill-groups.json              the 4 skill groups, in the old platform order
  courses/<slug>/                the real catalog, one directory per course
    course.json
    lessons/<n>.<locale>.md      one file per lesson and locale (en, es, it)
  examples/<slug>/               format examples, same layout, never imported by default
  docs/
    categories.json              the doc categories (intro, tutorials, faq)
    <category>/<slug>/           one directory per doc article
      doc.json
      <locale>.md                en.md, es.md, it.md
  legal/                         seed texts for the legal tables, inserted by `db:seed` and this script only into an empty database
```

The directory name is the course slug. Lesson numbers start at 1 and have no gaps. A lesson needs all three locale files.

## `skill-groups.json`

An array of groups. Every key is required.

```json
{
  "slug": "work-skills",
  "icon": "briefcase",
  "sortOrder": 3,
  "name": { "en": "Work skills", "es": "Habilidades laborales", "it": "Competenze lavorative" },
  "description": { "en": "...", "es": "...", "it": "..." }
}
```

The slug is the upsert key and must match the database row. Icons are lucide names listed in `config/icons.json`.

## `course.json`

| Key               | Rule                                                                            |
| ----------------- | ------------------------------------------------------------------------------- |
| `slug`            | Kebab-case, at least 3 characters, equal to the directory name. The upsert key. |
| `type`            | `intro`, `skill`, or `learner`.                                                 |
| `skillGroup`      | A group slug. Required for `skill`, forbidden for the other types.              |
| `icon`            | A lucide name from `config/icons.json`.                                         |
| `title`           | `{ en, es, it }`, all non-empty.                                                |
| `description`     | `{ en, es, it }`, all non-empty.                                                |
| `durationMinutes` | Integer from 5 to 600.                                                          |
| `outcomes`        | `{ en: [..], es: [..], it: [..] }`, 1 to 8 non-empty strings per locale.        |
| `sortOrder`       | Positive integer, unique per type and skill group among the real courses.       |

Unknown keys are errors.

## Lesson files

`lessons/<n>.<locale>.md` is a YAML front matter block followed by the lesson body in Markdown.

| Front matter key | Rule                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `title`          | Required.                                                                                                                                |
| `questions`      | Optional list of quiz questions: `question`, `options` (2 to 6 items with `text` and optional `correct: true`), `explanation`.           |
| `evaluations`    | Optional list of self-assessment prompts (strings).                                                                                      |
| `assessment`     | Optional prompt for the final assessment. A `skill` course has exactly one, in its last lesson. `intro` and `learner` courses have none. |

Rules that keep the three locales in step:

- Every locale file of a lesson has the same number of questions, the same number of options per question, the same correct option position, the same number of evaluations, and the same assessment presence.
- Write each paragraph on one line. A line break inside a paragraph is an error, so do not hard-wrap.
- Quote a YAML value that contains a colon followed by a space, or that starts with a quote, `[`, `{`, `*`, `&`, `!`, `%`, `@`, or a backtick.
- Never use em or en dashes anywhere in `content/`. The validator rejects them.

### Markdown the editor supports

Headings `##` to `####` (the lesson title is already the page title, so `#` is an error), paragraphs, **bold**, _italic_, ~~strikethrough~~, links (`http`, `https`, `mailto`), bullet and numbered lists (nested too), quotes, horizontal rules, and tables.

Not supported, and rejected by the validator: inline code, code blocks, images, raw HTML, task lists, and level 1 headings. The lesson body must not be empty.

The player shows a lesson's quiz, evaluations, or assessment below its body. Keep one kind of activity per lesson unless the player work says otherwise; the example puts the evaluations and the assessment together in the last lesson.

## Example course

`content/examples/example-skill/` is a complete skill course of three lessons. It is the smallest valid course and the reference for the format.

`course.json`:

```json
{
  "slug": "example-skill",
  "type": "skill",
  "skillGroup": "work-skills",
  "icon": "book-open",
  "title": { "en": "Example: course format", "es": "Ejemplo: formato de curso", "it": "Esempio: formato del corso" },
  "description": { "en": "...", "es": "...", "it": "..." },
  "durationMinutes": 15,
  "outcomes": { "en": ["Read a lesson written in Markdown"], "es": ["..."], "it": ["..."] },
  "sortOrder": 1
}
```

`lessons/2.en.md` (a quiz lesson; `2.es.md` and `2.it.md` mirror it):

```md
---
title: Quiz lesson
questions:
  - question: Which option is correct?
    options:
      - text: The first option
      - text: The second option
        correct: true
      - text: The third option
    explanation: Exactly one option per question is marked correct.
---

Introduce the quiz in the lesson body. The questions appear below it.
```

`lessons/3.en.md` (the last lesson of a skill course):

```md
---
title: Self-assessment
evaluations:
  - I can describe one situation where I used this skill.
assessment: Overall, how would you rate your level in this skill?
---

Ask the learner to think about a real example before they rate themselves.
```

## Docs

The documentation lives under `/docs` and holds three categories, whose slugs are fixed by the app routes: `intro` (`/docs/intro`), `tutorials` (`/docs/tutorials`), and `faq` (`/docs/faq`). Each doc is an article at `/docs/articles/<slug>`.

### `docs/categories.json`

An array of categories. Every key is required, and `title` and `description` need all three locales.

```json
{
  "slug": "faq",
  "sortOrder": 3,
  "title": { "en": "Frequently asked questions", "es": "...", "it": "..." },
  "description": { "en": "...", "es": "...", "it": "..." }
}
```

### `docs/<category>/<slug>/doc.json`

| Key         | Rule                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `slug`      | Kebab-case, at most 100 characters, equal to the directory name. Unique across all categories. |
| `sortOrder` | Positive integer, unique inside the category. The list shows articles in this order.           |

The parent directory is the category and must be listed in `categories.json`. Unknown keys are errors.

### `<locale>.md`

A YAML front matter block with `title` (up to 200 characters) and `excerpt` (up to 1,000 characters; the card shows two lines), then the article body in Markdown. All three locale files are required and the body must not be empty.

```md
---
title: How long does a review take?
excerpt: It depends on your organization. Your tutor sees the request as soon as you send it.
---

Body in Markdown, one paragraph per line.
```

Rules on top of the lesson rules (no hard wraps, quoting, no em or en dashes):

- The docs page renders plain Markdown, so tables and strikethrough are errors. Headings `##` to `####`, **bold**, _italic_, bullet and numbered lists, quotes, rules, and links work.
- Links may be `http`, `https`, `mailto`, or an app path that starts with `/`, such as `/courses` or `/docs/articles/<slug>`. A `/docs/articles/<slug>` link must point to a doc that exists.
- The three locales have the same structure: the same headings, lists, quotes, and paragraphs in the same order. Translate, do not restructure.
- Slugs are global, so name them for what they answer: `faq-cost`, `tutorial-tutor`, `what-is-glore`.

### What `content:check` and `content:import` do for docs

`content:check` validates docs together with courses and prints the doc counts. It rejects missing locale files, unknown categories, duplicate slugs, `sortOrder` collisions, bad front matter, unsupported Markdown, broken `/docs/articles/` links, and translations whose structure differs from `en.md`.

`content:import` upserts categories and articles by slug in the same transaction as the courses, with the same `--target` guard, `--drafts`, and `--dry-run` flags. `--remove` and `--examples` do not touch docs.

- Without `--drafts` (local and staging) articles are `published`. With `--drafts` (always on production) new articles are drafts and existing ones keep their `published` state, so an import never unpublishes anything. The same rule applies to `doc_articles.languages`: articles import with all three locales, and drafts import with none.
- The docs tables have no order column, and the app lists by `created_at`. The importer therefore sets `created_at` from `sortOrder` (a fixed date plus one minute per step), so the order is the same on every environment. Articles an editor adds in the app sort after the imported ones.
- Re-running reports every row as unchanged. A changed article gets a new `updated_at`.
- Docs that disappear from `content/` are not deleted; delete them in the docs UI.

## Validate

```sh
pnpm run content:check
```

Checks every file without touching a database and prints every problem with its path, then exits 1. It rejects:

- missing locale files, lesson number gaps, and unexpected files
- missing or empty localized titles, descriptions, and outcomes
- questions with fewer than 2 options, more than 6, or not exactly one correct option, and questions without an explanation
- a skill course without its final assessment in the last lesson, with more than one, or with a missing skill group
- assessments in `intro` and `learner` courses
- unknown keys in `course.json` and front matter
- translations whose questions, options, correct option, evaluations, or assessment differ from the English file
- Markdown that converts to anything the editor does not support, and empty bodies
- em and en dashes, duplicate slugs, and colliding `sortOrder` values
- invalid docs (see "Docs")

## Import

```sh
pnpm run content:import --target local
```

`--target` is required. The import validates first and writes nothing if there is a problem. It runs in one transaction.

| Flag                  | Effect                                                                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--target local`      | Needs a `DATABASE_URL` on localhost or 127.0.0.1.                                                                                                   |
| `--target staging`    | Needs a non-local `DATABASE_URL`. Pass it for the run: `DATABASE_URL=<neon staging url> pnpm run content:import --target staging`.                  |
| `--target production` | Needs a non-local `DATABASE_URL` and always imports as drafts. Refuses `--examples` and `--remove`, and refuses once any course or doc exists.      |
| `--bootstrap`         | Production only: import even though courses or docs exist. The team edits production content in the app, so use it only on a release day.           |
| `--drafts`            | Import with empty `languages`, so courses stay drafts. An existing course keeps its current `languages`.                                            |
| `--examples`          | Also import `content/examples/`.                                                                                                                    |
| `--dry-run`           | Do everything, then roll back, and print the counts.                                                                                                |
| `--remove <slug>`     | Remove a course with its lessons and progress, instead of importing. Repeatable. Refused when certificates reference the course, and on production. |

Without `--drafts`, `languages` is set to `en`, `es`, `it`, which the validator guarantees are complete.

### What the import does

- Upserts skill groups and courses by slug. `creator_id` stays null on new courses and is never changed on existing ones. Archived courses stay archived.
- Identifies lessons by course plus number (`sort_order`). Lessons beyond the last number are deleted with their activities and progress.
- Matches questions, options, and evaluations to existing rows by position inside a lesson, updates what changed, and adds or deletes the tail.
- Is idempotent: a second run reports every row as unchanged and writes nothing.
- Keeps learner progress for anything that did not change, including lesson completion for lessons that stay. A changed question, a changed or flipped option, a changed evaluation, or a changed assessment removes the learner answers and ratings stored for that item, because they no longer describe the same content.

Courses that disappear from `content/` are not deleted; use `--remove`.
