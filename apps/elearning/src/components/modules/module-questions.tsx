import { useCallback, useMemo } from 'react'

import { CheckCircleIcon, XCircleIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { type BooleanString } from '@repo/utils'

import { type ModuleQuestion } from '@/api/modules'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Markdown } from '@/components/ui/markdown'
import { cn } from '@/lib/utils'
import { type Localized } from '@/services/i18n'

const ModuleQuestion = ({
  completed,
  onAnswer,
  question,
}: {
  completed?: boolean
  onAnswer: (questionId: number, value: BooleanString) => void
  question: Localized<ModuleQuestion>
  title?: string
}) => {
  const t = useTranslations('Modules')

  const isAnswered = useMemo(() => question.user_answer, [question.user_answer])

  const isUserAnswer = useCallback((answer: BooleanString) => question.user_answer === answer, [question.user_answer])
  const isCorrectAnswer = useCallback(
    (answer: BooleanString) => isAnswered && answer === question.correct_answer,
    [isAnswered, question.correct_answer],
  )
  const isCorrectUserAnswer = useMemo(
    () => isAnswered && question.user_answer === question.correct_answer,
    [isAnswered, question.correct_answer, question.user_answer],
  )

  const onOptionClick = useCallback(
    (value: BooleanString) => () => {
      if (isAnswered && !completed) return
      if (!isAnswered) return onAnswer(question.id, value)
      if (isUserAnswer(value)) return

      toast.info(t('answerDisabled'), {
        duration: 1200,
      })
    },
    [onAnswer, question, t, isAnswered, completed, isUserAnswer],
  )

  const buttonClassName = useCallback(
    (answer: BooleanString) =>
      cn(
        'flex-1',
        isAnswered && 'cursor-default',
        isUserAnswer(answer) && 'border-foreground/60 bg-accent',
        !isUserAnswer(answer) && 'text-muted-foreground',
        // isCorrectAnswer(answer) && 'border-foreground/60',
      ),
    [isAnswered, isUserAnswer],
  )

  return (
    <>
      <Markdown className="mb-4">{question.description}</Markdown>

      <div className="flex gap-4">
        <Button className={buttonClassName('true')} hover={!isAnswered} onClick={onOptionClick('true')} variant="outline">
          {t('trueAnswer')}
          {isCorrectAnswer('true') && <CheckCircleIcon className="size-4 text-success" />}
        </Button>

        <Button className={buttonClassName('false')} hover={!isAnswered} onClick={onOptionClick('false')} variant="outline">
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

export const ModuleQuestions = ({
  completed,
  onAnswer,
  questions,
  title = false,
}: {
  completed?: boolean
  onAnswer: (questionId: number, value: BooleanString) => void
  questions: Localized<ModuleQuestion>[]
  title?: boolean
}) => {
  const t = useTranslations('Modules')

  return (
    <div className="mt-8 border-t-2 pt-6">
      {title && <h3 className="mb-2 text-2xl font-semibold text-secondary-accent">{t('questionsTitle')}</h3>}
      <p className="mb-4 font-medium">
        {t('questionsSubtitle', {
          count: questions.length,
        })}
      </p>

      {questions.length ? (
        questions.map(question => (
          <ModuleQuestion completed={completed} key={question.id} onAnswer={onAnswer} question={question} />
        ))
      ) : (
        <p className="text-muted-foreground">{'Admin.noQuestions'}</p>
      )}
    </div>
  )
}
