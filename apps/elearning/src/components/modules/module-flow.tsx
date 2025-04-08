'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

import { ArrowLeftIcon, ArrowRightIcon, ChevronDownIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { type Module, type ModuleStepType } from '@/api'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Markdown } from '@/components/ui/markdown'
import { Progress } from '@/components/ui/progress'
import { useLocale } from '@/hooks/use-locale'
import { cn, localize } from '@/lib/utils'

interface ModuleFlowProps {
  module: Module
}

export const ModuleFlow = (props: ModuleFlowProps) => {
  const [locale] = useLocale()
  const router = useRouter()
  const t = useTranslations()

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  // const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [userAnswers] = useState<Record<string, Record<string, number>>>({})

  const module = useMemo(() => localize(props.module, locale), [locale, props.module])
  const currentStep = useMemo(() => module.steps[currentStepIndex], [module.steps, currentStepIndex])
  const isFirstStep = useMemo(() => currentStepIndex === 0, [currentStepIndex])
  const isLastStep = useMemo(() => currentStepIndex === module.steps.length - 1, [currentStepIndex, module.steps.length])
  const progress = useMemo(
    () => Math.round((currentStepIndex / module.steps.length) * 100),
    [currentStepIndex, module.steps.length],
  )

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

  const onStepClick = useCallback(
    (index: number) => {
      if (isPastStep(index)) setCurrentStepIndex(index)
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

  return (
    <div className="flex flex-col">
      <header className="border-b">
        <div className="container pt-2 pb-4">
          <h1 className="text-3xl font-bold">{module.title}</h1>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t('Modules.stepCount', {
                  count: currentStepIndex + 1,
                  total: module.steps.length,
                })}
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
            </div>
          </div>

          {/* Mobile dropdown */}
          <div className="col-span-12 block md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full justify-between py-6" variant="outline">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{currentStep.title}</span>
                    <span className="text-xs text-muted-foreground">{formatStepType(currentStep.type)}</span>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {module.steps.map((step, index) => (
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
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="col-span-12 md:col-span-9">
            <div className="rounded-lg border bg-card p-8">
              <Markdown>{currentStep.content}</Markdown>
            </div>

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
          </div>
        </div>
      </main>
    </div>
  )
}
