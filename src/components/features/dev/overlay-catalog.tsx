'use client'

import { useState } from 'react'

import { useForm } from 'react-hook-form'

import { CatalogRow } from '@/components/features/dev/catalog-row'
import { CatalogSection } from '@/components/features/dev/catalog-section'
import { Button } from '@/components/ui/button'
import { Chart } from '@/components/ui/chart'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Form, FormField, FormItem } from '@/components/ui/form'
import {
  MultiSelect,
  MultiSelectBadge,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
} from '@/components/ui/multi-select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/components/ui/stepper'
import { toast } from '@/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const OPTIONS = ['one', 'two', 'three']

const STEPS = [1, 2, 3] as const

const CHART_DATA = [
  { id: 1, label: 'Jan', value: 12 },
  { id: 2, label: 'Feb', value: 19 },
  { id: 3, label: 'Mar', value: 8 },
  { id: 4, label: 'Apr', value: 24 },
]

const CHART_SERIES = [{ key: 'value', label: 'value' }]

const showError = () => toast.error('Something went wrong', { description: 'Try again in a moment.' })

const showInfo = () => toast.info('Heads up', { action: { label: 'Undo', onClick: () => undefined } })

const showSuccess = () => toast.success('Saved')

const showWarning = () => toast.warning('Check this', { description: 'A description for the warning.' })

export const OverlayCatalog = () => {
  const [selected, setSelected] = useState(['one'])
  const form = useForm({ defaultValues: { date: '2026-11-18', empty: '' } })

  return (
    <>
      <CatalogSection id="overlays" name="Dialog, Sheet, Popover, Tooltip, DropdownMenu">
        <CatalogRow label="Dialog">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">{'open dialog'}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{'DialogTitle'}</DialogTitle>
                <DialogDescription>{'DialogDescription'}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">{'cancel'}</Button>
                <Button>{'confirm'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CatalogRow>
        <CatalogRow label="Sheet">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">{'open sheet'}</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{'SheetTitle'}</SheetTitle>
                <SheetDescription>{'SheetDescription'}</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </CatalogRow>
        <CatalogRow label="Popover">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">{'open popover'}</Button>
            </PopoverTrigger>
            <PopoverContent>{'PopoverContent'}</PopoverContent>
          </Popover>
        </CatalogRow>
        <CatalogRow label="Tooltip">
          <Tooltip>
            <TooltipTrigger asChild pointerEvents="auto">
              <Button variant="outline">{'hover'}</Button>
            </TooltipTrigger>
            <TooltipContent>{'TooltipContent'}</TooltipContent>
          </Tooltip>
        </CatalogRow>
        <CatalogRow label="DropdownMenu">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">{'open menu'}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>{'item'}</DropdownMenuItem>
              <DropdownMenuItem>{'item'}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">{'destructive'}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CatalogRow>
        <CatalogRow label="toast">
          <Button onClick={showSuccess} variant="outline">
            {'success'}
          </Button>
          <Button onClick={showInfo} variant="outline">
            {'info'}
          </Button>
          <Button onClick={showWarning} variant="outline">
            {'warning'}
          </Button>
          <Button onClick={showError} variant="outline">
            {'error'}
          </Button>
        </CatalogRow>
      </CatalogSection>
      <CatalogSection id="pickers" name="Command, DatePicker, MultiSelect, Stepper, Chart">
        <CatalogRow label="Command">
          <Command className="w-full max-w-sm rounded-lg border">
            <CommandInput placeholder="search" />
            <CommandList>
              <CommandEmpty>{'empty'}</CommandEmpty>
              <CommandGroup heading="group">
                {OPTIONS.map(option => (
                  <CommandItem key={option}>{option}</CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </CatalogRow>
        <CatalogRow label="DatePicker">
          <Form {...form}>
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <DatePicker onChange={field.onChange} placeholder="pick a date" value={field.value} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="empty"
              render={({ field }) => (
                <FormItem>
                  <DatePicker onChange={field.onChange} placeholder="pick a date" value={field.value} />
                </FormItem>
              )}
            />
          </Form>
        </CatalogRow>
        <CatalogRow label="MultiSelect">
          <MultiSelect label="options" onChange={setSelected} options={OPTIONS} value={selected}>
            <MultiSelectTrigger position="start">
              {selected.map(value => (
                <MultiSelectBadge key={value} label={value} value={value} />
              ))}
            </MultiSelectTrigger>
            <MultiSelectContent align="start">
              {OPTIONS.map(value => (
                <MultiSelectItem key={value} value={value}>
                  {value}
                </MultiSelectItem>
              ))}
            </MultiSelectContent>
          </MultiSelect>
        </CatalogRow>
        <CatalogRow label="Stepper">
          <Stepper className="w-full" defaultValue={2}>
            <StepperNav>
              {STEPS.map(step => (
                <StepperItem key={step} step={step}>
                  <StepperTrigger>
                    <StepperIndicator>{step}</StepperIndicator>
                    <div className="flex flex-col gap-1 text-left">
                      <StepperTitle>{`Step ${step}`}</StepperTitle>
                      <StepperDescription>{'description'}</StepperDescription>
                    </div>
                  </StepperTrigger>
                  {step < STEPS.length && <StepperSeparator />}
                </StepperItem>
              ))}
            </StepperNav>
          </Stepper>
        </CatalogRow>
        <CatalogRow label="Chart">
          <Chart className="w-full" data={CHART_DATA} label="chart" series={CHART_SERIES} variant="bar" />
        </CatalogRow>
      </CatalogSection>
    </>
  )
}
