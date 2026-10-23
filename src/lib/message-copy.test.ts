import { readFileSync } from 'node:fs'

import { type Locale, createTranslator } from 'next-intl'
import { describe, expect, it } from 'vitest'

import en from '~/messages/en.json'
import es from '~/messages/es.json'
import itMessages from '~/messages/it.json'

const catalogs = { en, es, it: itMessages }

type Values = Record<string, number | string>

const t = (locale: keyof typeof catalogs, path: string, values?: Values) => {
  const index = path.lastIndexOf('.')
  const translator = createTranslator({
    locale: locale as Locale,
    messages: catalogs[locale] as unknown as typeof en,
    namespace: path.slice(0, index) as never,
  }) as unknown as (key: string, values?: Values) => string
  return translator(path.slice(index + 1), values)
}

describe('Dashboard count messages', () => {
  it('pluralizes published, draft, pending, and rating counts in every locale', () => {
    const published = (locale: 'en' | 'es' | 'it', partial: number, draft: number) =>
      t(locale, 'Dashboard.editor.publishedDescription', { draft, partial })
    expect(published('en', 1, 1)).toBe('1 partial, 1 draft')
    expect(published('en', 0, 2)).toBe('0 partial, 2 drafts')
    expect(published('es', 1, 1)).toBe('1 parcial, 1 borrador')
    expect(published('es', 0, 2)).toBe('0 parciales, 2 borradores')
    expect(published('it', 1, 1)).toBe('1 parziale, 1 bozza')
    expect(published('it', 0, 2)).toBe('0 parziali, 2 bozze')

    const pending = (locale: 'en' | 'es' | 'it', organizations: number, team: number) =>
      t(locale, 'Dashboard.editor.pendingDescription', { organizations, team })
    expect(pending('en', 1, 1)).toBe('1 organization application and 1 team invitation not accepted yet.')
    expect(pending('en', 0, 2)).toBe('0 organization applications and 2 team invitations not accepted yet.')
    expect(pending('es', 1, 1)).toBe('1 solicitud de organización y 1 invitación de equipo sin aceptar.')
    expect(pending('es', 2, 0)).toBe('2 solicitudes de organización y 0 invitaciones de equipo sin aceptar.')
    expect(pending('it', 1, 1)).toBe('1 candidatura di organizzazione e 1 invito al team non ancora accettato.')
    expect(pending('it', 2, 0)).toBe('2 candidature di organizzazioni e 0 inviti al team non ancora accettati.')

    const ratings = (locale: 'en' | 'es' | 'it', count: number) =>
      t(locale, 'Dashboard.editor.ratingsDescription', { count })
    expect(ratings('en', 1)).toBe('Out of 5, from 1 rating')
    expect(ratings('en', 65)).toBe('Out of 5, from 65 ratings')
    expect(ratings('es', 1)).toBe('Sobre 5, a partir de 1 valoración')
    expect(ratings('es', 65)).toBe('Sobre 5, a partir de 65 valoraciones')
    expect(ratings('it', 1)).toBe('Su 5, da 1 valutazione')
    expect(ratings('it', 65)).toBe('Su 5, da 65 valutazioni')
  })

  it('pluralizes enrollment and agreement counts', () => {
    expect(t('en', 'Dashboard.editor.engagementDescription', { count: 1 })).toBe('1 course enrollment in total')
    expect(t('en', 'Dashboard.editor.engagementDescription', { count: 4 })).toBe('4 course enrollments in total')
    expect(t('es', 'Dashboard.editor.engagementDescription', { count: 1 })).toBe('1 inscripción a cursos en total')
    expect(t('it', 'Dashboard.editor.engagementDescription', { count: 1 })).toBe('1 iscrizione ai corsi in totale')
    expect(t('it', 'Dashboard.editor.engagementDescription', { count: 2 })).toBe('2 iscrizioni ai corsi in totale')
  })
})

