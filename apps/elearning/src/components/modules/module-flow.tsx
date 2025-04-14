'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { ArrowLeftIcon, ChevronDownIcon, EyeIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { type BooleanString } from '@repo/utils'

import {
  createUserAnswers,
  createUserModuleStep,
  createUserSkillEvaluation,
  createUserSubskillEvaluations,
  ModuleStatus,
  type Module,
} from '@/api/modules'
import { ModuleQuestions } from '@/components/modules/module-questions'
import { ModuleSkillEvaluation } from '@/components/modules/module-skill-evaluation'
import { ModuleSubskillEvaluations } from '@/components/modules/module-subskill-evaluations'
import { Badge } from '@/components/ui/badge'
import { BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { ConfettiButton } from '@/components/ui/confetti'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Link } from '@/components/ui/link'
import { Markdown } from '@/components/ui/markdown'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useDashboard } from '@/hooks/use-dashboard'
import { useHeader } from '@/hooks/use-header'
import { useLocale } from '@/hooks/use-locale'
import { useScroll } from '@/hooks/use-scroll'
import { useSyncStatus } from '@/hooks/use-sync-status'
import { externalUrl, Route } from '@/lib/navigation'
import { cn, localize } from '@/lib/utils'

export const ModuleFlow = (props: { module: Module }) => {
  const { user } = useDashboard()
  const [locale] = useLocale()
  const t = useTranslations()
  const { setBreadcrumb, setHeaderShadow } = useHeader()
  const { isScrolled } = useScroll()
  const { setSyncStatus } = useSyncStatus()

  const [syncedModule, setSyncedModule] = useState(props.module)
  const [module, setModule] = useState(syncedModule)
  const localModule = useMemo(() => localize(module, locale), [module, locale])

  useEffect(() => {
    setHeaderShadow(false)
    setBreadcrumb(
      <BreadcrumbList className="sm:gap-1">
        <BreadcrumbItem>
          <Button asChild>
            <Link href={Route.Modules}>{t('Navigation.modules')}</Link>
          </Button>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="mr-3" />
        <BreadcrumbItem className="text-foreground">{localModule.title}</BreadcrumbItem>
      </BreadcrumbList>,
    )
  }, [localModule.title, setBreadcrumb, setHeaderShadow, t])

  const initialStepIndex = useMemo(() => {
    if (module.status === ModuleStatus.Completed) return 0

    const incompletedIndex = module.steps.findIndex(step => !step.completed)
    if (incompletedIndex !== -1) return incompletedIndex
    return incompletedIndex
  }, [module.steps, module.status])

  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex)

  const hasSteps = useMemo(() => module.steps.length > 0, [module.steps])
  const currentStep = useMemo(() => localModule.steps[currentStepIndex] || {}, [localModule.steps, currentStepIndex])
  const currentSyncedStep = useMemo(() => syncedModule.steps[currentStepIndex] || {}, [syncedModule.steps, currentStepIndex])
  const isFirstStep = useMemo(() => currentStepIndex === 0, [currentStepIndex])
  const isLastStep = useMemo(() => currentStepIndex === module.steps.length - 1, [currentStepIndex, module.steps.length])
  const completedSteps = useMemo(() => module.steps.filter(step => step.completed), [module.steps])
  const canProceed = useMemo(() => {
    if (currentStep.type === 'descriptive' || currentStep.completed) return true
    if (currentStep.type === 'questions') {
      return currentStep.questions.every(q => q.user_answer !== undefined)
    }
    if (currentStep.type === 'subskill_evaluations') {
      return currentStep.subskill_evaluations.every(e => e.user_evaluation !== undefined)
    }
    if (currentStep.type === 'skill_evaluation') {
      return currentStep.skill_evaluation?.user_evaluation !== undefined
    }
    return false
  }, [
    currentStep.type,
    currentStep.completed,
    currentStep.questions,
    currentStep.subskill_evaluations,
    currentStep.skill_evaluation,
  ])
  const moduleProgress = useMemo(
    () => (hasSteps ? Math.round((completedSteps.length / module.steps.length) * 100) : 0),
    [completedSteps.length, hasSteps, module.steps.length],
  )
  const moduleProgressColor = useMemo(() => (moduleProgress === 100 ? 'success' : 'default'), [moduleProgress])
  const stepsProgress = useMemo(
    () => (hasSteps ? Math.round((currentStepIndex / module.steps.length) * 100) : 0),
    [currentStepIndex, hasSteps, module.steps.length],
  )

  const isCurrentStep = useCallback((index: number) => index === currentStepIndex, [currentStepIndex])
  const isPastStep = useCallback((index: number) => index < currentStepIndex, [currentStepIndex])
  const isFutureStep = useCallback((index: number) => index > currentStepIndex, [currentStepIndex])
  const isCompletedStep = useCallback((index: number) => module.steps[index].completed, [module.steps])
  const isReachableStep = useCallback(
    (index: number) => {
      if (isCurrentStep(index)) return true
      if (isPastStep(index)) return true
      if (isFutureStep(index) && isCompletedStep(index - 1)) return true
      return false
    },
    [isCurrentStep, isPastStep, isFutureStep, isCompletedStep],
  )

  const handlePrevious = useCallback(() => {
    if (!isFirstStep) setCurrentStepIndex(currentStepIndex - 1)
  }, [currentStepIndex, isFirstStep])

  const handleNext = useCallback(
    async (index?: number) => {
      try {
        const step = currentStep
        const syncedStep = currentSyncedStep
        const stepIndex = currentStepIndex

        if (isLastStep) setModule(module => ({ ...module, status: ModuleStatus.Completed }))
        if (!isLastStep) setCurrentStepIndex(i => index ?? i + 1)

        if (syncedStep.completed) return

        setSyncStatus('syncing')

        setModule(module => ({
          ...module,
          steps: module.steps.map((s, i) => (i === stepIndex ? { ...s, completed: true } : s)),
        }))

        await createUserModuleStep({
          userId: user.id,
          moduleStepId: step.id,
        })

        switch (step.type) {
          case 'questions': {
            await createUserAnswers({
              userId: user.id,
              questions: step.questions.map(q => {
                if (!q.user_answer) throw new Error("Question doesn't have a user answer")
                return { id: q.id, answer: q.user_answer }
              }),
            })
            break
          }
          case 'subskill_evaluations': {
            await createUserSubskillEvaluations({
              userId: user.id,
              evaluations: step.subskill_evaluations.map(e => {
                if (!e.user_evaluation) throw new Error("Subskill doesn't a have user evaluation")
                return { id: e.id, rating: e.user_evaluation }
              }),
            })
            break
          }
          case 'skill_evaluation': {
            const skillEvaluationId = step.skill_evaluation?.id
            const rating = step.skill_evaluation?.user_evaluation
            if (!skillEvaluationId || !rating) throw new Error('Skill evaluation is missing an id or rating.')
            const skillEvaluation = await createUserSkillEvaluation({ userId: user.id, skillEvaluationId, rating })
            if (!skillEvaluation) throw new Error('Failed to create user skill evaluation.')
          }
        }

        setSyncedModule(module)
        setSyncStatus('complete')
      } catch (e) {
        setSyncStatus('error')
        console.error(e)
      }
    },
    [currentStepIndex, currentStep, currentSyncedStep, isLastStep, module, user.id, setSyncedModule, setSyncStatus],
  )

  const onStepButtonClick = useCallback(
    async (index: number) => {
      setCurrentStepIndex(index)
      await handleNext(index)
    },
    [handleNext, setCurrentStepIndex],
  )

  const setQuestion = useCallback(
    (questionId: number, value: BooleanString) => {
      setModule(({ steps, ...module }) => ({
        ...module,
        steps: steps.map((step, i) =>
          i === currentStepIndex
            ? { ...step, questions: step.questions.map(q => (q.id === questionId ? { ...q, user_answer: value } : q)) }
            : step,
        ),
      }))
    },
    [currentStepIndex],
  )
  const setSubskillEvaluation = useCallback(
    (evaluationId: number, rating: number) => {
      setModule(({ steps, ...module }) => ({
        ...module,
        steps: steps.map((step, i) =>
          i === currentStepIndex
            ? {
                ...step,
                subskill_evaluations: step.subskill_evaluations.map(e =>
                  e.id === evaluationId ? { ...e, user_evaluation: rating } : e,
                ),
              }
            : step,
        ),
      }))
    },
    [currentStepIndex],
  )
  const setSkillEvaluation = useCallback(
    (rating: number) => {
      setModule(({ steps, ...module }) => ({
        ...module,
        steps: steps.map((step, i) =>
          i === currentStepIndex && step.skill_evaluation
            ? { ...step, skill_evaluation: { ...step.skill_evaluation, user_evaluation: rating } }
            : step,
        ),
      }))
    },
    [currentStepIndex],
  )

  const formatStepType = useCallback(
    (type: string) =>
      t('Modules.stepType', {
        type,
      }),
    [t],
  )
  const formatStepTitle = useCallback(
    (index: number) => {
      if (!isReachableStep(index)) return t('Modules.completeStepsToProceed')
    },
    [isReachableStep, t],
  )
  const nextTooltip = useMemo(() => {
    if (!canProceed)
      return t('Modules.replyToProceed', {
        type: currentStep.type,
      })
  }, [canProceed, currentStep.type, t])

  return (
    <div className="container mx-auto flex flex-1 px-8 pb-8">
      {/* Steps sidebar */}
      <div className="hidden max-w-lg min-w-52 flex-1/4 shrink-0 md:block md:max-lg:flex-1/3">
        <div className="sticky top-[72px] flex items-center gap-2">
          <span className="pt-1 text-sm text-muted-foreground">
            {hasSteps
              ? t('Modules.stepCount', {
                  count: currentStepIndex + 1,
                  total: module.steps.length,
                })
              : ''}
          </span>
        </div>
        <div className="sticky top-[120px] space-y-2 pr-2">
          {hasSteps && (
            <div className="relative">
              <div className="absolute top-[60px] left-[23px] w-0.5 bg-muted" />
              <div
                className="absolute top-[50px] left-[23px] w-0.5 bg-secondary transition-all duration-300"
                style={{ height: `${stepsProgress}%` }}
              />
              {localModule.steps.map((step, index) => (
                <div
                  className={cn(
                    'relative mb-4 flex cursor-pointer items-center rounded-md p-3 pl-12 dark:bg-transparent',
                    isCurrentStep(index) && 'pointer-events-none bg-accent/50',
                    isReachableStep(index) && 'hover:bg-accent/50',
                    !isReachableStep(index) && 'cursor-not-allowed text-muted-foreground',
                  )}
                  key={step.id}
                  onClick={onStepButtonClick.bind(null, index)}
                  title={formatStepTitle(index)}
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
                    <span className="inline-block text-sm font-medium">
                      {step.title} {isCompletedStep(index) && <span className="ml-1 text-xs text-success">{'✔︎'}</span>}
                    </span>
                    <p className="text-xs opacity-80">{formatStepType(step.type)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        {/* Mobile header */}
        <div className={cn('sticky top-[72px] flex flex-col gap-4 bg-background pb-4 md:hidden', isScrolled && 'border-b')}>
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
                localModule.steps.map((step, index) => (
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
          {module.status !== ModuleStatus.Completed && (
            <div className="flex items-center justify-end gap-2 bg-background md:top-[72px]">
              <span className="text-sm">
                {moduleProgress}
                {'%'}
              </span>
              <Progress className="md:max-w-sm" color={moduleProgressColor} value={moduleProgress} />
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div
          className={cn(
            'sticky top-36 hidden items-center justify-end gap-2 bg-background pb-6 md:top-[72px] md:flex',
            isScrolled && 'border-b',
          )}
        >
          {module.status === ModuleStatus.Completed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className="mr-2 cursor-help border-muted-foreground/60 text-muted-foreground/90" variant="outline">
                  <EyeIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                  {t('Modules.reviewMode')}
                </Badge>
              </TooltipTrigger>
              <TooltipContent arrow={false} className="max-w-72 text-center" side="bottom">
                {t('Modules.reviewModeMessage')}
              </TooltipContent>
            </Tooltip>
          )}
          <span className="text-sm">
            {moduleProgress}
            {'%'}
          </span>
          <Progress className="md:max-w-sm" color={moduleProgressColor} value={moduleProgress} />
        </div>

        {/* Content */}
        <div className="col-span-12 md:col-span-9">
          <div className="rounded-lg border bg-card p-8">
            {hasSteps ? (
              <>
                <Markdown>{currentStep.content}</Markdown>
                {currentStep.type === 'questions' && (
                  <ModuleQuestions completed={currentStep.completed} onAnswer={setQuestion} questions={currentStep.questions} />
                )}
                {currentStep.type === 'subskill_evaluations' && (
                  <ModuleSubskillEvaluations
                    completed={currentStep.completed}
                    evaluations={currentStep.subskill_evaluations}
                    onAnswer={setSubskillEvaluation}
                  />
                )}
                {currentStep.type === 'skill_evaluation' && currentStep.skill_evaluation && (
                  <ModuleSkillEvaluation
                    completed={currentStep.completed}
                    evaluation={localize(currentStep.skill_evaluation, locale)}
                    onAnswer={setSkillEvaluation}
                  />
                )}
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

              {isLastStep ? (
                module.status === ModuleStatus.Completed ? null : canProceed ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <ConfettiButton
                        className="gap-1"
                        disabled={!canProceed}
                        effect="fireworks"
                        onClick={() => handleNext()}
                        variant="outline"
                      >
                        {t('Modules.completeModule')}
                      </ConfettiButton>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle className="text-md flex gap-2 font-medium">{t('Auth.signupDialogTitle')}</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-4">
                        {t.rich('Auth.signupDialogMessage', {
                          b: content => <span className="font-semibold">{content}</span>,
                          p: content => <p className="text-sm text-muted-foreground">{content}</p>,
                          link: content => (
                            <Link className="underline underline-offset-4" external href={externalUrl('Website')} target="_blank">
                              {content}
                            </Link>
                          ),
                        })}
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">{t('Common.close')}</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button className="cursor-not-allowed gap-1" disabled variant="outline">
                        {t('Modules.completeModule')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent arrow={false}>{nextTooltip}</TooltipContent>
                  </Tooltip>
                )
              ) : canProceed ? (
                <Button className="gap-1" onClick={() => handleNext()} title={t('Modules.proceedToNextStep')} variant="outline">
                  {t('Common.next')}
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button className="cursor-not-allowed gap-1" disabled variant="outline">
                      {t('Common.next')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent arrow={false}>{nextTooltip}</TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
