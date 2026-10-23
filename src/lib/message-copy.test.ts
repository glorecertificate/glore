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

describe('Courses quiz validation messages', () => {
  const keys = ['quizQuestionEmpty', 'quizMinOptions', 'quizOptionEmpty', 'quizNoCorrect']
  const values = { number: 2, position: 3, title: 'Active listening' }

  it('names the lesson position, its title, and the question in every locale', () => {
    for (const locale of ['en', 'es', 'it'] as const) {
      for (const key of keys) {
        const message = t(locale, `Courses.${key}`, values)
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
