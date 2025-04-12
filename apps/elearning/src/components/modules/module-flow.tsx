'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { ArrowLeftIcon, ArrowRightIcon, ChevronDownIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { type Module, type ModuleStepType } from '@/api/modules'
import { ModuleQuestions } from '@/components/modules/module-questions'
import { ModuleSkillEvaluation } from '@/components/modules/module-skill-evaluation'
import { ModuleSubskillEvaluations } from '@/components/modules/module-subskill-evaluations'
import { useBreadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Markdown } from '@/components/ui/markdown'
import { Progress } from '@/components/ui/progress'
import { useLocale } from '@/hooks/use-locale'
import { cn, localize } from '@/lib/utils'

export const ModuleFlow = (props: { module: Module }) => {
  const { setBreadcrumb } = useBreadcrumb()
  const [locale] = useLocale()
  const router = useRouter()
  const t = useTranslations()

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  // const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [userAnswers] = useState<Record<string, Record<string, number>>>({})

  const module = useMemo(() => localize(props.module, locale), [locale, props.module])
  const hasSteps = useMemo(() => module.steps.length > 0, [module.steps])
  const currentStep = useMemo(() => module.steps[currentStepIndex], [module.steps, currentStepIndex])
  const isFirstStep = useMemo(() => currentStepIndex === 0, [currentStepIndex])
  const isLastStep = useMemo(() => currentStepIndex === module.steps.length - 1, [currentStepIndex, module.steps.length])
  const progress = useMemo(
    () => (hasSteps ? Math.round((currentStepIndex / module.steps.length) * 100) : 0),
    [currentStepIndex, hasSteps, module.steps.length],
  )

  useEffect(() => {
    setBreadcrumb(<h1>{module.title}</h1>)
  }, [module.title, setBreadcrumb])

  const isCurrentStep = useCallback((index: number) => index === currentStepIndex, [currentStepIndex])
  const isPastStep = useCallback((index: number) => index < currentStepIndex, [currentStepIndex])
  const isFutureStep = useCallback((index: number) => index > currentStepIndex, [currentStepIndex])
  const formatStepType = useCallback(
    (type: ModuleStepType) =>
      t('Modules.stepType', {
        type,
      }),
    [t],
  )
  const stepItemTitle = useCallback(
    (index: number) => {
      if (!isFutureStep(index)) return undefined
      return t('Modules.completeToProceed')
    },
    [isFutureStep, t],
  )

  const onStepClick = useCallback(
    (index: number) => {
      if (!isPastStep(index)) return
      setCurrentStepIndex(index)
    },
    [isPastStep],
  )

  const onModuleCompletion = useCallback(() => {
    alert("Congratulations! You've completed this module.")
    router.push('/modules')
  }, [router])

  // const markAsCompleted = useCallback((stepId: string) => {
  //   setCompletedSteps(prev => {
  //     const updated = new Set(prev)
  //     updated.add(stepId)
  //     return updated
  //   })
  // }, [])

  const handleNext = useCallback(() => {
    // if (currentStep.type === 'descriptive') {
    //   markAsCompleted(String(currentStep.id))
    // }
    if (isLastStep) {
      onModuleCompletion()
      return
    }
    setCurrentStepIndex(currentStepIndex + 1)
  }, [currentStepIndex, onModuleCompletion, isLastStep])

  const handlePrevious = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }, [currentStepIndex, isFirstStep])

  // const handleTrueFalseAnswer = (answer: boolean) => {
  //   setUserAnswers(prev => ({
  //     ...prev,
  //     [currentStep.id]: answer,
  //   }))
  //   markAsCompleted(currentStep.id)
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
  //       markAsCompleted(currentStep.id)
  //     }
  //   },
  //   [currentStep.id],
  // )

  // const isStepCompleted = (stepId: string) => completedSteps.has(stepId)

  const canProceed = useMemo(() => {
    switch (currentStep?.type) {
      case 'descriptive':
        return true
      case 'questions':
        return userAnswers[currentStep.id] !== undefined || true
      case 'subskill_evaluations':
        return true
      case 'skill_evaluation':
        return true
      default:
        return false
    }
  }, [currentStep, userAnswers])

  return (
    <div className="flex flex-col">
      <header className="border-b">
        <div className="container pt-2 pb-4">
          <h1 className="text-3xl font-bold">{module.title}</h1>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {hasSteps
                  ? t('Modules.stepCount', {
                      count: currentStepIndex + 1,
                      total: module.steps.length,
                    })
                  : 'No steps yet'}
              </span>
            </div>
            <div className="flex w-1/2 items-center gap-2">
              <span className="text-sm">
                {progress}
                {'%'}
              </span>
              <Progress className="h-2" color="primary" value={progress} />
            </div>
          </div>
        </div>
      </header>

      <main className="container flex-1 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Steps sidebar */}
          <div className="col-span-3 hidden md:block">
            <div className="sticky top-[60px] space-y-2">
              {hasSteps && (
                <div className="relative">
                  <div className="absolute top-[60px] left-[23px] w-0.5 bg-muted" />
                  <div
                    className="absolute top-[50px] left-[23px] w-0.5 bg-secondary transition-all duration-300"
                    style={{ height: `${progress}%` }}
                  />
                  {module.steps.map((step, index) => (
                    <div
                      className={cn(
                        'relative mb-4 flex cursor-pointer items-center rounded-md p-3 pl-12',
                        isCurrentStep(index) && 'pointer-events-none bg-accent/50',
                        isFutureStep(index) && 'cursor-not-allowed text-muted-foreground',
                      )}
                      key={step.id}
                      onClick={onStepClick.bind(null, index)}
                      title={stepItemTitle(index)}
                    >
                      <div
                        className={cn(
                          'absolute top-1/2 left-6 z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border',
                          isCurrentStep(index) || isPastStep(index)
                            ? 'border-secondary-accent bg-secondary text-secondary-foreground'
                            : 'border-border bg-background',
                        )}
                      >
                        <span className="text-xs">{index + 1}</span>
                      </div>
                      <div className={cn('flex-1 opacity-85', isCurrentStep(index) && 'opacity-100')}>
                        <p className="text-sm font-medium">{step.title}</p>
                        <p className="text-xs opacity-80">{formatStepType(step.type)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile dropdown */}
          <div className="col-span-12 block md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full justify-between py-6" variant="outline">
                  <div className="flex flex-col items-start">
                    {hasSteps ? (
                      <>
                        <span className="font-medium">{currentStep.title}</span>
                        <span className="text-xs text-muted-foreground">{formatStepType(currentStep.type)}</span>
                      </>
                    ) : (
                      <span className="font-medium">{'No steps'}</span>
                    )}
                  </div>
                  <ChevronDownIcon className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {hasSteps ? (
                  module.steps.map((step, index) => (
                    <DropdownMenuItem
                      className="flex justify-between py-2"
                      key={step.id}
                      onClick={() => setCurrentStepIndex(index)}
                    >
                      <div className="flex flex-col">
                        <span className={cn(isCurrentStep(index) && 'font-semibold')}>{step.title}</span>
                        <span className="text-xs text-muted-foreground">{formatStepType(step.type)}</span>
                      </div>
                      {/* {isStepCompleted(step.id) && <CheckCircle className="ml-2 h-4 w-4 text-green-500" />} */}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem className="flex justify-between py-2">
                    <div className="flex flex-col">
                      <span>{'Add step'}</span>
                    </div>
                    {/* {isStepCompleted(step.id) && <CheckCircle className="ml-2 h-4 w-4 text-green-500" />} */}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="col-span-12 md:col-span-9">
            <div className="rounded-lg border bg-card p-8">
              {hasSteps ? (
                <>
                  <Markdown>{currentStep.content}</Markdown>
                  {currentStep.type === 'questions' && <ModuleQuestions questions={currentStep.questions} />}
                  {currentStep.type === 'subskill_evaluations' && (
                    <ModuleSubskillEvaluations evaluations={currentStep.subskill_evaluations} />
                  )}
                  {currentStep.type === 'skill_evaluation' && <ModuleSkillEvaluation evaluation={currentStep.skill_evaluation} />}
                </>
              ) : (
                <p>{'Create the first step'}</p>
              )}
            </div>

            {hasSteps && (
              <div className={cn('mt-6 flex', isFirstStep ? 'justify-end' : 'justify-between')}>
                {!isFirstStep && (
                  <Button className="gap-1" disabled={isFirstStep} onClick={handlePrevious} variant="outline">
                    <ArrowLeftIcon className="h-4 w-4" />
                    {t('Common.previous')}
                  </Button>
                )}

                <Button className="gap-1" disabled={!canProceed} onClick={handleNext} variant="outline">
                  {isLastStep ? t('Modules.completeModule') : t('Common.next')}
                  {!isLastStep && <ArrowRightIcon className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
