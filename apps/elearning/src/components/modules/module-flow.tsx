'use client'

import { notFound } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { ArrowLeftIcon, ChevronDownIcon, EyeIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { type BooleanString } from '@repo/utils'

import {
  createUserAnswers,
  createUserModuleStep,
  createUserSkillEvaluation,
  createUserSubskillEvaluations,
  ModuleStatus,
  type Module,
  type ModuleQuestion,
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
import { List } from '@/components/ui/list'
import { Markdown } from '@/components/ui/markdown'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useDashboard } from '@/hooks/use-dashboard'
import { useHeader } from '@/hooks/use-header'
import { useLocale } from '@/hooks/use-locale'
import { useScroll } from '@/hooks/use-scroll'
import { useSyncStatus } from '@/hooks/use-sync-status'
import { Route } from '@/lib/navigation'
import { cn, localize } from '@/lib/utils'
import { type Localized } from '@/services/i18n'
import app from 'config/app.json'

export const ModuleFlow = ({ moduleId }: { moduleId: number }) => {
  const { modules, setModules, user } = useDashboard()
  const [locale] = useLocale()
  const t = useTranslations()
  const { setBreadcrumb, setHeaderShadow } = useHeader()
  const { isScrolled } = useScroll()
  const { setSyncStatus } = useSyncStatus()

  const module = useMemo(() => modules.find(({ id }) => id === moduleId) ?? notFound(), [modules, moduleId])
  const [syncedModule, setSyncedModule] = useState(module)

  const localized = useMemo(() => localize(module, locale), [module, locale])

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
        <BreadcrumbItem className="text-foreground">{localized.title}</BreadcrumbItem>
      </BreadcrumbList>,
    )
  }, [localized.title, setBreadcrumb, setHeaderShadow, t])

  const initialStepIndex = useMemo(() => {
    if (module.status === ModuleStatus.Completed) return 0
    const incompletedIndex = module.steps.findIndex(step => !step.completed)
    if (incompletedIndex !== -1) return incompletedIndex
    return module.steps.length - 1
  }, [module.steps, module.status])

  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex)

  const currentStep = useMemo(() => localized.steps[currentStepIndex] || {}, [localized.steps, currentStepIndex])
  const currentSyncedStep = useMemo(() => syncedModule.steps[currentStepIndex] || {}, [syncedModule.steps, currentStepIndex])
  const hasSteps = useMemo(() => module.steps.length > 0, [module.steps])
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

  const setModule = useCallback(
    (updater: (module: Module) => Module) => {
      setModules(modules => modules.map(m => (m.id === module.id ? updater(m) : m)))
    },
    [setModules, module],
  )
  const onQuestionAnswer = useCallback(
    async (question: Localized<ModuleQuestion>, value: BooleanString) => {
      setModule(({ steps, ...module }) => ({
        ...module,
        steps: steps.map((step, i) =>
          i === currentStepIndex
            ? { ...step, questions: step.questions.map(q => (q.id === question.id ? { ...q, user_answer: value } : q)) }
            : step,
        ),
      }))
      try {
        setSyncStatus('syncing')
        await createUserAnswers({
          userId: user.id,
          questions: [{ id: question.id, answer: value }],
        })
        setSyncStatus('complete')
      } catch (e) {
        setSyncStatus('error')
        console.error(e)
      }
    },
    [currentStepIndex, setModule, setSyncStatus, user.id],
  )
  const onSubskillEvaluation = useCallback(
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
    [currentStepIndex, setModule],
  )
  const onSkillEvaluation = useCallback(
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
    [currentStepIndex, setModule],
  )

  const handlePrevious = useCallback(() => {
    if (!isFirstStep) setCurrentStepIndex(currentStepIndex - 1)
  }, [currentStepIndex, isFirstStep])

  const handleNext = useCallback(async () => {
    try {
      const step = currentStep
      const stepIndex = currentStepIndex

      if (!isLastStep) setCurrentStepIndex(i => i + 1)
      if (currentSyncedStep.completed) return

      setModule(module => ({
        ...module,
        steps: module.steps.map((s, i) => (i === stepIndex ? { ...s, completed: true } : s)),
        status: isLastStep ? ModuleStatus.Completed : module.status,
        completed: isLastStep,
      }))

      setSyncStatus('syncing')

      await createUserModuleStep({
        userId: user.id,
        moduleStepId: step.id,
      })

      switch (step.type) {
        case 'questions': {
          await createUserAnswers({
            userId: user.id,
            questions: step.questions.map(q => ({ id: q.id, answer: q.user_answer as BooleanString })),
          })
          break
        }
        case 'subskill_evaluations': {
          await createUserSubskillEvaluations({
            userId: user.id,
            evaluations: step.subskill_evaluations.map(e => ({ id: e.id, rating: e.user_evaluation as number })),
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
      toast.error(t('Common.syncErrorMessage'), {
        dismissible: false,
        position: 'bottom-right',
      })
      setSyncStatus('error')
      console.error(e)
    }
  }, [currentStep, currentStepIndex, isLastStep, module, setModule, setSyncStatus, t, user.id, currentSyncedStep.completed])

  const onStepButtonClick = useCallback(
    async (index: number) => {
      if (index > currentStepIndex && !currentStep.completed) return
      if (index === currentStepIndex + 1) return handleNext()
      setCurrentStepIndex(index)
    },
    [currentStep.completed, currentStepIndex, handleNext],
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

  const completedModulesCount = useMemo(() => modules.filter(m => m.status === ModuleStatus.Completed).length, [modules])
  const completedTitle = useMemo(
    () =>
      completedModulesCount === modules.length
        ? t('Modules.completedTitleAll')
        : t('Modules.completedTitle', {
            count: completedModulesCount,
          }),
    [completedModulesCount, modules.length, t],
  )
  const completedMessage = useMemo(
    () =>
      completedModulesCount < 3
        ? t('Modules.completedMessage')
        : completedModulesCount === app.minModules
          ? t('Modules.completedRequestCertificate')
          : t('Modules.completeIncludeInCertificate'),
    [completedModulesCount, t],
  )

  return (
    <div className="container mx-auto flex flex-1 px-8 pb-8">
      {/* Steps sidebar */}
      <div className="mr-2 hidden max-w-lg min-w-52 flex-1/4 shrink-0 md:block md:max-lg:flex-1/3">
        <div className="sticky top-[72px] flex items-center gap-2">
          <span className="pt-1 text-sm text-muted-foreground">
            {hasSteps
              ? t('Modules.stepCount', {
                  count: String(currentStepIndex + 1),
                  total: String(module.steps.length),
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
              {localized.steps.map((step, index) => (
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
                      <span className="font-medium">{localized.title}</span>
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
                localized.steps.map((step, index) => (
                  <DropdownMenuItem
                    className="flex justify-between py-2"
                    key={step.id}
                    onClick={() => setCurrentStepIndex(index)}
                  >
                    <div className="flex flex-col">
                      <span className={cn(isCurrentStep(index) && 'font-semibold')}>
                        {step.title} {isCompletedStep(index) && <span className="ml-1 text-xs text-success">{'✔︎'}</span>}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatStepType(step.type)}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem className="flex justify-between py-2">
                  <div className="flex flex-col">
                    <span>{'Add step'}</span>
                  </div>
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
                <Badge
                  className="mr-2 cursor-help rounded-full border-muted-foreground/60 p-1.5 text-muted-foreground/90"
                  variant="outline"
                >
                  <EyeIcon className="h-4 w-4 text-muted-foreground" />
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
                  <ModuleQuestions
                    completed={currentStep.completed}
                    onAnswer={onQuestionAnswer}
                    questions={currentStep.questions}
                  />
                )}
                {currentStep.type === 'subskill_evaluations' && (
                  <ModuleSubskillEvaluations
                    completed={currentStep.completed}
                    evaluations={currentStep.subskill_evaluations}
                    onEvaluation={onSubskillEvaluation}
                  />
                )}
                {currentStep.type === 'skill_evaluation' && currentStep.skill_evaluation && (
                  <ModuleSkillEvaluation
                    completed={currentStep.completed}
                    evaluation={localize(currentStep.skill_evaluation, locale)}
                    onEvaluation={onSkillEvaluation}
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
                canProceed ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      {module.status === ModuleStatus.Completed ? null : (
                        <ConfettiButton
                          className={cn('gap-1')}
                          disabled={!canProceed}
                          effect="fireworks"
                          onClick={handleNext}
                          options={{ zIndex: 100 }}
                          variant="outline"
                        >
                          {t('Modules.completeModule')}
                        </ConfettiButton>
                      )}
                    </DialogTrigger>
                    <DialogContent className="px-8 sm:max-w-xl">
                      <DialogHeader>
                        <DialogTitle className="mt-3 flex gap-2 text-lg font-medium">
                          {completedTitle}
                          {' 🎉'}
                        </DialogTitle>
                      </DialogHeader>
                      <div>
                        <p>{t('Modules.completedVerifiedSkills')}</p>
                        <List className="mt-2" variant="list">
                          {localized.skill.subskills.map(({ id, name }) => (
                            <List.Item key={id}>{name}</List.Item>
                          ))}
                        </List>
                      </div>
                      <p className="mt-2 mb-1.5 text-[15px] text-foreground/80">{completedMessage}</p>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">{t('Modules.reviewModule')}</Button>
                        </DialogClose>
                        {completedModulesCount < 3 && (
                          <Button asChild variant="outline">
                            <Link href={Route.Modules}>{t('Modules.backTo')}</Link>
                          </Button>
                        )}
                        {completedModulesCount === app.minModules && (
                          <Button asChild color="primary">
                            <Link href={Route.CertificatesNew}>{t('Modules.requestCertificate')}</Link>
                          </Button>
                        )}
                        {completedModulesCount > app.minModules && (
                          <Button asChild variant="outline">
                            <Link href={Route.Certificates}>{t('Modules.goToCertificates')}</Link>
                          </Button>
                        )}
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
