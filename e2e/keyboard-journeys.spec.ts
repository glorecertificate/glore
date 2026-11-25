import { expect, test } from '@playwright/test'

import { SEED_PASSWORD } from '~/scripts/seed-data'

import { type Actor, actAs, certificateIdFromUrl, tenantNames } from './actors'
import { clearRateLimits, removePublicCertificates, seedPublicCertificate } from './db'
import { chooseRadio, pressOn, tabTo, typeIn } from './keys'
import { clearMail, isMailpitUp, latestMailText, mailLinkPath } from './mail'
import { type Tenant, certificateRow, createTenant, draftHours, removeTenant } from './tenant'
import { membershipRoleOf, removeUserByEmail, seedInvitation, userIdOf } from './tenant-db'

const CODE = 'E2E0-KEYS-D000'

test.describe.configure({ mode: 'serial', timeout: 180_000 })

let tenant: Tenant
let volunteer: Actor
let tutor: Actor
let certificateId = 0
let newcomer = ''

test.beforeAll(async ({ browser }) => {
  test.setTimeout(120_000)
  tenant = await createTenant('keys', [
    { completedSkills: 3, inProgressSkill: true, key: 'volunteer', role: 'volunteer' },
    { key: 'tutor', role: 'tutor' },
  ])
  newcomer = `newcomer-${tenant.tag}@g2-keys.glore.test`
  volunteer = await actAs(browser, tenant.users.volunteer!)
  tutor = await actAs(browser, tenant.users.tutor!)
})

test.afterAll(async () => {
  await volunteer?.close()
  await tutor?.close()
  await removePublicCertificates([CODE])
  if (newcomer) await removeUserByEmail(newcomer)
  if (tenant) await removeTenant(tenant)
})

test('newcomer signs up and completes the profile without a pointer', async ({ browser, request }) => {
  test.skip(!(await isMailpitUp(request)), 'Mailpit is not running')
  await clearMail(request, newcomer)
  const token = await seedInvitation({ email: newcomer, role: 'volunteer', state: 'pending', tenant })
  await clearRateLimits()
  const guest = await browser.newContext({ ignoreHTTPSErrors: true, storageState: { cookies: [], origins: [] } })
  const page = await guest.newPage()
  const advance = page.getByRole('button', { name: 'Continue' })
  await page.goto(`/invite/${token}`)
  await pressOn(page, page.getByRole('button', { name: 'Send me a confirmation link' }))
  await page.goto(mailLinkPath(await latestMailText(request, newcomer), '/invite/'))
  await pressOn(page, page.getByRole('button', { name: 'Create account and accept' }))
  await expect(page).toHaveURL(/\/onboarding/u)
  await expect(page.getByText('Something went wrong')).toHaveCount(0)
  await expect(page.getByLabel('First name')).toBeFocused()

  await typeIn(page, page.getByLabel('First name'), 'Ada')
  await typeIn(page, page.getByLabel('Last name'), 'Rossi')
  await pressOn(page, advance)

  await pressOn(page, page.getByRole('button', { name: 'Date of birth' }))
  const calendar = page.locator('[data-slot=calendar]')
  await tabTo(page, calendar.getByRole('grid'))
  for (let year = 0; year < 25; year += 1) await page.keyboard.press('Shift+PageUp')
  await page.keyboard.press('Enter')
  await expect(calendar).toHaveCount(0)
  await pressOn(page, page.getByRole('combobox', { name: 'Nationality' }))
  await expect(page.getByPlaceholder(/Search/u)).toBeFocused()
  await page.keyboard.type('Italy')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('combobox', { name: 'Nationality' })).toContainText('Italy')
  await typeIn(page, page.getByLabel('Place of birth'), 'Milan, Italy')
  await pressOn(page, advance)

  await expect(page.getByRole('heading', { name: 'How can we reach you?' })).toBeVisible()
  await pressOn(page, advance)

  await typeIn(page, page.getByRole('textbox', { exact: true, name: 'Password' }), SEED_PASSWORD)
  await typeIn(page, page.getByRole('textbox', { name: 'Confirm password' }), SEED_PASSWORD)
  await pressOn(page, page.getByRole('checkbox'), 'Space')
  await pressOn(page, page.getByRole('button', { name: 'Finish' }))
  await expect(page.getByRole('heading', { name: 'Welcome, Ada' })).toBeVisible()
  await expect.poll(async () => await membershipRoleOf(tenant, await userIdOf(newcomer))).toBe('volunteer')
  await guest.close()
})

test('visitor verifies a certificate without a pointer', async ({ browser }) => {
  await seedPublicCertificate({ code: CODE, email: tenant.users.volunteer!.email, status: 'approved' })
  await clearRateLimits()
  const guest = await browser.newContext({ ignoreHTTPSErrors: true, storageState: { cookies: [], origins: [] } })
  const page = await guest.newPage()
  await page.goto('/verify')
  await typeIn(page, page.getByLabel('Certificate code'), CODE)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(`/verify/${CODE}$`, 'u'))
  await expect(page.getByText('Valid certificate')).toBeVisible()
  await guest.close()
  await removePublicCertificates([CODE])
})