describe('Spanish and Italian count agreement', () => {
  it('agrees adjectives with the count', () => {
    const breakdown = (locale: 'es' | 'it', [active, pending, rejected]: number[]) =>
      t(locale, 'Admin.overview.organizationsBreakdown', { active, pending, rejected })
    expect(breakdown('es', [1, 1, 1])).toBe('1 activa, 1 pendiente, 1 rechazada')
    expect(breakdown('es', [0, 2, 3])).toBe('0 activas, 2 pendientes, 3 rechazadas')
    expect(breakdown('it', [1, 1, 1])).toBe('1 attiva, 1 in attesa, 1 rifiutata')
    expect(breakdown('it', [0, 2, 3])).toBe('0 attive, 2 in attesa, 3 rifiutate')

    const users = (locale: 'es' | 'it', banned: number) =>
      t(locale, 'Admin.overview.usersBreakdown', { admins: 1, banned, pending: 1 })
    expect(users('es', 1)).toContain('1 baneado')
    expect(users('es', 2)).toContain('2 baneados')
    expect(users('it', 1)).toContain('1 sospeso')
    expect(users('it', 2)).toContain('2 sospesi')

    const load = (locale: 'es' | 'it', open: number, reviewed: number) =>
      t(locale, 'Organization.insightsTutorLoad', { open, reviewed })
    expect(load('es', 1, 1)).toBe('1 abierta, 1 completada')
    expect(load('es', 2, 0)).toBe('2 abiertas, 0 completadas')
    expect(load('it', 1, 1)).toBe('1 aperta, 1 conclusa')
    expect(load('it', 2, 0)).toBe('2 aperte, 0 concluse')

    expect(t('es', 'CertificateOrg.closedCount', { count: 1 })).toBe('1 cerrado sin emitir')
    expect(t('es', 'CertificateOrg.closedCount', { count: 2 })).toBe('2 cerrados sin emitir')
    expect(t('it', 'CertificateOrg.closedCount', { count: 1 })).toBe('1 chiuso senza emissione')
    expect(t('it', 'CertificateOrg.closedCount', { count: 2 })).toBe('2 chiusi senza emissione')
    expect(t('es', 'CourseList.enrolledStudents', { count: 1 })).toBe('1 inscrito')
    expect(t('es', 'CourseList.enrolledStudents', { count: 2 })).toBe('2 inscritos')
    expect(t('it', 'CourseList.enrolledStudents', { count: 1 })).toBe('1 iscritto')
    expect(t('it', 'CourseList.enrolledStudents', { count: 2 })).toBe('2 iscritti')
  })
})

describe('Italian euphonic conjunction', () => {
  it('uses "ed" before words that start with e in catalogs and skill groups', () => {
    const texts = [JSON.stringify(itMessages), readFileSync('content/skill-groups.json', 'utf8')]
    for (const text of texts) {
      expect(text.match(/ e (?=[eèé][a-zàèéìòù]*)/gu)).toBeNull()
    }
  })
})

describe('Italian notification labels', () => {
  it('uses "non letta" and "non lette" instead of "da leggere"', () => {
    expect(t('it', 'Notifications.unread')).toBe('Non letta')
    expect(t('it', 'Notifications.filter_unread')).toBe('Non lette')
    expect(t('it', 'Notifications.bellUnread', { count: 1 })).toBe('Notifiche, 1 non letta')
    expect(t('it', 'Notifications.bellUnread', { count: 3 })).toBe('Notifiche, 3 non lette')
  })
})

describe('Courses quiz validation messages', () => {
  const keys = ['quizQuestionEmpty', 'quizMinOptions', 'quizOptionEmpty', 'quizNoCorrect']
  const values = { number: 2, position: 3, title: 'Active listening' }

  it('names the lesson position, its title, and the question in every locale', () => {
    for (const locale of ['en', 'es', 'it'] as const) {
      for (const key of keys) {
        const message = t(locale, `CourseEditor.${key}`, values)
        expect(message).toContain('3 (Active listening)')
        expect(message).toContain('2')
      }
    }
  })
})

describe('Learning.player quiz hints', () => {
  it('gates continuing in the gated hint and not in the open hint', () => {
    expect(t('en', 'Learning.player.quizHint', { count: 1 })).toContain('to continue')
    expect(t('en', 'Learning.player.quizHintOpen', { count: 1 })).not.toContain('continue')
    expect(t('es', 'Learning.player.quizHintOpen', { count: 1 })).not.toContain('continuar')
    expect(t('it', 'Learning.player.quizHintOpen', { count: 1 })).not.toContain('continuare')
  })

  it('pluralizes the open hint in every locale', () => {
    expect(t('en', 'Learning.player.quizHintOpen', { count: 1 })).toContain('Answer the question to check it')
    expect(t('en', 'Learning.player.quizHintOpen', { count: 3 })).toContain('Answer the 3 questions')
    expect(t('es', 'Learning.player.quizHintOpen', { count: 1 })).toContain('Responde a la pregunta')
    expect(t('es', 'Learning.player.quizHintOpen', { count: 3 })).toContain('Responde a las 3 preguntas')
    expect(t('it', 'Learning.player.quizHintOpen', { count: 1 })).toContain('Rispondi alla domanda')
    expect(t('it', 'Learning.player.quizHintOpen', { count: 3 })).toContain('Rispondi alle 3 domande')
  })
})
