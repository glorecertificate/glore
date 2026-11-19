import { ARROW_PATHS } from '@/components/features/certificates/pdf-assets'

export type IconNode = [string, Record<string, string>][]

export interface CertificatePdfSkill {
  description: string | null
  iconNode?: IconNode | null
  level: number
  levelLabel?: string | null
  name: string
  steps: number
}

export interface CertificatePdfData {
  activity: {
    duration: number | null
    endDate: string | null
    location: string | null
    startDate: string | null
    tasks: string[]
  }
  code: string | null
  holder: {
    birthPlace: string | null
    birthday: string | null
    firstName: string
    lastName: string | null
    nationality: string | null
  }
  issuedAt: string | null
  organization: {
    legalRepresentative: string | null
    logoUrl: string | null
    name: string
    signatureUrl: string | null
  }
  qrPath: string | null
  qrSize: number
  skills: CertificatePdfSkill[]
  verifyUrl: string | null
}

export interface CertificatePdfLabels {
  at: string
  date: string
  dateOfBirth: string
  from: string
  headingAfter: string
  headingBefore: string
  headingHighlight: string
  hours: string
  level: string
  levels: string[]
  mainTasks: string
  nationality: string
  partnership: string
  placeOfBirth: string
  representedBy: string
  tasksIntro: string
  title: string
  to: string
  verify: string
  volunteering: string
}

export type CertificateInput = Omit<CertificatePdfData, 'qrPath' | 'qrSize' | 'skills' | 'verifyUrl'> & {
  skills: (Omit<CertificatePdfSkill, 'iconNode'> & { icon: string | null })[]
}

export const PAGE_WIDTH = 595.28
export const PAGE_HEIGHT = 841.89

export const NAVY = '#315070'
export const NAME_COLOR = '#305071'
export const GREEN = '#7fbf73'
export const GRAY = '#f0f0f0'
export const LEVEL_GRAY = '#3c4045'
export const BANNER = '#345372'
export const WHITE = '#ffffff'

const ARROW_OPACITY = 0.12

