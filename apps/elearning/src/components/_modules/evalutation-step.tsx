'use client'

import Markdown from 'react-markdown'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { EvaluationStep } from '@/lib/_types'

interface EvaluationStepViewProps {
  onAnswer: (questionId: string, rating: number) => void
  step: EvaluationStep
  userAnswers: Record<string, number>
}

export const EvaluationStepView = ({ onAnswer, step, userAnswers }: EvaluationStepViewProps) => (
  <div>
    <div className="prose prose-slate dark:prose-invert mb-8 max-w-none">
      <Markdown>{step.content}</Markdown>
    </div>

    <div className="mt-6 border-t pt-6">
      <h3 className="mb-6 text-xl font-semibold">{'Self-Assessment'}</h3>
      <p className="mb-6 text-muted-foreground">{'Rate yourself on a scale from 1 (lowest) to 5 (highest) for each question.'}</p>

      <div className="space-y-8">
        {step.questions.map(question => (
          <div className="space-y-4" key={question.id}>
            <p className="font-medium">{question.question}</p>

            <RadioGroup
              className="flex justify-between"
              onValueChange={value => onAnswer(question.id, Number.parseInt(value))}
              value={userAnswers[question.id]?.toString()}
            >
              {[1, 2, 3, 4, 5].map(rating => (
                <div className="flex flex-col items-center gap-2" key={rating}>
                  <RadioGroupItem className="peer sr-only" id={`${question.id}-${rating}`} value={rating.toString()} />
                  <Label
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground hover:bg-muted"
                    htmlFor={`${question.id}-${rating}`}
                  >
                    {rating}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {rating === 1 && 'Very Low'}
                    {rating === 2 && 'Low'}
                    {rating === 3 && 'Medium'}
                    {rating === 4 && 'High'}
                    {rating === 5 && 'Very High'}
                  </span>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
      </div>
    </div>
  </div>
)
