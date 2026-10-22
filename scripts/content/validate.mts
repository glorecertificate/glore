import { LOCALES, type Locale } from './config.mts'
import { loadDocs, validateDocs } from './docs.mts'
import {
  type LessonFile,
  type LoadedContent,
  type LoadedCourse,
  type LoadedLesson,
  type Problem,
  loadContent,
} from './load.mts'
import { findUnsupportedContent, markdownTextLength, markdownToPlate } from './markdown.mts'
import { MAX_OPTIONS, MIN_OPTIONS } from './schema.mts'

const REFERENCE_LOCALE: Locale = LOCALES[0]

const lessonPath = (course: LoadedCourse, number: number, locale: Locale) =>
  `${course.path}/lessons/${number}.${locale}.md`

const validateQuestions = (lesson: LessonFile) => {
  const problems: Problem[] = []
  for (const [index, question] of lesson.questions.entries()) {
    const where = `questions[${index}]`
    const correct = question.options.filter(option => option.correct).length
    if (question.options.length < MIN_OPTIONS) {
      problems.push({
        file: lesson.path,
        message: `${where}: needs at least ${MIN_OPTIONS} options, found ${question.options.length}`,
      })
    }
    if (question.options.length > MAX_OPTIONS) {
      problems.push({
        file: lesson.path,
        message: `${where}: allows at most ${MAX_OPTIONS} options, found ${question.options.length}`,
      })
    }
    if (correct !== 1) {
      problems.push({ file: lesson.path, message: `${where}: needs exactly one correct option, found ${correct}` })
    }
  }
  return problems
}

const validateBody = (lesson: LessonFile) => {
  const value = markdownToPlate(lesson.body)
  if (markdownTextLength(value) === 0) return [{ file: lesson.path, message: 'the lesson body is empty' }]
  return findUnsupportedContent(value).map(issue => ({ file: lesson.path, message: `unsupported Markdown: ${issue}` }))
}

const correctIndexes = (lesson: LessonFile) =>
  lesson.questions.map(question => question.options.findIndex(option => option.correct))

const compareToReference = (reference: LessonFile, lesson: LessonFile) => {
  const problems: Problem[] = []
  const add = (message: string) => problems.push({ file: lesson.path, message })

  if (lesson.questions.length !== reference.questions.length) {
    add(`has ${lesson.questions.length} questions, ${reference.path} has ${reference.questions.length}`)
  }
  const shared = Math.min(lesson.questions.length, reference.questions.length)
  const referenceCorrect = correctIndexes(reference)
  const lessonCorrect = correctIndexes(lesson)
  for (let index = 0; index < shared; index++) {
    if (lesson.questions[index].options.length !== reference.questions[index].options.length) {
      add(
        `questions[${index}]: has ${lesson.questions[index].options.length} options, ${reference.path} has ${reference.questions[index].options.length}`
      )
      continue
    }
    if (lessonCorrect[index] !== referenceCorrect[index]) {
      add(
        `questions[${index}]: the correct option is #${lessonCorrect[index] + 1}, ${reference.path} has #${referenceCorrect[index] + 1}`
      )
    }
  }
  if (lesson.evaluations.length !== reference.evaluations.length) {
    add(`has ${lesson.evaluations.length} evaluations, ${reference.path} has ${reference.evaluations.length}`)
  }
  if (Boolean(lesson.assessment) !== Boolean(reference.assessment)) {
    add(
      `${lesson.assessment ? 'has' : 'lacks'} an assessment, ${reference.path} ${reference.assessment ? 'has' : 'lacks'} one`
    )
  }
  return problems
}

const validateLesson = (course: LoadedCourse, lesson: LoadedLesson) => {
  const problems: Problem[] = []
  for (const locale of LOCALES) {
    if (lesson.files[locale] || lesson.invalid.includes(locale)) continue
    problems.push({ file: lessonPath(course, lesson.number, locale), message: 'missing file' })
  }

  for (const file of Object.values(lesson.files)) {
    problems.push(...validateBody(file), ...validateQuestions(file))
  }

  const present = LOCALES.filter(locale => lesson.files[locale])
  const referenceLocale = lesson.files[REFERENCE_LOCALE] ? REFERENCE_LOCALE : present[0]
  const reference = referenceLocale && lesson.files[referenceLocale]
  if (!reference) return problems
  for (const locale of present) {
    const file = lesson.files[locale]
    if (file && file !== reference) problems.push(...compareToReference(reference, file))
  }
  return problems
}

const lessonHasAssessment = (lesson: LoadedLesson) => Object.values(lesson.files).some(file => file.assessment)