const fade = (hex: string) => {
  const channel = (index: number) => {
    const value = Number.parseInt(hex.slice(index, index + 2), 16)
    return Math.round(255 - ARROW_OPACITY * (255 - value))
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(1)}${channel(3)}${channel(5)}`
}

export const FADED_ARROWS = ARROW_PATHS.map(path => ({ ...path, fill: fade(path.fill) }))

export const ARROWS_BOX = { height: 306.5, left: 256, top: 19.5, width: 319.5 }
export const LOGO_BOX = { height: 86, left: 20, top: 18, width: 218 }
export const BANNER_BOX = {
  height: 22.7,
  left: 24.7,
  minWidth: 194.3,
  paddingHorizontal: 4,
  paddingTop: 0.5,
  top: 105.3,
}
export const EMBLEM_BOX = { height: 34.1, left: 397.5, top: 767.9, width: 150.1 }
export const EMBLEM_SRC = '/certificate/erasmus-plus.png'

const TEMPLATE_FONT_ASCENT = 1.056
const ROBOTO_FONT_ASCENT = 1900 / 2048
const ROBOTO_FONT_DESCENT = 500 / 2048
export const ROBOTO_LINE_HEIGHT = ROBOTO_FONT_ASCENT + ROBOTO_FONT_DESCENT
export const BANNER_TRACKING = -0.0123
export const HEADING_TRACKING = 0.712

export const textShift = (fontSize: number) => (TEMPLATE_FONT_ASCENT - ROBOTO_FONT_ASCENT) * fontSize

export const placed = (top: number, fontSize: number) => ({ fontSize, top: top + textShift(fontSize) })

export const baselineTop = (top: number, fontSize: number, lineHeight: number) =>
  top +
  (TEMPLATE_FONT_ASCENT - (lineHeight - ROBOTO_FONT_ASCENT - ROBOTO_FONT_DESCENT) / 2 - ROBOTO_FONT_ASCENT) * fontSize

export const NAME_BOX = { firstTop: 137, left: 23.6, lastTop: 173, width: 230 }
export const PERSONAL = { barTop: 230.3, barHeight: 38.7, left: 45.3, size: 9, tops: [227, 243, 259] }
export const SECTION_BAR = { left: 26.9, width: 2.8 }
export const VOLUNTEERING = { barHeight: 173.9, barTop: 299, headingTop: 296.1 }
export const TASKS_SECTION = { barHeight: 184.4, barTop: 503.3, headingTop: 499, introTop: 521.6 }
export const HEADING_SIZE = 13.2286
export const HEADING_LEFT = 46.1
export const ROW_LEFT = 46.1
export const VOLUNTEERING_LEFT = 45.66

export const PERIOD_ROW = { top: 322.8, width: 175.24 }
export const PERIOD_FROM = { flex: 52.4, lineHeight: 10.3, marginLeft: 1.34, marginRight: 3.48 }
export const PERIOD_TO = { flex: 80.6, lineHeight: 10.3, marginLeft: 2.32, marginRight: 0 }
export const HOURS_ROW = { flex: 1, lineHeight: 10.2, marginLeft: 1.64, marginRight: 0, top: 340.8, width: 78.44 }
export const LOCATION_ROW = { flex: 1, lineHeight: 10.2, marginLeft: 2.44, marginRight: 0, top: 358.8, width: 175.24 }
export const REPRESENTED_ROW = { flex: 1, lineHeight: 10.5, marginLeft: 5.7, marginRight: 0, top: 676.8, width: 171.3 }
export const ROW_LINE_WIDTH = 0.75
export const ROW_LINE_PADDING = 1.5
export const ROW_VALUE_TOP = 0.6
export const PARTNERSHIP_TOP = 385.1

export const PARTNER_TOP = 417.2
const PARTNER_BOTTOM = 472.9
export const PARTNER_LEFT = 46.1
const PARTNER_WIDTH = 68
const PARTNER_FULL_WIDTH = 174.8
export const PARTNER_LINE_HEIGHT = 1.2
export const PARTNER_LOGO = { height: 54.6, left: 119.2, top: 418, width: 90.7 }

const PARTNER_CHAR_WIDTH = 0.62
const PARTNER_FONT_SIZES = [10.0464, 9, 8, 7, 6.5] as const

export const partnerWidth = (logoUrl: string | null) => (logoUrl ? PARTNER_WIDTH : PARTNER_FULL_WIDTH)

const partnerLines = (name: string, fontSize: number, width: number) => {
  const perLine = Math.max(1, Math.floor(width / (PARTNER_CHAR_WIDTH * fontSize)))
  return name.split(/\s+/u).reduce(
    (state, word) => {
      const chunks = Math.max(1, Math.ceil(word.length / perLine))
      if (state.used > 0 && state.used + 1 + word.length <= perLine) {
        return { lines: state.lines, used: state.used + 1 + word.length }
      }
      return { lines: state.lines + chunks, used: word.length - (chunks - 1) * perLine }
    },
    { lines: 0, used: 0 }
  ).lines
}

export const partnerFontSize = (name: string, width = PARTNER_WIDTH) =>
  PARTNER_FONT_SIZES.find(
    size => partnerLines(name, size, width) * size * PARTNER_LINE_HEIGHT <= PARTNER_BOTTOM - PARTNER_TOP
  ) ?? PARTNER_FONT_SIZES.at(-1)!

export const TASK_LEFT = 46.3
export const TASK_TOP = 550.6
export const TASK_PITCH = 40
export const TASK_GAP = 3
export const TASK_WIDTH = 158.7
export const TASK_LINE_HEIGHT = 1.2
export const TASKS_INTRO_WIDTH = 172
export const TASKS_INTRO_LINE_HEIGHT = 1.3
const MAX_TASKS = 4

const TASK_BOTTOM = 672
const TASK_SIGNED_BOTTOM = 643
const TASK_CHAR_WIDTH = 0.45
const TASK_BREAK_LOSS = 10
const TASK_FONT_SIZES = [10, 9.5, 9, 8.5, 8, 7.5, 7]

const taskLines = (task: string, fontSize: number) => {
  const limit = Math.max(1, Math.floor(TASK_WIDTH / (fontSize * TASK_CHAR_WIDTH)))
  const chunk = Math.max(1, limit - TASK_BREAK_LOSS)
  return `\u2022 ${task}`.split(/\s+/u).reduce(
    ({ length, lines }, word) => {
      if (word.length > limit) return { length: word.length % chunk, lines: lines + Math.ceil(word.length / chunk) }
      return length === 0 || length + 1 + word.length > limit
        ? { length: word.length, lines: lines + 1 }
        : { length: length + 1 + word.length, lines }
    },
    { length: 0, lines: 0 }
  ).lines
}

const taskHeight = (task: string, fontSize: number) => taskLines(task, fontSize) * fontSize * TASK_LINE_HEIGHT

const flowHeight = (tasks: string[], fontSize: number) =>
  tasks.reduce((height, task) => height + taskHeight(task, fontSize), TASK_GAP * Math.max(0, tasks.length - 1))

const fitsPitch = (tasks: string[], bottom: number) =>
  tasks.every(
    (task, index) =>
      taskHeight(task, 10) <= TASK_PITCH - TASK_GAP && TASK_TOP + index * TASK_PITCH + taskHeight(task, 10) <= bottom
  )

export const taskPlan = (allTasks: string[], signed: boolean) => {
  const tasks = allTasks.filter(Boolean).slice(0, MAX_TASKS)
  const bottom = signed ? TASK_SIGNED_BOTTOM : TASK_BOTTOM
  if (fitsPitch(tasks, bottom)) return { flow: false as const, size: 10, tasks }
  const size = TASK_FONT_SIZES.find(candidate => flowHeight(tasks, candidate) <= bottom - TASK_TOP) ?? 7
  return { flow: true as const, size, tasks }
}

export const SIGNATURE_BOX = { height: 28, left: 112, top: 646, width: 100 }
export const DATE_TOP = 708.3
export const DATE_SIZE = 10.0464
export const QR_BOX = { left: 46.1, size: 52, top: 735 }
export const VERIFY_BOX = { left: 106, top: 742, width: 130 }

export const HEADING_RIGHT = { left: 264.8, lineHeight: 1.2, size: 11, top: 187, width: 290 }

export const SKILL_LABEL_TOPS = [226.5, 355.1, 482.7, 610.3]
export const SKILL_DESCRIPTION_OFFSETS = [28.28, 27.28, 27.28, 27.28]
export const SKILL_DOT_OFFSETS = [85.1, 84.1, 84.1, 84.1]
export const SKILL_LEVEL_OFFSETS = [86.75, 85.75, 85.75, 85.75]
export const SKILL_LABEL_RAISE = [0.62, 0, 0, 0]
export const SKILL_LABEL = { height: 22.9, left: 269.3, paddingLeft: 7, paddingRight: 14.8, paddingTop: 1 }
export const SKILL_ICON = { height: 14.3, offset: 1, width: 14.6 }
export const SKILL_NAME = { marginLeft: 6.7, size: 11 }
export const SKILL_DESCRIPTION = { left: 269.1, lineHeight: 1.4, maxLines: 3, size: 10, width: 280.4 }
export const DOT_SIZE = 11.2
export const DOT_LEFTS = [269.3, 304.8, 340.4, 375.9, 411.5]
export const LEVEL_RIGHT = PAGE_WIDTH - 543.3
export const LEVEL_SIZE = 9
export const LEVEL_SPACE_TRACKING = -1.2

export const formatDate = (value: string | null) => {
  if (!value) return ''
  const [year, month, day] = value.slice(0, 10).split('-')
  if (!(year && month && day)) return ''
  return `${day}.${month}.${year}`
}

export const nameSize = (value: string) => Math.min(36, Math.floor(400 / Math.max(value.length, 1)))

export const skillNameSize = (value: string) => Math.min(11, Math.floor(3300 / Math.max(value.length, 1)) / 10)

const LONG_WORD = 20
const LONG_WORD_PARTS = /.{1,10}/gu

export const hyphenate = (word: string) => (word.length > LONG_WORD ? (word.match(LONG_WORD_PARTS) ?? [word]) : [word])

export const softHyphenate = (text: string) =>
  text
    .split(/(\s+)/u)
    .map(part => hyphenate(part).join('\u00AD'))
    .join('')

const BANNER_SIZE = 15.9
const BANNER_ADVANCE_FALLBACK = 600
const BANNER_ADVANCES: Record<string, number> = {
  ' ': 248,
  '&': 622,
  "'": 175,
  ',': 197,
  '-': 276,
  '.': 264,
  '/': 413,
  A: 652,
  B: 623,
  C: 651,
  D: 656,
  E: 568,
  F: 553,
  G: 681,
  H: 713,
  I: 272,
  J: 552,
  K: 627,
  L: 539,
  M: 873,
  N: 713,
  O: 688,
  P: 631,
  Q: 688,
  R: 616,
  S: 594,
  T: 597,
  U: 648,
  V: 637,
  W: 887,
  X: 627,
  Y: 601,
  Z: 599,
}

const bannerWidth = (title: string) =>
  Array.from(title.toUpperCase().normalize('NFD').replaceAll(/\p{M}/gu, '')).reduce(
    (width, char) => width + (BANNER_ADVANCES[char] ?? BANNER_ADVANCE_FALLBACK),
    0
  )

const BANNER_MAX_WIDTH = bannerWidth('Soft skills certificate') + 5

export const titleSize = (title: string) =>
  Math.min(BANNER_SIZE, (BANNER_SIZE * BANNER_MAX_WIDTH) / Math.max(bannerWidth(title), 1))

export const skillDots = (skill: Pick<CertificatePdfSkill, 'level' | 'steps'>) => {
  const steps = Math.min(DOT_LEFTS.length, skill.steps)
  return { level: Math.max(0, Math.min(steps, skill.level)), steps }
}

export const PDF_LABEL_KEYS = [
  'at',
  'date',
  'dateOfBirth',
  'from',
  'headingAfter',
  'headingBefore',
  'headingHighlight',
  'hours',
  'level',
  'mainTasks',
  'nationality',
  'partnership',
  'placeOfBirth',
  'representedBy',
  'tasksIntro',
  'title',
  'to',
  'verify',
  'volunteering',
] as const

export type PdfLabelKey = (typeof PDF_LABEL_KEYS)[number]