test('volunteer finishes a course without a pointer', async () => {
  const { page } = volunteer
  const course = tenant.inProgressCourse!
  await page.goto(`/courses/${course.slug}/learn`)
  const choices = page.getByRole('radiogroup', { name: 'Final assessment' })
  await chooseRadio(page, choices.getByRole('radio').nth(1))
  const scores = page.locator('[id^="evaluation-"][id$="-4"]')
  for (let index = 0; index < (await scores.count()); index += 1) {
    const score = scores.nth(index)
    await chooseRadio(page, score)
  }
  await typeIn(
    page,
    page.getByRole('textbox', { name: 'Your reflection' }),
    'I wrote this reflection to explain my choice, in my own words.'
  )
  await pressOn(page, page.getByRole('button', { name: 'Finish course' }))
  await expect(page).toHaveURL(new RegExp(`/courses/${course.slug}/complete`, 'u'))
})

test('volunteer requests a certificate without a pointer', async () => {
  const { page } = volunteer
  await page.goto('/certificates')
  await pressOn(page, page.getByRole('link', { name: 'Request certificate' }))
  await expect(page).toHaveURL(/\/certificates\/new/u)

  for (const [field, weeks] of [
    ['Start date', 8],
    ['End date', 1],
  ] as const) {
    await pressOn(page, page.getByRole('button', { name: field }))
    const calendar = page.locator('[data-slot=calendar]')
    await tabTo(page, calendar.getByRole('grid'))
    for (let week = 0; week < weeks; week += 1) await page.keyboard.press('ArrowUp')
    await page.keyboard.press('Enter')
    await expect(calendar).toHaveCount(0)
    await expect(page.getByRole('button', { name: field })).toBeFocused()
  }
  await typeIn(page, page.getByLabel('Total hours'), '120')
  await typeIn(page, page.getByLabel('Where did it take place?'), 'Milan, Italy')
  await typeIn(page, page.getByRole('textbox', { name: 'Task 1' }), 'Welcomed new volunteers')
  await expect.poll(() => draftHours(tenant.users.volunteer!.id)).toBe(120)
  await pressOn(page, page.getByRole('button', { name: 'Continue' }))

  const skills = page.getByRole('checkbox')
  for (let index = 0; index < 3; index += 1) await pressOn(page, skills.nth(index), 'Space')
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(3)
  await pressOn(page, page.getByRole('button', { name: 'Continue' }))

  for (const name of ['experience', 'support', 'certificationSupport']) {
    const score = page.locator(`[id="rating-${name}-5"]`)
    await chooseRadio(page, score)
  }
  const yes = page.getByRole('radio', { name: 'Yes' })
  await chooseRadio(page, yes)
  await pressOn(page, page.getByRole('button', { name: 'Continue' }))
  await pressOn(page, page.getByRole('button', { name: 'Send request' }))
  await expect(page).toHaveURL(/\/certificates\/\d+$/u)
  certificateId = certificateIdFromUrl(page)
  await expect.poll(async () => (await certificateRow(certificateId))?.status).toBe('submitted')
})

test('tutor reviews the request without a pointer', async () => {
  const { page } = tutor
  await page.goto('/certificates')
  const row = page.getByRole('row').filter({ hasText: tenantNames(tenant, 'volunteer') })
  await pressOn(page, row.getByRole('link', { name: 'Review' }))
  await expect(page).toHaveURL(new RegExp(`/certificates/${certificateId}/review$`, 'u'))
  await expect.poll(async () => (await certificateRow(certificateId))?.status).toBe('in_review')

  const levels = page.getByRole('radiogroup', { name: 'Level and description' }).first()
  await chooseRadio(page, levels.getByRole('radio', { name: /Intermediate/u }))
  for (const name of ['engagement', 'evidence', 'reflection', 'growth']) {
    const score = page.locator(`[id="score-${name}-4"]`)
    await chooseRadio(page, score)
  }

  const approve = page.getByRole('button', { name: 'Approve', exact: true })
  await pressOn(page, approve)
  const preview = page.getByRole('dialog', { name: 'Certificate preview' })
  await expect(preview).toBeVisible()
  await expect.poll(async () => await preview.evaluate(dialog => dialog.contains(document.activeElement))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(preview).toBeHidden()
  await expect(approve).toBeFocused()

  await typeIn(
    page,
    page.getByRole('textbox', { name: 'General comment' }),
    'Please describe your tasks in more detail.'
  )
  await pressOn(page, page.getByRole('button', { name: 'Request changes' }))
  await expect(page.getByText('Changes requested. The volunteer has been notified.')).toBeVisible()
  await expect.poll(async () => (await certificateRow(certificateId))?.status).toBe('changes_requested')
})
