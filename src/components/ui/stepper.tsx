'use client'

import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { cn } from '@/lib/utils'

type StepperOrientation = 'horizontal' | 'vertical'
type StepState = 'active' | 'completed' | 'inactive' | 'loading'

interface StepIndicators {
  active?: React.ReactNode
  completed?: React.ReactNode
  inactive?: React.ReactNode
  loading?: React.ReactNode
}

const StepperContext = createContext<{
  activeStep: number
  focusFirst: () => void
  focusLast: () => void
  focusNext: (currentIdx: number) => void
  focusPrev: (currentIdx: number) => void
  indicators: StepIndicators
  orientation: StepperOrientation
  registerTrigger: (node: HTMLButtonElement | null) => void
  setActiveStep: (step: number) => void
  stepsCount: number
  triggerNodes: HTMLButtonElement[]
} | null>(null)

const StepItemContext = createContext<{
  step: number
  state: StepState
  isDisabled: boolean
  isLoading: boolean
} | null>(null)

const useStepper = () => {
  const context = useContext(StepperContext)
  if (!context) throw new Error('useStepper must be used within a Stepper')
  return context
}

const useStepItem = () => {
  const context = useContext(StepItemContext)
  if (!context) throw new Error('useStepItem must be used within a StepperItem')
  return context
}

export const Stepper = ({
  defaultValue = 1,
  value,
  onValueChange,
  orientation = 'horizontal',
  className,
  children,
  indicators = {},
  ...props
}: React.ComponentProps<'div'> & {
  defaultValue?: number
  value?: number
  onValueChange?: (value: number) => void
  orientation?: StepperOrientation
  indicators?: StepIndicators
}) => {
  const [activeStep, setActiveStep] = useState(defaultValue)
  const [triggerNodes, setTriggerNodes] = useState<HTMLButtonElement[]>([])

  const registerTrigger = useCallback((node: HTMLButtonElement | null) => {
    setTriggerNodes(prev => {
      if (node && !prev.includes(node)) return [...prev, node]
      if (!node && prev.includes(node!)) return prev.filter(n => n !== node)
      return prev
    })
  }, [])

  const handleSetActiveStep = useCallback(
    (step: number) => {
      if (value === undefined) setActiveStep(step)
      onValueChange?.(step)
    },
    [value, onValueChange]
  )

  const currentStep = value ?? activeStep

  const focusTrigger = useCallback(
    (idx: number) => {
      if (triggerNodes[idx]) triggerNodes[idx].focus()
    },
    [triggerNodes]
  )

  const focusNext = useCallback(
    (currentIdx: number) => focusTrigger((currentIdx + 1) % triggerNodes.length),
    [focusTrigger, triggerNodes.length]
  )

  const focusPrev = useCallback(
    (currentIdx: number) => focusTrigger((currentIdx - 1 + triggerNodes.length) % triggerNodes.length),
    [focusTrigger, triggerNodes.length]
  )

  const focusFirst = useCallback(() => focusTrigger(0), [focusTrigger])

  const focusLast = useCallback(() => focusTrigger(triggerNodes.length - 1), [focusTrigger, triggerNodes.length])

  const contextValue = useMemo(
    () => ({
      activeStep: currentStep,
      setActiveStep: handleSetActiveStep,
      stepsCount: Children.toArray(children).filter(
        (child): child is React.ReactElement =>
          isValidElement(child) && (child.type as { displayName?: string }).displayName === 'StepperItem'
      ).length,
      orientation,
      registerTrigger,
      focusNext,
      focusPrev,
      focusFirst,
      focusLast,
      triggerNodes,
      indicators,
    }),
    [
      currentStep,
      handleSetActiveStep,
      children,
      orientation,
      registerTrigger,
      triggerNodes,
      focusFirst,
      focusLast,
      focusNext,
      focusPrev,
      indicators,
    ]
  )

  return (
    <StepperContext.Provider value={contextValue}>
      <div
        aria-orientation={orientation}
        className={cn('w-full', className)}
        data-orientation={orientation}
        data-slot="stepper"
        role="tablist"
        {...props}
      >
        {children}
      </div>
    </StepperContext.Provider>
  )
}

export const StepperItem = ({
  step,
  completed = false,
  disabled = false,
  loading = false,
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  step: number
  completed?: boolean
  disabled?: boolean
  loading?: boolean
}) => {
  const { activeStep } = useStepper()

  const state: StepState = completed || step < activeStep ? 'completed' : activeStep === step ? 'active' : 'inactive'
  const isLoading = loading && step === activeStep

  return (
    <StepItemContext.Provider value={{ step, state, isDisabled: disabled, isLoading }}>
      <div
        className={cn(
          'group/step flex not-last:flex-1 items-center justify-center group-data-[orientation=horizontal]/stepper-nav:flex-row group-data-[orientation=vertical]/stepper-nav:flex-col',
          className
        )}
        data-slot="stepper-item"
        data-state={state}
        {...(isLoading ? { 'data-loading': true } : {})}
        {...props}
      >
        {children}
      </div>
    </StepItemContext.Provider>
  )
}

