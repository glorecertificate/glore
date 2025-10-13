import { useCallback, useMemo } from 'react'

import { CheckCircleIcon, XCircleIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Markdown } from '@/components/ui/markdown'
import { useI18n } from '@/hooks/use-i18n'
import { type Question, type QuestionOption } from '@/lib/data'
import { cn } from '@/lib/utils'

const CourseQuestion = ({
  completed,
  onComplete,
  question,
}: {
  completed?: boolean
  onComplete: (question: Question, option: QuestionOption) => void
  question: Question
  title?: string
}) => {
  const { localize } = useI18n()
  const t = useTranslations('Courses')

  const isCorrectUserAnswer = useMemo(
    () => question.answered && question.options.some(option => option.isUserAnswer && option.isCorrect),
    [question]
  )

  const onOptionClick = useCallback(
    (option: QuestionOption) => () => {
      if (question.answered && !completed) return
      if (!question.answered) return onComplete(question, option)
      if (option.isUserAnswer || !option.isCorrect) return

      toast.info(t('answerDisabled'), {
        duration: 1200,
      })
    },
    [onComplete, question, completed, t]
  )

  const optionClassName = useCallback(
    (option: QuestionOption) =>
      cn(
        'flex-1',
        question.answered && 'cursor-default',
        option.isUserAnswer && 'border-foreground/60 bg-accent',
        question.answered && !option.isUserAnswer && 'text-muted-foreground'
      ),
    [question.answered]
  )

  return (
    <>
      <Markdown className="mb-4">{localize(question.description)}</Markdown>

      <div className="flex gap-4">
        {question.options.map(option => (
          <Button className={optionClassName(option)} key={option.id} onClick={onOptionClick(option)} variant="outline">
            {t('trueAnswer')}
            {option.isCorrect && <CheckCircleIcon className="size-4 text-success" />}
          </Button>
        ))}
      </div>

      {question.answered && (
        <Card
          className={cn('mt-4 border-[1.5px] shadow-none', isCorrectUserAnswer ? 'border-green-500' : 'border-red-500')}
        >
          <CardContent>
            <div className="flex items-start gap-2">
              <div className="flex items-start pt-0.5">
                {isCorrectUserAnswer ? (
                  <CheckCircleIcon className="size-5 text-green-500" />
                ) : (
                  <XCircleIcon className="size-5 text-red-500" />
                )}
              </div>
              <div>
                <p className="font-medium">{isCorrectUserAnswer ? t('correctAnswerTitle') : t('wrongAnswerTitle')}</p>
                <p className="mt-1 text-[15px] text-foreground/80">{localize(question.explanation)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

export const CourseQuestions = ({
  completed,
  onComplete,
  questions,
  title = false,
  ...props
}: Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> & {
  completed?: boolean
  onComplete: (question: Question, option: QuestionOption) => void
  questions: Question[]
  title?: boolean
}) => {
  const t = useTranslations('Courses')

  return (
    <div {...props}>
      {title && <h3 className="mb-2 font-semibold text-2xl text-brand-accent">{t('questionsTitle')}</h3>}
      <p className="mb-4 font-medium">
        {t('questionsSubtitle', {
          count: questions.length,
        })}
      </p>

      {questions.length ? (
        questions.map(question => (
          <CourseQuestion completed={completed} key={question.id} onComplete={onComplete} question={question} />
        ))
      ) : (
        <p className="text-muted-foreground">{'Admin.noQuestions'}</p>
      )}
    </div>
  )
}
