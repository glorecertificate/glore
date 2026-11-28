'use client'

import { useTranslations } from 'next-intl'

import { useAskAI } from '@/components/features/courses/course-editor/ask-ai-provider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const AskAIButton = ({ className }: { className?: string }) => {
  const t = useTranslations('Components.RichTextEditor.ai')
  const askAI = useAskAI()

  return (
    <Button
      className={cn('hidden pointer-coarse:inline-flex', className)}
      disabled={!askAI?.action}
      icon="sparkles"
      onClick={() => askAI?.action?.()}
      onMouseDown={event => event.preventDefault()}
      type="button"
      variant="outline"
    >
      {t('askAI')}
    </Button>
  )
}
