import 'dotenv/config'

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

import { createSeedClient } from '@snaplet/seed'
import OpenAI from 'openai'

import { log as baseLog, noop } from '@repo/utils'

import { seeds } from 'config/database.json'

import { seedSkills } from './seeds/skill'
import { seedUsers } from './seeds/user'

const CACHE_FILE = './.temp/output.json'

const args = process.argv.slice(2)
const reset = !args.includes('--no-reset')
const cache = !args.includes('--no-cache')
const ai = !args.includes('--no-ai')
const dryRun = args.includes('--dry-run')

const included = (seed: string) => args.filter(arg => !arg.startsWith('--')).length === 0 || args.includes(seed)
const log = dryRun
  ? Object.assign(noop, {
      error: noop,
      warn: noop,
      success: noop,
      info: noop,
    })
  : baseLog

const AI_MODEL_NAME = process.env.AI_MODEL_NAME ?? 'gpt-4o'

const AI_INSTRUCTION =
  process.env.AI_INSTRUCTION ??
  `
    You are generating seeds for a Supabase database.
    The output_text must always be a valid plain JSON object, without extra characters, unuseful spacing or markdown indicators (eg: '\`\`\`json').
    Use the JSON provided below as a schema, and return an object with the format requested and the eventual different translations.
    Example JSON: ${JSON.stringify(seeds)}
  `

const AI_INPUT =
  process.env.AI_INPUT ??
  `
    Return an object using:
    - The same users
    - 4 different unique skill areas
    - 8 unique skills per area
    - 1 course per skill where the type is always 'assessment'
    - At least 4 lessons per course
    - The fist lesson must be of type 'descriptive'
    - The following lessons must be at least 4, of type 'descriptive' or 'evaluations' and randomly mixed
    - There must be only one 'assessment' lesson per course and it must be the last one
    - Keep the same structure for lesson assessments and evaluations
    All content must refer to soft skills, such as communication and leadership.
    URLs must point to real web resources and be related to the current record.
  `

const RETRY_MESSAGE =
  'Generate the output of this prompt again making sure that only valid JSON is returned in the format requested.'

const openAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const jsonChat = async (input: string, retry = 0): Promise<typeof seeds> => {
  try {
    const { output_text } = await openAI.responses.create({
      model: AI_MODEL_NAME,
      instructions: AI_INSTRUCTION,
      input,
    })
    return JSON.parse(output_text.replace(/```(json)?/g, '')) as typeof seeds
  } catch {
    if (retry < 3) {
      log.warn(`Failed to parse JSON output, retrying (${retry + 1}/3)`)
      return jsonChat([RETRY_MESSAGE, input.replace(RETRY_MESSAGE, '')].join(' '), retry + 1)
    }
    throw new Error('Failed to parse JSON output after 3 retries')
  }
}

const generateData = async () => {
  if (cache && existsSync(CACHE_FILE)) {
    log.info('Using cached seed data')
    return JSON.parse(readFileSync(CACHE_FILE, 'utf-8')) as typeof seeds
  }
  if (!ai) {
    log('Using static seed data')
    return seeds
  }
  log('Generating seed data...')
  const data = await jsonChat(AI_INPUT)
  const [dir] = CACHE_FILE.split('/').slice(-2)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2))
  log.success('Seed data generated')
  return data
}

void (async () => {
  try {
    const data = await generateData()
    const seed = await createSeedClient({ dryRun })

    if (reset) {
      log('Resetting database...')
      await seed.$resetDatabase()
      log.success('Database reset')
    }

    const users = await seedUsers(data.users)
    if (users.length === 0) log.error('No users created')
    if (users.length < data.users.length) log.warn(`Created ${users.length} users out of ${data.users.length}`)
    else log.success(`Created ${users.length} users`)

    if (included('courses')) {
      const store = await seedSkills(seed, data.skill_areas, users)
      log.success(`Created ${store.skills.length} skills grouped in ${store.skill_areas.length} areas`)
      log.success(`Created ${store.courses.length} courses with ${store.lessons.length} lessons`)
    }

    process.exit(0)
  } catch (error) {
    throw error as Error
  }
})()
