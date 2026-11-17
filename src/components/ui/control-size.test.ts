import { describe, expect, it } from 'vitest'

import { buttonVariants } from '@/components/ui/button'
import { inputVariants } from '@/components/ui/input'
import { selectTriggerVariants } from '@/components/ui/select'

const HEIGHTS = { '2xs': 'h-6', xs: 'h-7', sm: 'h-8', md: 'h-9', lg: 'h-11' } as const
const SQUARES = { 'icon-2xs': 'size-6', 'icon-xs': 'size-7', 'icon-sm': 'size-8', icon: 'size-9', 'icon-lg': 'size-11' }

const classesOf = (value: string) => value.split(/\s+/u)

const fieldSizes = (['xs', 'sm', 'md', 'lg'] as const).map(size => [size, HEIGHTS[size]] as const)

describe('control sizes', () => {
  it('puts every button size on the height scale', () => {
    for (const [size, height] of Object.entries(HEIGHTS) as [keyof typeof HEIGHTS, string][]) {
      expect(classesOf(buttonVariants({ size }))).toContain(height)
    }
  })

  it('makes icon buttons square on the same scale', () => {
    for (const [size, square] of Object.entries(SQUARES) as [keyof typeof SQUARES, string][]) {
      expect(classesOf(buttonVariants({ size }))).toContain(square)
    }
  })

  it('matches field heights to button heights', () => {
    for (const [size, height] of fieldSizes) {
      expect(classesOf(inputVariants({ size }))).toContain(height)
      expect(classesOf(selectTriggerVariants({ size }))).toContain(height)
    }
  })

  it('defaults buttons and fields to the md height', () => {
    expect(classesOf(buttonVariants())).toContain(HEIGHTS.md)
    expect(classesOf(inputVariants())).toContain(HEIGHTS.md)
    expect(classesOf(selectTriggerVariants())).toContain(HEIGHTS.md)
  })

  it('keeps text fields at 16px on mobile so iOS does not zoom on focus', () => {
    for (const [size] of fieldSizes) {
      expect(classesOf(inputVariants({ size }))).toContain('text-base')
    }
  })

  it('draws the focus ring with the shared utility', () => {
    expect(classesOf(buttonVariants())).toContain('focus-visible:focus-ring')
    expect(classesOf(inputVariants())).toContain('focus-visible:focus-ring-inset')
    expect(classesOf(inputVariants({ ring: false }))).not.toContain('focus-visible:focus-ring-inset')
  })
})
