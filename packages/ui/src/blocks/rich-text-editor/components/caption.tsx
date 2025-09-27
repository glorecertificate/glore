'use client'

import {
  Caption as CaptionPrimitive,
  CaptionTextarea as CaptionTextareaPrimitive,
  useCaptionButton,
  useCaptionButtonState,
} from '@platejs/caption/react'
import { createPrimitiveComponent } from '@udecode/cn'
import { cva, type VariantProps } from 'class-variance-authority'

import { Button } from '@repo/ui/components/button'
import { cn } from '@repo/ui/utils'

const captionVariants = cva('max-w-full', {
  defaultVariants: {
    align: 'center',
  },
  variants: {
    align: {
      center: 'mx-auto',
      left: 'mr-auto',
      right: 'ml-auto',
    },
  },
})

export const Caption = ({
  align,
  className,
  ...props
}: React.ComponentProps<typeof CaptionPrimitive> & VariantProps<typeof captionVariants>) => (
  <CaptionPrimitive {...props} className={cn(captionVariants({ align }), className)} />
)

export const CaptionTextarea = (props: React.ComponentProps<typeof CaptionTextareaPrimitive>) => (
  <CaptionTextareaPrimitive
    {...props}
    className={cn(
      'mt-2 w-full resize-none border-none bg-inherit p-0 font-[inherit] text-inherit',
      'focus:outline-none focus:[&::placeholder]:opacity-0',
      'text-center print:placeholder:text-transparent',
      props.className,
    )}
  />
)

export const CaptionButton = createPrimitiveComponent(Button)({
  propsHook: useCaptionButton,
  stateHook: useCaptionButtonState,
})
