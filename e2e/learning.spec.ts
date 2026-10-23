import { expect, test } from '@playwright/test'

import { type Actor, actAs } from './actors'
import { type Tenant, createTenant, removeTenant, withDb } from './tenant'

test.describe.configure({ mode: 'serial', timeout: 120_000 })

const COURSE = 'welcome-to-glore'

let tenant: Tenant
let learner: Actor

const answer = async (actor: Actor, question: number, option: string) => {
  const group = actor.page.getByRole('radiogroup').nth(question)
  await group.getByRole('radio', { name: option }).click()
  await group.locator('xpath=following::button[normalize-space()="Check answer"][1]').click()
}

const completedLessons = async (userId: string) =>
  await withDb(async pool => {
    const result = await pool.query<{ total: string }>(
      `select count(*) as total from user_lessons ul
       join lessons l on l.id = ul.lesson_id
       join courses c on c.id = l.course_id
       where ul.user_id = $1 and c.slug = $2`,
      [userId, COURSE]
    )
    return Number(result.rows[0]?.total ?? 0)
  })

const ratingCount = async (userId: string) =>
  await withDb(async pool => {
    const result = await pool.query<{ total: string }>(
      'select count(*) as total from course_ratings where user_id = $1 and rating = 5',
      [userId]
    )
    return Number(result.rows[0]?.total ?? 0)
  })

test.beforeAll(async ({ browser }) => {
  tenant = await createTenant('learning', [{ key: 'learner', role: 'learner' }])
  learner = await actAs(browser, tenant.users.learner!)
})

test.afterAll(async () => {
  await learner?.close()
  if (tenant) await removeTenant(tenant)
})

test('a learner starts an introductory course and the lessons record their progress', async () => {
  const { page } = learner
  await page.goto(`/courses/${COURSE}`)
  await expect(page.getByText('Not started').first()).toBeVisible()
  await page.getByRole('button', { name: 'Start course' }).first().click()
  await expect(page).toHaveURL(new RegExp(`/courses/${COURSE}/learn`, 'u'))
  const proceed = page.getByRole('button', { name: 'Complete and continue' })
  await proceed.click()
  await expect(page.getByText('Lesson 2 of 3')).toBeVisible()
  await proceed.click()
  await expect(page.getByText('Lesson 3 of 3')).toBeVisible()
  await expect(page.getByText('2 of 3 lessons completed')).toBeVisible()
  await expect.poll(() => completedLessons(tenant.users.learner!.id)).toBe(2)
})

test('the quiz explains a wrong answer, accepts a retry, and gates the course end', async () => {
  const { page } = learner
  await expect(page.getByText('Answer every question correctly to continue.')).toBeVisible()
  await answer(learner, 0, 'The GloRe team in Milan')
  await expect(page.getByText('Not quite. Read the explanation and try again.')).toBeVisible()
  await expect(page.getByText(/Tutors from your own organization review requests/u)).toBeVisible()
  await answer(learner, 0, 'A tutor in your organization')
  await expect(page.getByText('Correct').first()).toBeVisible()
  await answer(learner, 1, 'At least three skill courses with an average rating of 3 out of 5 or more')
  await answer(learner, 2, 'By scanning the QR code, which leads to the public page marked as verified')
  await expect(page.getByText('Correct')).toHaveCount(3)
})

test('finishing the course asks for a rating and records it', async () => {
  const { page } = learner
  await page.getByRole('button', { name: 'Finish course' }).click()
  await expect(page).toHaveURL(new RegExp(`/courses/${COURSE}/complete`, 'u'))
  await expect(page.getByText('Your rating helps us improve the course and helps others choose.')).toBeVisible()
  await expect(page.getByText('Recommended next')).toBeVisible()
  await page.locator('label[for^="course-rating-"][for$="-5"]').click()
  await page.getByRole('button', { name: 'Send rating' }).click()
  await expect.poll(() => ratingCount(tenant.users.learner!.id)).toBe(1)
  expect(await completedLessons(tenant.users.learner!.id)).toBe(3)
})

test('the completed course shows in the course list as done and keeps the learner out of certificates', async () => {
  const { page } = learner
  await page.goto(`/courses/${COURSE}`)
  await expect(page.getByText('Completed').first()).toBeVisible()
  await page.goto('/dashboard')
  await expect(page.getByRole('link', { name: 'Certificates', exact: true })).toBeHidden()
})
