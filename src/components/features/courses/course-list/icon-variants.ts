import { cva } from 'class-variance-authority'

export const courseIconVariants = cva('', {
  compoundVariants: [
    {
      type: 'intro',
      background: true,
      className: 'bg-muted-foreground/12 hover:bg-muted-foreground/20! aria-expanded:bg-muted-foreground/20!',
    },
    {
      type: 'learner',
      background: true,
      className: 'bg-brand/12 hover:bg-brand/20! aria-expanded:bg-brand/20!',
    },
    {
      type: 'skill',
      background: true,
      className: 'bg-brand-tertiary/12 hover:bg-brand-tertiary/20! aria-expanded:bg-brand-tertiary/20!',
    },
  ],
  defaultVariants: {
    background: false,
  },
  variants: {
    background: {
      false: '',
      true: '',
    },
    type: {
      intro: 'text-muted-foreground',
      learner: 'text-brand-text',
      skill: 'text-brand-tertiary-text',
    },
  },
})
