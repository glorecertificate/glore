'use client'

import { CheckCircle, XCircle } from 'lucide-react'
import Markdown from 'react-markdown'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { TrueFalseStep } from '@/lib/_types'

interface TrueFalseStepViewProps {
  onAnswer: (answer: boolean) => void
  step: TrueFalseStep
  userAnswer?: boolean
}

export const TrueFalseStepView = ({ onAnswer, step, userAnswer }: TrueFalseStepViewProps) => {
  const isAnswered = userAnswer !== undefined
  const isCorrect = isAnswered && userAnswer === step.correctAnswer

  return (
    <div>
      <div className="prose prose-slate dark:prose-invert mb-8 max-w-none">
        <Markdown>{step.content}</Markdown>
      </div>

      <div className="mt-6 border-t pt-6">
        <h3 className="mb-4 text-xl font-semibold">{'Question'}</h3>
        <p className="mb-6 text-lg">{step.question}</p>

        <div className="flex gap-4">
          <Button
            className={`flex-1 ${isAnswered && step.correctAnswer === true ? 'bg-green-600' : ''} ${isAnswered && userAnswer === true && !isCorrect ? 'bg-red-600' : ''}`}
            disabled={isAnswered}
            onClick={() => !isAnswered && onAnswer(true)}
            variant={userAnswer === true ? 'default' : 'outline'}
          >
            {'True'}
            {isAnswered && step.correctAnswer === true && <CheckCircle className="ml-2 h-4 w-4" />}
          </Button>

          <Button
            className={`flex-1 ${isAnswered && step.correctAnswer === false ? 'bg-green-600' : ''} ${isAnswered && userAnswer === false && !isCorrect ? 'bg-red-600' : ''}`}
            disabled={isAnswered}
            onClick={() => !isAnswered && onAnswer(false)}
            variant={userAnswer === false ? 'default' : 'outline'}
          >
            {'False'}
            {isAnswered && step.correctAnswer === false && <CheckCircle className="ml-2 h-4 w-4" />}
          </Button>
        </div>

        {isAnswered && (
          <Card className={`mt-6 ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-2">
                {isCorrect ? (
                  <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium">{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                  <p className="mt-1 text-muted-foreground">
                    {isCorrect
                      ? "Great job! You've understood this concept correctly."
                      : `The correct answer is ${step.correctAnswer ? 'True' : 'False'}. Review the material and try to understand why.`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
