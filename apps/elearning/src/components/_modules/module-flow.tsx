'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from 'lucide-react'

import { DescriptiveStepView } from '@/components/_modules/descriptive-step'
import { EvaluationStepView } from '@/components/_modules/evalutation-step'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { Module } from '@/lib/_types'

interface ModuleFlowProps {
  module: Module
}

export default ({ module }: ModuleFlowProps) => {
  const router = useRouter()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [userAnswers, setUserAnswers] = useState<Record<string, Record<string, number>>>({})

  const currentStep = module.steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === module.steps.length - 1
  const progress = Math.round((completedSteps.size / module.steps.length) * 100)

  const handleNext = () => {
    if (currentStep.type === 'descriptive') {
      markStepAsCompleted(currentStep.id)
    }

    if (!isLastStep) {
      setCurrentStepIndex(currentStepIndex + 1)
    } else {
      handleModuleCompletion()
    }
  }

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  const markStepAsCompleted = (stepId: string) => {
    setCompletedSteps(prev => {
      const updated = new Set(prev)
      updated.add(stepId)
      return updated
    })
  }

  // const handleTrueFalseAnswer = (answer: boolean) => {
  //   setUserAnswers(prev => ({
  //     ...prev,
  //     [currentStep.id]: answer,
  //   }))
  //   markStepAsCompleted(currentStep.id)
  // }

  const handleEvaluationAnswer = (questionId: string, rating: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentStep.id]: {
        ...prev[currentStep.id],
        [questionId]: rating,
      },
    }))

    // const allQuestionsAnswered = currentStep.questions.every(q => {
    //   const userAnswer = prev[currentStep.id]?.[q.id]
    //   return userAnswer !== undefined && userAnswer > 0
    // })

    // if (allQuestionsAnswered) {
    //   markStepAsCompleted(currentStep.id)
    // }
  }

  const handleModuleCompletion = () => {
    alert("Congratulations! You've completed this module.")
    router.push('/modules')
  }

  const isStepCompleted = (stepId: string) => completedSteps.has(stepId)

  const canProceed = () => {
    if (currentStep.type === 'descriptive') {
      return true
    }

    if (currentStep.type === 'true-false') {
      return userAnswers[currentStep.id] !== undefined
    }

    if (currentStep.type === 'evaluation') {
      return currentStep.questions.every(q => userAnswers[currentStep.id]?.[q.id] !== undefined)
    }

    return false
  }

  const renderStepContent = () => {
    switch (currentStep.type) {
      case 'descriptive':
        return <DescriptiveStepView step={currentStep} />
      case 'true-false':
        // return <TrueFalseStepView onAnswer={handleTrueFalseAnswer} step={currentStep} userAnswer={userAnswers[currentStep.id]} />
        return
      case 'evaluation':
        return (
          <EvaluationStepView
            onAnswer={handleEvaluationAnswer}
            step={currentStep}
            userAnswers={userAnswers[currentStep.id] || {}}
          />
        )
      default:
        return <div>{'Unknown step type'}</div>
    }
  }

  return (
    <div className="flex flex-col">
      <header className="border-b">
        <div className="container py-4">
          <div className="flex items-center gap-2">
            <Button onClick={() => router.push('/modules')} size="sm" variant="ghost">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              {'Back to Modules'}
            </Button>
          </div>
          <h1 className="mt-2 text-3xl font-bold">{module.title}</h1>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {'Step '}
                {currentStepIndex + 1}
                {' of '}
                {module.steps.length}
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
                  className={`flex cursor-pointer items-center rounded-md p-3 ${
                    index === currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : isStepCompleted(step.id)
                        ? 'bg-muted'
                        : 'hover:bg-muted'
                  }`}
                  key={step.id}
                  onClick={() => setCurrentStepIndex(index)}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs opacity-80">
                      {step.type === 'descriptive' && 'Reading'}
                      {step.type === 'true-false' && 'True/False Question'}
                      {step.type === 'evaluation' && 'Self-Assessment'}
                    </p>
                  </div>
                  {isStepCompleted(step.id) && <CheckCircleIcon className="ml-2 h-4 w-4 text-green-500" />}
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-9">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-6 text-2xl font-bold">{currentStep.title}</h2>
              {renderStepContent()}
            </div>

            <div className="mt-6 flex justify-between">
              <Button disabled={isFirstStep} onClick={handlePrevious} variant="outline">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                {'Previous'}
              </Button>

              <Button disabled={!canProceed()} onClick={handleNext}>
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
