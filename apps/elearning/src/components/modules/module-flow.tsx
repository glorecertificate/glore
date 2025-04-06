'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { type Module } from '@/api'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useLocale } from '@/hooks/use-locale'
import { cn, localize } from '@/lib/utils'

interface ModuleFlowProps {
  module: Module
}

export const ModuleFlow = (props: ModuleFlowProps) => {
  const [locale] = useLocale()
  const router = useRouter()
  const t = useTranslations('Modules')

  const module = useMemo(() => localize(props.module, locale), [locale, props.module])

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [userAnswers] = useState<Record<string, Record<string, number>>>({})

  const currentStep = useMemo(() => module.steps[currentStepIndex], [module.steps, currentStepIndex])
  const isFirstStep = useMemo(() => currentStepIndex === 0, [currentStepIndex])
  const isLastStep = useMemo(() => currentStepIndex === module.steps.length - 1, [currentStepIndex, module.steps.length])
  const progress = useMemo(
    () => Math.round((completedSteps.size / module.steps.length) * 100),
    [completedSteps.size, module.steps.length],
  )

  const handleModuleCompletion = useCallback(() => {
    alert("Congratulations! You've completed this module.")
    router.push('/modules')
  }, [router])

  const markStepAsCompleted = useCallback((stepId: string) => {
    setCompletedSteps(prev => {
      const updated = new Set(prev)
      updated.add(stepId)
      return updated
    })
  }, [])

  const handleNext = useCallback(() => {
    if (currentStep.type === 'descriptive') {
      markStepAsCompleted(String(currentStep.id))
    }
    if (isLastStep) {
      handleModuleCompletion()
      return
    }
    setCurrentStepIndex(currentStepIndex + 1)
  }, [currentStep, currentStepIndex, handleModuleCompletion, isLastStep, markStepAsCompleted])

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  // const handleTrueFalseAnswer = (answer: boolean) => {
  //   setUserAnswers(prev => ({
  //     ...prev,
  //     [currentStep.id]: answer,
  //   }))
  //   markStepAsCompleted(currentStep.id)
  // }

  // const handleEvaluationAnswer = useCallback(
  //   (questionId: string, rating: number) => {
  //     setUserAnswers(prev => ({
  //       ...prev,
  //       [currentStep.id]: {
  //         ...prev[currentStep.id],
  //         [questionId]: rating,
  //       },
  //     }))
  //     const allQuestionsAnswered = currentStep.questions.every(q => {
  //       const userAnswer = prev[currentStep.id]?.[q.id]
  //       return userAnswer !== undefined && userAnswer > 0
  //     })
  //     if (allQuestionsAnswered) {
  //       markStepAsCompleted(currentStep.id)
  //     }
  //   },
  //   [currentStep.id],
  // )

  // const isStepCompleted = (stepId: string) => completedSteps.has(stepId)

  const canProceed = useMemo(() => {
    switch (currentStep.type) {
      case 'descriptive':
        return true
      case 'questions':
        return userAnswers[currentStep.id] !== undefined
      // case 'skill_evaluation':
      //   return currentStep.questions.every(q => userAnswers[currentStep.id]?.[q.id] !== undefined)
      default:
        return false
    }
  }, [currentStep, userAnswers])

  const renderStepContent = useMemo(() => {
    switch (currentStep.type) {
      case 'descriptive':
        // return <DescriptiveStepView step={currentStep} />
        return
      // case 'true-false':
      //   return <TrueFalseStepView onAnswer={handleTrueFalseAnswer} step={currentStep} userAnswer={userAnswers[currentStep.id]} />
      // case 'evaluation':
      //   return (
      //     <EvaluationStepView
      //       onAnswer={handleEvaluationAnswer}
      //       step={currentStep}
      //       userAnswers={userAnswers[currentStep.id] || {}}
      //     />
      //   )
      default:
        return <div>{'Unknown step type'}</div>
    }
  }, [currentStep])

  return (
    <div className="flex flex-col">
      <header className="border-b">
        <div className="container py-4">
          <h1 className="text-3xl font-bold">{module.title}</h1>
          <div className="mt-4 flex items-center justify-between">
            <div className="fl_ex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t('stepCount', {
                  count: currentStepIndex + 1,
                  total: module.steps.length,
                })}
              </span>
            </div>
            <div className="w-1/2">
              <Progress className="h-2" value={progress} />
            </div>
          </div>
        </div>
      </header>

      <main className="container flex-1 py-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <div className="sticky top-6 space-y-2">
              <h3 className="mb-4 font-medium">{'Module Steps'}</h3>
              {module.steps.map((step, index) => (
                <div
                  className={cn(
                    `flex cursor-pointer items-center rounded-md p-3`,
                    // index === currentStepIndex
                    //   ? 'bg-primary text-primary-foreground'
                    //   : isStepCompleted(step.id)
                    //     ? 'bg-muted'
                    //     : 'hover:bg-muted',
                  )}
                  key={step.id}
                  onClick={() => setCurrentStepIndex(index)}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs opacity-80">
                      {step.type === 'descriptive' && 'Reading'}
                      {/* {step.type === 'true-false' && 'True/False Question'}
                      {step.type === 'evaluation' && 'Self-Assessment'} */}
                    </p>
                  </div>
                  {/* {isStepCompleted(step.id) && <CheckCircleIcon className="ml-2 h-4 w-4 text-green-500" />} */}
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-9">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-6 text-2xl font-bold">{currentStep.title}</h2>
              {renderStepContent}
            </div>

            <div className="mt-6 flex justify-between">
              <Button disabled={isFirstStep} onClick={handlePrevious} variant="outline">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                {'Previous'}
              </Button>

              <Button disabled={!canProceed} onClick={handleNext}>
                {isLastStep ? 'Complete Module' : 'Next'}
                {!isLastStep && <ArrowRightIcon className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
