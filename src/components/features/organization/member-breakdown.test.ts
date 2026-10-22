import { createTranslator } from 'next-intl'
import { describe, expect, it } from 'vitest'

import en from '~/messages/en.json'
import es from '~/messages/es.json'
import it_ from '~/messages/it.json'

const counts = (value: number) => ({
  admins: value,
  learners: value,
  representatives: value,
  tutors: value,
  volunteers: value,
})

describe('member breakdown', () => {
  it('uses singular nouns for one member in every locale', () => {
    const english = createTranslator({ locale: 'en', messages: en, namespace: 'Organization' })(
      'memberBreakdown',
      counts(1)
    )
    const spanish = createTranslator({ locale: 'es', messages: es, namespace: 'Organization' })(
      'memberBreakdown',
      counts(1)
    )
    const italian = createTranslator({ locale: 'it', messages: it_, namespace: 'Organization' })(
      'memberBreakdown',
      counts(1)
    )

    expect(english).toBe('1 admin, 1 representative, 1 tutor, 1 volunteer, 1 learner')
    expect(spanish).toBe('1 administrador, 1 representante, 1 tutor, 1 voluntario, 1 estudiante')
    expect(italian).toBe('1 admin, 1 rappresentante, 1 tutor, 1 volontario, 1 studente')
  })

  it('uses plural nouns otherwise', () => {
    const english = createTranslator({ locale: 'en', messages: en, namespace: 'Organization' })(
      'memberBreakdown',
      counts(2)
    )

    expect(english).toBe('2 admins, 2 representatives, 2 tutors, 2 volunteers, 2 learners')
  })
})