export const StepperTrigger = ({
  asChild = false,
  className,
  children,
  tabIndex,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean
}) => {
  const { state, isLoading } = useStepItem()
  const stepperCtx = useStepper()
  const { setActiveStep, activeStep, registerTrigger, triggerNodes, focusNext, focusPrev, focusFirst, focusLast } =
    stepperCtx
  const { step, isDisabled } = useStepItem()
  const selected = activeStep === step
  const id = `stepper-tab-${step}`
  const panelId = `stepper-panel-${step}`

  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (buttonRef.current) {
      registerTrigger(buttonRef.current)
    }
  }, [registerTrigger])

  const myIdx = useMemo(() => (buttonRef.current ? triggerNodes.indexOf(buttonRef.current) : -1), [triggerNodes])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        if (myIdx !== -1 && focusNext) focusNext(myIdx)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        if (myIdx !== -1 && focusPrev) focusPrev(myIdx)
        break
      case 'Home':
        e.preventDefault()
        if (focusFirst) focusFirst()
        break
      case 'End':
        e.preventDefault()
        if (focusLast) focusLast()
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        setActiveStep(step)
        break
    }
  }

  if (asChild) {
    return (
      <span className={className} data-slot="stepper-trigger" data-state={state}>
        {children}
      </span>
    )
  }

  return (
    <button
      aria-controls={panelId}
      aria-selected={selected}
      className={cn(
        'inline-flex cursor-pointer items-center gap-3 rounded-full outline-none focus-visible:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60',
        className
      )}
      data-loading={isLoading}
      data-slot="stepper-trigger"
      data-state={state}
      disabled={isDisabled}
      id={id}
      onClick={() => setActiveStep(step)}
      onKeyDown={handleKeyDown}
      ref={buttonRef}
      role="tab"
      tabIndex={typeof tabIndex === 'number' ? tabIndex : selected ? 0 : -1}
      {...props}
    >
      {children}
    </button>
  )
}

export const StepperIndicator = ({ children, className }: React.ComponentProps<'div'>) => {
  const { state, isLoading } = useStepItem()
  const { indicators } = useStepper()

  return (
    <div
      className={cn(
        'relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full border-background bg-accent text-accent-foreground text-xs data-[state=active]:bg-primary data-[state=completed]:bg-primary data-[state=active]:text-primary-foreground data-[state=completed]:text-primary-foreground',
        className
      )}
      data-slot="stepper-indicator"
      data-state={state}
    >
      <div className="absolute">
        {indicators &&
        ((isLoading && indicators.loading) ||
          (state === 'completed' && indicators.completed) ||
          (state === 'active' && indicators.active) ||
          (state === 'inactive' && indicators.inactive))
          ? (isLoading && indicators.loading) ||
            (state === 'completed' && indicators.completed) ||
            (state === 'active' && indicators.active) ||
            (state === 'inactive' && indicators.inactive)
          : children}
      </div>
    </div>
  )
}

export const StepperSeparator = ({ className }: React.ComponentProps<'div'>) => {
  const { state } = useStepItem()

  return (
    <div
      className={cn(
        'm-0.5 rounded-full bg-muted group-data-[orientation=horizontal]/stepper-nav:h-0.5 group-data-[orientation=vertical]/stepper-nav:h-12 group-data-[orientation=vertical]/stepper-nav:w-0.5 group-data-[orientation=horizontal]/stepper-nav:flex-1',
        className
      )}
      data-slot="stepper-separator"
      data-state={state}
    />
  )
}

export const StepperTitle = ({ children, className }: React.ComponentProps<'h3'>) => {
  const { state } = useStepItem()

  return (
    <h3 className={cn('font-medium text-sm leading-none', className)} data-slot="stepper-title" data-state={state}>
      {children}
    </h3>
  )
}

export const StepperDescription = ({ children, className }: React.ComponentProps<'div'>) => {
  const { state } = useStepItem()

  return (
    <div className={cn('text-muted-foreground text-sm', className)} data-slot="stepper-description" data-state={state}>
      {children}
    </div>
  )
}

export const StepperNav = ({ children, className }: React.ComponentProps<'nav'>) => {
  const { activeStep, orientation } = useStepper()

  return (
    <nav
      className={cn(
        'group/stepper-nav inline-flex data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col',
        className
      )}
      data-orientation={orientation}
      data-slot="stepper-nav"
      data-state={activeStep}
    >
      {children}
    </nav>
  )
}

export const StepperPanel = ({ children, className }: React.ComponentProps<'div'>) => {
  const { activeStep } = useStepper()

  return (
    <div className={cn('w-full', className)} data-slot="stepper-panel" data-state={activeStep}>
      {children}
    </div>
  )
}

export const StepperContent = ({
  value,
  forceMount,
  children,
  className,
}: React.ComponentProps<'div'> & {
  value: number
  forceMount?: boolean
}) => {
  const { activeStep } = useStepper()
  const isActive = value === activeStep

  if (!(forceMount || isActive)) {
    return null
  }

  return (
    <div
      className={cn('w-full', className, !isActive && forceMount && 'hidden')}
      data-slot="stepper-content"
      data-state={activeStep}
      hidden={!isActive && forceMount}
    >
      {children}
    </div>
  )
}