const validateAssessments = (course: LoadedCourse) => {
  const problems: Problem[] = []
  const withAssessment = course.lessons.filter(lessonHasAssessment)
  const last = course.lessons.at(-1)

  if (course.meta?.type !== 'skill') {
    for (const lesson of withAssessment) {
      problems.push({
        file: `${course.path}/lessons/${lesson.number}.*.md`,
        message: `${course.meta?.type ?? 'this'} courses must not have an assessment`,
      })
    }
    return problems
  }
  if (withAssessment.length === 0) {
    problems.push({
      file: course.path,
      message: `a skill course needs a final assessment in its last lesson${last ? ` (lesson ${last.number})` : ''}`,
    })
  }
  if (withAssessment.length > 1) {
    problems.push({
      file: course.path,
      message: `a skill course has exactly one assessment, found it in lessons ${withAssessment.map(({ number }) => number).join(', ')}`,
    })
  }
  if (withAssessment.length === 1 && last && withAssessment[0] !== last) {
    problems.push({
      file: course.path,
      message: `the assessment is in lesson ${withAssessment[0].number}, it must be in the last lesson (${last.number})`,
    })
  }
  return problems
}

const validateCourse = (content: LoadedContent, course: LoadedCourse) => {
  const problems: Problem[] = []
  const meta = course.meta
  const file = `${course.path}/course.json`

  if (meta) {
    if (meta.slug !== course.dir) {
      problems.push({ file, message: `slug "${meta.slug}" must match the directory name "${course.dir}"` })
    }
    if (meta.type === 'skill' && !meta.skillGroup) problems.push({ file, message: 'a skill course needs a skillGroup' })
    if (meta.type === 'skill' && meta.skillGroup && !content.groups.some(group => group.slug === meta.skillGroup)) {
      problems.push({ file, message: `skillGroup "${meta.skillGroup}" is not in skill-groups.json` })
    }
    if (meta.type !== 'skill' && meta.skillGroup) {
      problems.push({ file, message: `${meta.type} courses must not have a skillGroup` })
    }
  }

  if (course.lessons.length === 0) {
    problems.push({ file: `${course.path}/lessons`, message: 'the course has no lessons' })
  }

  const numbers = new Set(course.lessons.map(({ number }) => number))
  const max = Math.max(0, ...numbers)
  for (let number = 1; number <= max; number++) {
    if (numbers.has(number)) continue
    problems.push({
      file: `${course.path}/lessons`,
      message: `lesson ${number} has no files (numbers must run from 1 without gaps)`,
    })
  }

  for (const lesson of course.lessons) problems.push(...validateLesson(course, lesson))
  problems.push(...validateAssessments(course))
  return problems
}

const duplicates = <T,>(items: T[], key: (item: T) => string) => {
  const seen = new Map<string, T[]>()
  for (const item of items) seen.set(key(item), [...(seen.get(key(item)) ?? []), item])
  return [...seen.entries()].filter(([, group]) => group.length > 1)
}

const validateCatalog = (content: LoadedContent) => {
  const problems: Problem[] = []

  for (const [slug] of duplicates(content.groups, group => group.slug)) {
    problems.push({ file: 'skill-groups.json', message: `duplicate group slug "${slug}"` })
  }
  for (const [order] of duplicates(content.groups, group => String(group.sortOrder))) {
    problems.push({ file: 'skill-groups.json', message: `duplicate sortOrder ${order}` })
  }

  const withMeta = content.courses.flatMap(course => (course.meta ? [{ course, meta: course.meta }] : []))
  for (const [slug] of duplicates(withMeta, ({ meta }) => meta.slug)) {
    problems.push({ file: 'courses', message: `duplicate course slug "${slug}"` })
  }
  const shipped = withMeta.filter(({ course }) => !course.example)
  for (const [key, group] of duplicates(
    shipped,
    ({ meta }) => `${meta.type}/${meta.skillGroup ?? ''}/${meta.sortOrder}`
  )) {
    for (const { course } of group) {
      problems.push({
        file: `${course.path}/course.json`,
        message: `sortOrder collides with another course in the same type and group (${key})`,
      })
    }
  }

  for (const course of content.courses) problems.push(...validateCourse(content, course))
  return problems
}

export const checkContent = (root?: string) => {
  const { content, problems } = loadContent(root)
  const loadedDocs = loadDocs(root)
  const all = [...problems, ...validateCatalog(content), ...loadedDocs.problems, ...validateDocs(loadedDocs.docs)]
  const unique = all.filter(
    (problem, index) =>
      all.findIndex(other => other.file === problem.file && other.message === problem.message) === index
  )
  return { content, docs: loadedDocs.docs, problems: unique.toSorted((a, b) => a.file.localeCompare(b.file)) }
}

export const formatProblems = (problems: Problem[]) =>
  problems.map(({ file, message }) => `content/${file}: ${message}`).join('\n')
