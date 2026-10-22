import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

import { parse } from 'yaml'
import { type ZodType, type z } from 'zod'

import { CONTENT_DIR, LOCALES, type Locale } from './config.mts'
import { courseSchema, lessonFrontMatterSchema, skillGroupsSchema } from './schema.mts'

export interface Problem {
  file: string
  message: string
}

export type SkillGroupInput = z.infer<typeof skillGroupsSchema>[number]

type CourseInput = z.infer<typeof courseSchema>

export interface LessonFile {
  path: string
  title: string
  body: string
  questions: { question: string; explanation: string; options: { text: string; correct: boolean }[] }[]
  evaluations: string[]
  assessment: string | null
}

export interface LoadedLesson {
  number: number
  files: Partial<Record<Locale, LessonFile>>
  invalid: Locale[]
}

export interface LoadedCourse {
  dir: string
  path: string
  example: boolean
  meta: CourseInput | null
  lessons: LoadedLesson[]
}

export interface LoadedContent {
  root: string
  groups: SkillGroupInput[]
  courses: LoadedCourse[]
}

const FRONT_MATTER_REGEX = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n([\s\S]*))?$/u
const LESSON_FILE_REGEX = /^([1-9]\d*)\.([a-z]+)\.md$/u
const DASH_REGEX = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`, 'u')
const COURSE_ROOTS = [
  { dir: 'courses', example: false },
  { dir: 'examples', example: true },
]

const visible = (dir: string) => readdirSync(dir, { withFileTypes: true }).filter(entry => !entry.name.startsWith('.'))

const formatIssuePath = (path: PropertyKey[]) =>
  path.reduce<string>(
    (acc, part) => (typeof part === 'number' ? `${acc}[${part}]` : acc ? `${acc}.${String(part)}` : String(part)),
    ''
  )

const issueProblems = (file: string, error: z.ZodError): Problem[] =>
  error.issues.map(issue => {
    const where = formatIssuePath(issue.path)
    const message =
      issue.code === 'unrecognized_keys'
        ? `unknown key ${issue.keys.map(key => `"${key}"`).join(', ')}`
        : issue.message.replace(/^Invalid input: expected/u, 'expected')
    return { file, message: where ? `${where}: ${message}` : message }
  })

const parseWith = <T extends ZodType>(file: string, schema: T, input: unknown) => {
  const result = schema.safeParse(input)
  if (result.success) return { data: result.data as z.infer<T>, problems: [] as Problem[] }
  return { data: null, problems: issueProblems(file, result.error) }
}

const scanDashes = (file: string, raw: string): Problem[] =>
  raw
    .split('\n')
    .flatMap((line, index) =>
      DASH_REGEX.test(line) ? [{ file, message: `line ${index + 1}: em and en dashes are not allowed` }] : []
    )

const readText = (path: string) => readFileSync(path, 'utf8').replace(/^﻿/u, '').replaceAll('\r\n', '\n')

const parseJsonFile = <T extends ZodType>(root: string, path: string, schema: T) => {
  const file = relative(root, path)
  if (!existsSync(path)) return { data: null, problems: [{ file, message: 'missing file' }] }
  const raw = readText(path)
  const problems = scanDashes(file, raw)
  try {
    const parsed = parseWith(file, schema, JSON.parse(raw))
    return { data: parsed.data, problems: [...problems, ...parsed.problems] }
  } catch (e) {
    return { data: null, problems: [...problems, { file, message: `invalid JSON: ${(e as Error).message}` }] }
  }
}

export const parseLessonFile = (file: string, raw: string) => {
  const text = raw.replace(/^﻿/u, '').replaceAll('\r\n', '\n')
  const problems = scanDashes(file, text)
  const match = FRONT_MATTER_REGEX.exec(text)
  if (!match) {
    return { lesson: null, problems: [...problems, { file, message: 'missing front matter (--- block at the top)' }] }
  }

  let data: unknown
  try {
    data = parse(match[1])
  } catch (e) {
    const message = (e as Error).message.split('\n')[0]
    return { lesson: null, problems: [...problems, { file, message: `invalid YAML front matter: ${message}` }] }
  }

  const parsed = parseWith(file, lessonFrontMatterSchema, data)
  if (!parsed.data) return { lesson: null, problems: [...problems, ...parsed.problems] }

  const { assessment, evaluations, questions, title } = parsed.data
  const lesson: LessonFile = {
    path: file,
    title,
    body: (match[2] ?? '').trim(),
    questions: (questions ?? []).map(({ explanation, options, question }) => ({
      explanation,
      options: options.map(option => ({ correct: option.correct ?? false, text: option.text })),
      question,
    })),
    evaluations: evaluations ?? [],
    assessment: assessment ?? null,
  }
  return { lesson, problems: [...problems, ...parsed.problems] }
}

const loadLessons = (root: string, courseDir: string) => {
  const problems: Problem[] = []
  const lessonsDir = join(courseDir, 'lessons')
  const byNumber = new Map<number, LoadedLesson>()

  if (!existsSync(lessonsDir)) {
    return {
      lessons: [] as LoadedLesson[],
      problems: [{ file: relative(root, lessonsDir), message: 'missing lessons directory' }],
    }
  }

  for (const entry of visible(lessonsDir)) {
    const path = join(lessonsDir, entry.name)
    const file = relative(root, path)
    const match = LESSON_FILE_REGEX.exec(entry.name)
    if (!(entry.isFile() && match)) {
      problems.push({ file, message: 'unexpected entry: lesson files are named <n>.<locale>.md, with n starting at 1' })
      continue
    }
    const locale = match[2] as Locale
    if (!LOCALES.includes(locale)) {
      problems.push({ file, message: `unknown locale "${match[2]}" (expected ${LOCALES.join(', ')})` })
      continue
    }
    const parsed = parseLessonFile(file, readText(path))
    problems.push(...parsed.problems)
    const number = Number(match[1])
    const lesson = byNumber.get(number) ?? { files: {}, invalid: [], number }
    if (parsed.lesson) lesson.files[locale] = parsed.lesson
    else lesson.invalid.push(locale)
    byNumber.set(number, lesson)
  }

  return { lessons: [...byNumber.values()].toSorted((a, b) => a.number - b.number), problems }
}

const loadCourse = (root: string, dir: string, example: boolean) => {
  const path = join(root, example ? 'examples' : 'courses', dir)
  const problems: Problem[] = []

  for (const entry of visible(path)) {
    if (entry.name === 'course.json' && entry.isFile()) continue
    if (entry.name === 'lessons' && entry.isDirectory()) continue
    problems.push({ file: relative(root, join(path, entry.name)), message: 'unexpected entry in a course directory' })
  }

  const meta = parseJsonFile(root, join(path, 'course.json'), courseSchema)
  const lessons = loadLessons(root, path)
  problems.push(...meta.problems, ...lessons.problems)

  return {
    course: {
      dir,
      example,
      lessons: lessons.lessons,
      meta: meta.data,
      path: relative(root, path),
    } satisfies LoadedCourse,
    problems,
  }
}

export const loadContent = (root = CONTENT_DIR) => {
  const problems: Problem[] = []
  const groups = parseJsonFile(root, join(root, 'skill-groups.json'), skillGroupsSchema)
  problems.push(...groups.problems)

  const courses: LoadedCourse[] = []
  for (const { dir, example } of COURSE_ROOTS) {
    const base = join(root, dir)
    if (!existsSync(base)) continue
    for (const entry of visible(base)) {
      if (!entry.isDirectory()) {
        problems.push({
          file: relative(root, join(base, entry.name)),
          message: 'unexpected file: courses are directories',
        })
        continue
      }
      const loaded = loadCourse(root, entry.name, example)
      courses.push(loaded.course)
      problems.push(...loaded.problems)
    }
  }

  const content: LoadedContent = { courses, groups: groups.data ?? [], root }
  return { content, problems }
}
