import { cva } from 'class-variance-authority'

export type SkillGroupTone = 'brand' | 'neutral' | 'quaternary' | 'secondary' | 'tertiary'

const TONES = {
  'communication-skills': 'brand',
  'personal-skills': 'quaternary',
  'social-skills': 'secondary',
  'work-skills': 'tertiary',
} as const satisfies Record<string, SkillGroupTone>

export const skillGroupTone = (slug?: string | null): SkillGroupTone =>
  slug && slug in TONES ? TONES[slug as keyof typeof TONES] : 'neutral'

export const skillGroupToneVariants = cva('', {
  compoundVariants: [
    { className: 'bg-brand/15 text-brand-text', surface: 'soft', tone: 'brand' },
    { className: 'bg-brand-secondary/20 text-brand-secondary-text', surface: 'soft', tone: 'secondary' },
    { className: 'bg-brand-tertiary/12 text-brand-tertiary-text', surface: 'soft', tone: 'tertiary' },
    { className: 'bg-brand-quaternary/15 text-brand-quaternary-text', surface: 'soft', tone: 'quaternary' },
    { className: 'bg-muted text-muted-foreground', surface: 'soft', tone: 'neutral' },
    { className: 'bg-brand', surface: 'bar', tone: 'brand' },
    { className: 'bg-brand-secondary', surface: 'bar', tone: 'secondary' },
    { className: 'bg-brand-tertiary', surface: 'bar', tone: 'tertiary' },
    { className: 'bg-brand-quaternary', surface: 'bar', tone: 'quaternary' },
    { className: 'bg-muted-foreground/40', surface: 'bar', tone: 'neutral' },
  ],
  defaultVariants: { surface: 'soft', tone: 'neutral' },
  variants: {
    surface: { bar: '', soft: '' },
    tone: { brand: '', neutral: '', quaternary: '', secondary: '', tertiary: '' },
  },
})
