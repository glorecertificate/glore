'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from 'lucide-react'

import { DescriptiveStepView } from '@/components/_modules/descriptive-step'
import { EvaluationStepView } from '@/components/_modules/evalutation-step'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { Module } from '@/lib/_types'

const modules: Module[] = [
  {
    id: '1',
    title: 'Introduction to Volunteering',
    description: 'Learn the basics of volunteering and its impact on communities.',
    image: '/placeholder.svg?height=200&width=400',
    steps: [
      {
        id: 'step-1',
        type: 'descriptive',
        title: 'What is Volunteering?',
        content: `
# What is Volunteering?

Volunteering is the act of giving your time and services to help others without expecting payment in return. It's a fundamental way to contribute to your community and make a positive impact on society.

## Key Aspects of Volunteering

Volunteering involves:

- **Freely giving your time**: Unlike paid work, volunteering is done by choice.
- **Helping others**: The primary goal is to benefit someone else, a group, or an organization.
- **Community impact**: Volunteers often address needs that might otherwise go unmet.

![Volunteers working together](/placeholder.svg?height=300&width=600)

Volunteering can take many forms, from helping at local food banks to participating in global humanitarian efforts. The common thread is the desire to make a positive difference.
        `,
        images: ['/placeholder.svg?height=300&width=600'],
      },
      {
        id: 'step-2',
        type: 'descriptive',
        title: 'Benefits of Volunteering',
        content: `
# Benefits of Volunteering

Volunteering not only helps those you serve but also provides numerous benefits to you as a volunteer.

## Personal Benefits

- **Skill development**: Gain new abilities and enhance existing ones
- **Network expansion**: Meet like-minded individuals and build connections
- **Improved well-being**: Studies show volunteering can reduce stress and increase happiness

## Professional Benefits

- **Resume enhancement**: Demonstrate commitment and initiative to potential employers
- **Career exploration**: Test different fields without long-term commitment
- **Reference opportunities**: Build relationships with leaders who can vouch for your work

![Personal growth through volunteering](/placeholder.svg?height=300&width=600)

Remember that while these benefits are real, the primary purpose of volunteering remains helping others.
        `,
        images: ['/placeholder.svg?height=300&width=600'],
      },
      {
        id: 'step-3',
        type: 'true-false',
        title: 'Understanding Volunteer Commitment',
        content: `
# Understanding Volunteer Commitment

When you volunteer, you're making a commitment to an organization and the people it serves. This commitment should be taken seriously.

## Reliability Matters

Organizations depend on volunteers showing up when scheduled. When volunteers don't follow through:

- Services may be disrupted
- Staff must scramble to fill gaps
- Those being served may not receive needed help

## Setting Realistic Expectations

It's better to commit to less time and be reliable than to overcommit and frequently cancel. Consider:

- Your current schedule and obligations
- Travel time to and from the volunteer site
- Potential seasonal changes in your availability

Be honest with yourself and the organization about what you can realistically offer.
        `,
        question: 'Volunteering requires no commitment and you can cancel anytime without consequences.',
        correctAnswer: false,
      },
      {
        id: 'step-4',
        type: 'evaluation',
        title: 'Assessing Your Volunteer Readiness',
        content: `
# Assessing Your Volunteer Readiness

Before beginning a volunteer position, it's helpful to reflect on your motivations, expectations, and capacity.

## Self-Reflection

Take some time to consider why you want to volunteer and what you hope to gain from the experience. This self-awareness will help you find opportunities that align with your values and goals.

## Time Management

Volunteering requires dedicating time in your schedule. Consider how much time you realistically have available and how consistently you can commit to volunteering.

## Skills and Interests

Think about what skills you bring to the table and what activities you enjoy. Matching these with volunteer opportunities increases both your satisfaction and your contribution.

Please rate yourself on the following questions to assess your volunteer readiness.
        `,
        questions: [
          {
            id: 'q1',
            question: 'How clear are you about your motivations for volunteering?',
          },
          {
            id: 'q2',
            question: 'How confident are you in your ability to commit regular time to volunteering?',
          },
          {
            id: 'q3',
            question: 'How comfortable are you working with diverse groups of people?',
          },
          {
            id: 'q4',
            question: 'How willing are you to learn new skills for your volunteer role?',
          },
          {
            id: 'q5',
            question: 'How prepared are you to handle challenging situations that may arise while volunteering?',
          },
        ],
      },
    ],
  },
]

export const ModuleFlow = () => {
  const _module = modules[0]
  const router = useRouter()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [userAnswers, setUserAnswers] = useState<Record<string, Record<string, number>>>({})

  const currentStep = _module.steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === _module.steps.length - 1
  const progress = Math.round((completedSteps.size / _module.steps.length) * 100)

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
          <h1 className="mt-2 text-3xl font-bold">{_module.title}</h1>
          <div className="mt-4 flex items-center justify-between">
            <div className="fl_ex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {'Step '}
                {currentStepIndex + 1}
                {' of '}
                {_module.steps.length}
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
              {_module.steps.map((step, index) => (
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
