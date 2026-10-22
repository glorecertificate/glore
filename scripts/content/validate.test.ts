import { rmSync } from 'node:fs'

import { afterEach, describe, expect, it } from 'vitest'

import { LOCALES } from './config.mts'
import { FIXTURE_SLUG, courseJson, createFixture, lessonText, questionYaml } from './fixture.ts'
import { checkContent, formatProblems } from './validate.mts'

let fixture: ReturnType<typeof createFixture> | undefined

const setup = () => {
  fixture = createFixture()
  return fixture
}

const EM_DASH = String.fromCharCode(0x2014)

const messages = (root: string) => checkContent(root).problems.map(({ file, message }) => `${file}: ${message}`)

afterEach(() => {
  fixture?.remove()
  fixture = undefined
})

describe('checkContent', () => {
  it('accepts the committed content', () => {
    const { problems } = checkContent()

    expect(formatProblems(problems)).toBe('')
  }, 30_000)

  it('accepts a complete fixture course', () => {
    const { root } = setup()

    expect(messages(root)).toEqual([])
  })

  it('reports a missing locale file', () => {
    const { base, root } = setup()
    rmSync(`${root}/${base}/lessons/1.es.md`)

    expect(messages(root)).toEqual([`${base}/lessons/1.es.md: missing file`])
  })

  it('reports a missing localized title and description', () => {
    const { base, root, write } = setup()
    write(
      `${base}/course.json`,
      courseJson({ description: { en: 'Only English' }, title: { en: 'T', es: '', it: 'T' } })
    )

    const found = messages(root)
    expect(found.some(message => message.includes('title.es: must not be empty'))).toBe(true)
    expect(found.some(message => message.includes('description.es'))).toBe(true)
    expect(found.some(message => message.includes('description.it'))).toBe(true)
  })

  it('rejects questions with too few options or no single correct option', () => {
    const { base, root, write } = setup()
    for (const locale of LOCALES) write(`${base}/lessons/1.${locale}.md`, lessonText(locale, questionYaml(0, 1)))

    const found = messages(root)
    expect(found).toContain(`${base}/lessons/1.en.md: questions[0]: needs at least 2 options, found 1`)

    for (const locale of LOCALES) write(`${base}/lessons/1.${locale}.md`, lessonText(locale, questionYaml(9, 3)))
    expect(messages(root)).toContain(`${base}/lessons/1.en.md: questions[0]: needs exactly one correct option, found 0`)

    for (const locale of LOCALES) {
      write(
        `${base}/lessons/1.${locale}.md`,
        lessonText(
          locale,
          'questions:\n  - question: Q?\n    options:\n      - text: A\n        correct: true\n      - text: B\n        correct: true\n    explanation: x\n'
        )
      )
    }
    expect(messages(root)).toContain(`${base}/lessons/1.en.md: questions[0]: needs exactly one correct option, found 2`)
  })

  it('requires an explanation per question', () => {
    const { base, root, write } = setup()
    for (const locale of LOCALES) {
      write(
        `${base}/lessons/1.${locale}.md`,
        lessonText(locale, questionYaml().replace('    explanation: Because.\n', ''))
      )
    }

    expect(messages(root).some(message => message.includes('questions[0].explanation'))).toBe(true)
  })

  it('requires the final assessment of a skill course in its last lesson', () => {
    const { base, root, write } = setup()
    for (const locale of LOCALES) {
      write(`${base}/lessons/2.${locale}.md`, lessonText(locale, 'evaluations:\n  - I can do it.\n'))
    }

    expect(messages(root)).toEqual([`${base}: a skill course needs a final assessment in its last lesson (lesson 2)`])

    for (const locale of LOCALES) {
      write(`${base}/lessons/1.${locale}.md`, lessonText(locale, `assessment: Rate.\n${questionYaml()}`))
      write(`${base}/lessons/2.${locale}.md`, lessonText(locale, 'assessment: Rate.\n'))
    }
    expect(messages(root)[0]).toMatch(/exactly one assessment/u)
  })

  it('forbids assessments and skill groups on other course types', () => {
    const { base, root, write } = setup()
    write(`${base}/course.json`, courseJson({ type: 'learner' }))

    const found = messages(root)
    expect(found).toContain(`${base}/course.json: learner courses must not have a skillGroup`)
    expect(found.some(message => message.includes('learner courses must not have an assessment'))).toBe(true)
  })

  it('rejects an unknown or missing skill group', () => {
    const { base, root, write } = setup()
    write(`${base}/course.json`, courseJson({ skillGroup: 'made-up' }))
    expect(messages(root)).toContain(`${base}/course.json: skillGroup "made-up" is not in skill-groups.json`)

    write(`${base}/course.json`, courseJson({ skillGroup: undefined }))
    expect(messages(root)).toContain(`${base}/course.json: a skill course needs a skillGroup`)
  })

  it('rejects unknown front matter keys and lesson file names', () => {
    const { base, root, write } = setup()
    write(`${base}/lessons/1.en.md`, '---\ntitle: T\nextra: 1\n---\nBody')
    write(`${base}/lessons/1.fr.md`, '---\ntitle: T\n---\nBody')
    write(`${base}/lessons/notes.txt`, 'x')

    const found = messages(root)
    expect(found).toContain(`${base}/lessons/1.en.md: unknown key "extra"`)
    expect(found.some(message => message.includes('1.fr.md: unknown locale "fr"'))).toBe(true)
    expect(found.some(message => message.includes('notes.txt: unexpected entry'))).toBe(true)
  })

  it('rejects Markdown the editor does not support', () => {
    const { base, root, write } = setup()
    write(
      `${base}/lessons/1.en.md`,
      lessonText('en', questionYaml(), '# Big\n\n```\ncode\n```\n\n![x](https://a.b/c.png)')
    )

    const found = messages(root)
    expect(found).toContain(`${base}/lessons/1.en.md: unsupported Markdown: a level 1 heading (start at ##)`)
    expect(found).toContain(`${base}/lessons/1.en.md: unsupported Markdown: a "code_block" node`)
    expect(found).toContain(`${base}/lessons/1.en.md: unsupported Markdown: a "img" node`)
  })

  it('rejects an empty body', () => {
    const { base, root, write } = setup()
    write(`${base}/lessons/1.en.md`, lessonText('en', questionYaml(), ''))

    expect(messages(root)).toEqual([`${base}/lessons/1.en.md: the lesson body is empty`])
  })

  it('rejects lesson number gaps and mismatched slugs', () => {
    const { base, root, write } = setup()
    for (const locale of LOCALES) write(`${base}/lessons/4.${locale}.md`, lessonText(locale, 'assessment: Rate.\n'))
    write(`${base}/course.json`, courseJson({ slug: 'other-name' }))

    const found = messages(root)
    expect(found).toContain(`${base}/lessons: lesson 3 has no files (numbers must run from 1 without gaps)`)
    expect(found).toContain(`${base}/course.json: slug "other-name" must match the directory name "${FIXTURE_SLUG}"`)
  })

  it('rejects translations that drift from the English structure', () => {
    const { base, root, write } = setup()
    write(`${base}/lessons/1.es.md`, lessonText('es', questionYaml(2, 3)))
    write(`${base}/lessons/1.it.md`, lessonText('it', questionYaml(1, 4)))

    const found = messages(root)
    expect(found).toContain(
      `${base}/lessons/1.es.md: questions[0]: the correct option is #3, ${base}/lessons/1.en.md has #2`
    )
    expect(found).toContain(`${base}/lessons/1.it.md: questions[0]: has 4 options, ${base}/lessons/1.en.md has 3`)
  })

  it('rejects em and en dashes in course files', () => {
    const { base, root, write } = setup()
    write(`${base}/course.json`, courseJson({ durationMinutes: 20, title: { en: `A ${EM_DASH} B`, es: 'T', it: 'T' } }))

    expect(messages(root).some(message => message.includes('course.json: line') && message.includes('dashes'))).toBe(
      true
    )
  })

  it('reports every problem instead of stopping at the first', () => {
    const { base, root, write } = setup()
    write(`${base}/lessons/1.en.md`, '---\ntitle: T\nextra: 1\n---\nBody')
    write(`${base}/lessons/2.es.md`, 'no front matter')
    write(`${base}/course.json`, courseJson({ skillGroup: 'made-up', title: { en: 'T' } }))

    expect(messages(root).length).toBeGreaterThanOrEqual(4)
  })

  it('flags colliding sort orders within a type and group', () => {
    const { root, write } = setup()
    write('courses/second-skill/course.json', courseJson({ slug: 'second-skill' }))
    for (const locale of LOCALES) {
      write(`courses/second-skill/lessons/1.${locale}.md`, lessonText(locale, 'assessment: Rate.\n'))
    }

    expect(messages(root).filter(message => message.includes('sortOrder collides'))).toHaveLength(2)
  })
})
