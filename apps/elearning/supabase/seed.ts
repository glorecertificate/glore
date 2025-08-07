import 'dotenv/config'

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { createSeedClient } from '@snaplet/seed'
import { type User } from '@supabase/supabase-js'
import OpenAI from 'openai'

import { log as baseLog, noop } from '@repo/utils'

import { dynamicSeeds, staticSeeds } from './.snaplet/data.json'
import { seedOrganizations } from './seeds/organization'
import { seedSkills } from './seeds/skill'
import { seedUsers } from './seeds/user'

const CACHE = '.temp/output.json'

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o'

const AI_SEED_INSTRUCTION =
  process.env.AI_SEED_INSTRUCTION ||
  `
    You are generating seeds for a Supabase database.
    The output_text must always be a valid plain JSON object, without extra characters, unuseful spacing or markdown indicators (eg: '\`\`\`json').
    Use the JSON provided below as a schema, and return an object with the format requested including the different translations.
    Example JSON: ${JSON.stringify(dynamicSeeds)}
  `

const AI_SEED_INPUT =
  process.env.AI_SEED_INPUT ||
  `
    Return an object with equal structure and:
    - 4 different unique skill groups
    - 8 unique skills per group
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
  'The previous output was wrong, regenerate it making sure that only valid JSON is returned in the requested format.'

const args = process.argv.slice(2)
const ai = !(args.includes('--no-ai') || !process.env.OPENAI_API_KEY)
const hasCache = !args.includes('--no-cache')
const dryRun = args.includes('--dry-run')
const reset = !args.includes('--skip-reset')
const silent = args.includes('--silent')

const cache = resolve(import.meta.dirname, CACHE)

const log = silent
  ? Object.assign(noop, {
      error: noop,
      warn: noop,
      success: noop,
      info: noop,
    })
  : baseLog

const includes = (seed: string) => args.filter(arg => !arg.startsWith('--')).length === 0 || args.includes(seed)

const jsonChat = async (input: string, retry = 0): Promise<typeof dynamicSeeds> => {
  const openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  try {
    const { output_text } = await openAI.responses.create({
      model: OPENAI_MODEL,
      instructions: AI_SEED_INSTRUCTION,
      input,
    })
    return JSON.parse(output_text.replace(/```(json)?/g, '')) as typeof dynamicSeeds
  } catch (error) {
    if (retry < 3) {
      log.warn(`Failed to parse JSON output, retrying (${retry + 1}/3)`)
      return jsonChat([RETRY_MESSAGE, input.replace(RETRY_MESSAGE, '')].join(' '), retry + 1)
    }
    log.error('Failed to parse JSON output after 3 retries')
    throw error
  }
}

const generateData = async () => {
  if (hasCache && existsSync(cache)) {
    log.info('Using cached seed data')
    return JSON.parse(readFileSync(cache, 'utf-8')) as typeof dynamicSeeds
  }
  if (!ai) {
    log('Using static seed data')
    return dynamicSeeds
  }
  log('Generating seed data...')

  const data = await jsonChat(AI_SEED_INPUT)
  const [dir] = cache.split('/').slice(-2)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(cache, JSON.stringify(data, null, 2))
  log.success('Seed data generated')
  return data
}

const logUsers = (users: User[]) => {
  if (users.length === 0) return log.error('No users created')
  if (users.length === staticSeeds.users.length) return log.success(`Created ${users.length} users`)
  log.warn(`Created ${users.length} users out of ${staticSeeds.users.length}`)
}

void (async () => {
  try {
    const { skill_groups } = await generateData()
    const seed = await createSeedClient({ dryRun })

    if (reset) {
      log('Resetting database...')
      await seed.$resetDatabase()
      log.success('Database reset')
    }

    const users = await seedUsers()
    logUsers(users)

    if (includes('org') || includes('organization')) {
      const store = await seedOrganizations(seed, users)
      log.success(`Created ${store.regions.length} regions with ${store.organizations.length} organization`)
    }

    if (includes('course')) {
      const store = await seedSkills(seed, skill_groups, users)
      log.success(`Created ${store.skills.length} skills grouped in ${store.skill_groups.length} groups`)
      log.success(`Created ${store.courses.length} courses with ${store.lessons.length} lessons`)
    }

    process.exit(0)
  } catch (error) {
    throw error as Error
  }
})()
