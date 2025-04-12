import { useCallback, useMemo, useState } from 'react'

import { CheckCircleIcon, XCircleIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { type BooleanString } from '@repo/utils'

import { type ModuleQuestion } from '@/api/modules'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Markdown } from '@/components/ui/markdown'
import { cn } from '@/lib/utils'
import { type Localized } from '@/services/i18n'

const ModuleQuestion = ({ question }: { question: Localized<ModuleQuestion> }) => {
  const t = useTranslations('Modules')

  const [userAnswer, setUserAnswer] = useState<BooleanString | undefined>(undefined)

  const isAnswered = useMemo(() => userAnswer !== undefined, [userAnswer])

  const isCorrectAnswer = useCallback(
    (answer: BooleanString) => isAnswered && answer === question.correct_answer,
    [isAnswered, question.correct_answer],
  )
  const buttonClassName = useCallback(
    (answer: BooleanString) =>
      cn(
        'flex-1',
        isAnswered && 'pointer-events-none',
        isAnswered && answer === userAnswer && 'border-foreground/60 bg-muted/20',
      ),
    [isAnswered, userAnswer],
  )
  const isCorrectUserAnswer = useMemo(
    () => isAnswered && userAnswer === question.correct_answer,
    [isAnswered, question.correct_answer, userAnswer],
  )

  const onTrueClick = useCallback(() => {
    if (isAnswered) return
    setUserAnswer('true')
  }, [isAnswered])
  const onFalseClick = useCallback(() => {
    if (isAnswered) return
    setUserAnswer('false')
  }, [isAnswered])

  return (
    <>
      <Markdown className="mb-3">{question.description}</Markdown>

      <div className="flex gap-4">
        <Button className={buttonClassName('true')} onClick={onTrueClick} variant="outline">
          {t('trueAnswer')}
          {isCorrectAnswer('true') && <CheckCircleIcon className="size-4 text-success" />}
        </Button>

        <Button className={buttonClassName('false')} onClick={onFalseClick} variant="outline">
          {t('falseAnswer')}
          {isCorrectAnswer('false') && <CheckCircleIcon className="size-4 text-success" />}
        </Button>
      </div>

      {isAnswered && (
        <Card className={cn('mt-4 border-[1.5px] shadow-none', isCorrectUserAnswer ? 'border-green-500' : 'border-red-500')}>
          <CardContent>
            <div className="flex items-start gap-2">
              <div className="flex items-start pt-[2px]">
                {isCorrectUserAnswer ? (
                  <CheckCircleIcon className="size-5 text-green-500" />
                ) : (
                  <XCircleIcon className="size-5 text-red-500" />
                )}
              </div>
              <div>
                <p className="font-medium">{isCorrectUserAnswer ? t('correctAnswerTitle') : t('wrongAnswerTitle')}</p>
                <p className="mt-1 text-[15px] text-foreground/80">
                  {isCorrectUserAnswer
                    ? (question.correct_answer_explanation ?? t('correctAnswerMessage'))
                    : (question.wrong_answer_explanation ?? t('wrongAnswerMessage'))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

export const ModuleQuestions = ({ questions }: { questions: Localized<ModuleQuestion[]> }) => {
  const t = useTranslations('Modules')

  return (
    <div className="mt-8 border-t-2 pt-6">
      {/* <h3 className="mb-2 text-2xl font-semibold text-secondary-accent">{t('questionsTitle')}</h3> */}
      <p className="mb-3 font-medium">
        {t('questionsSubtitle', {
          count: questions.length,
        })}
      </p>

      {questions.length ? (
        questions.map(question => <ModuleQuestion key={question.id} question={question} />)
      ) : (
        <p className="text-muted-foreground">{'no questions'}</p>
      )}
    </div>
  )
}
