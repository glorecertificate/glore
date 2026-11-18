import { expect, test } from '@playwright/test'

import { type Actor, actAs, certificateIdFromUrl, fillExperience, rateOrganization, submitFromLastStep } from './actors'
import { type Tenant, certificateSkillLevels, createTenant, removeTenant, withDb } from './tenant'

test.describe.configure({ mode: 'serial', timeout: 180_000 })

let tenant: Tenant
let volunteer: Actor
let tutor: Actor
let certificateId = 0
let chosenText = ''
let chosenLevel = ''

const levelOf = async (text: string, courseId: number) =>
  await withDb(async pool => {
    const result = await pool.query<{ level: string }>(
      `select d.level from skill_level_descriptions d
       join assessments a on a.id = d.assessment_id
       join lessons l on l.id = a.lesson_id
       where l.course_id = $1 and d.description->>'en' = $2`,
      [courseId, text]
    )
    return result.rows[0]?.level ?? ''
  })

const storedChoice = async (userId: string, courseId: number) =>
  await withDb(async pool => {
    const result = await pool.query<{ value: string }>(
      `select ua.value from user_assessments ua
       join assessments a on a.id = ua.assessment_id
       join lessons l on l.id = a.lesson_id
       where ua.user_id = $1 and l.course_id = $2`,
      [userId, courseId]
    )
    return result.rows[0]?.value ?? null
  })

test.beforeAll(async ({ browser }) => {
  tenant = await createTenant('blind', [
    { completedSkills: 3, inProgressSkill: true, key: 'volunteer', role: 'volunteer' },
    { key: 'tutor', role: 'tutor' },
  ])
  volunteer = await actAs(browser, tenant.users.volunteer!)
  tutor = await actAs(browser, tenant.users.tutor!)
})

test.afterAll(async () => {
  await volunteer?.close()
  await tutor?.close()
  if (tenant) await removeTenant(tenant)
})

test('the final step offers three descriptions without any level name and the choice is stored as a level', async () => {
  const { page } = volunteer
  const course = tenant.inProgressCourse!
  await page.goto(`/courses/${course.slug}/learn`)
  const choices = page.getByRole('radiogroup', { name: 'Final assessment' })
  await expect(choices.getByRole('radio')).toHaveCount(3)
  await expect(page.locator('[data-slot=level-dots]')).toHaveCount(0)
  for (const name of ['Intermediate', 'Good', 'Advanced']) {
    await expect(choices.getByText(name, { exact: true })).toHaveCount(0)
  }

  const card = choices.locator('label').nth(1)
  chosenText = ((await card.innerText()) ?? '').trim()
  await card.click()
  for (const label of await page.locator('label[for^="evaluation-"][for$="-4"]').all()) await label.click()
  await page
    .getByRole('textbox', { name: 'Your reflection' })
    .fill('I wrote this reflection to explain my choice, in my own words.')
  await page.getByRole('button', { name: 'Finish course' }).click()
  await expect(page).toHaveURL(new RegExp(`/courses/${course.slug}/complete`, 'u'))

  chosenLevel = await levelOf(chosenText, course.id)
  expect(chosenLevel).not.toBe('')
  expect(await storedChoice(tenant.users.volunteer!.id, course.id)).toBe(chosenLevel)
  await expect(page.getByRole('main').getByText(chosenText).first()).toBeVisible()
})

test('the wizard shows the chosen description read-only and a tutor can change it', async () => {
  const { page } = volunteer
  await page.goto('/certificates/new')
  await fillExperience(page)
  await page.getByRole('button', { name: 'Continue' }).click()
  const skills = page.getByRole('checkbox')
  for (let index = 0; index < 4; index++) await skills.nth(index).click()
  await expect(page.getByText(chosenText).first()).toBeVisible()
  await page.getByRole('button', { name: 'Continue' }).click()
  await rateOrganization(page)
  await page.getByRole('button', { name: 'Continue' }).click()
  await submitFromLastStep(page)
  certificateId = certificateIdFromUrl(page)
  const stored = await certificateSkillLevels(certificateId)
  expect(stored.find(row => row.course_id === tenant.inProgressCourse!.id)?.self_level).toBe(chosenLevel)

  const reviewPage = tutor.page
  await reviewPage.goto(`/certificates/${certificateId}/review`)
  await reviewPage.getByRole('button', { name: 'Start review' }).click()
  await expect(reviewPage.getByText('Review started.')).toBeVisible()
  const groups = reviewPage.getByRole('radiogroup', { name: 'Level and description' })
  await expect(groups).toHaveCount(4)
  const target = chosenLevel === 'advanced' ? /Intermediate/u : /Advanced/u
  const expected = chosenLevel === 'advanced' ? 'intermediate' : 'advanced'
  const index = stored.findIndex(row => row.course_id === tenant.inProgressCourse!.id)
  await groups.nth(index).getByRole('radio', { name: target }).click()
  await reviewPage.getByRole('textbox', { name: 'General comment' }).fill('Please check the description again.')
  await reviewPage.getByRole('button', { name: 'Request changes' }).click()
  await expect(reviewPage.getByText('Changes requested. The volunteer has been notified.')).toBeVisible()
  const after = await certificateSkillLevels(certificateId)
  expect(after.find(row => row.course_id === tenant.inProgressCourse!.id)).toMatchObject({
    level: expected,
    self_level: chosenLevel,
  })
})

test('the volunteer sees no level before the certificate is issued', async () => {
  const { page } = volunteer
  await page.goto(`/certificates/${certificateId}`)
  await expect(page.locator('[data-slot=level-dots]')).toHaveCount(0)
  const html = await page.content()
  for (const name of ['Intermediate', 'Advanced']) expect(html).not.toContain(`>${name}<`)
})
