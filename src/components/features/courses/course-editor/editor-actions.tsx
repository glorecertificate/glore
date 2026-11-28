import { AskAIButton } from '@/components/features/courses/course-editor/ask-ai-button'
import { cn } from '@/lib/utils'

export const EditorActions = ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
  <div className={cn('flex gap-2 max-sm:w-full max-sm:*:flex-1 max-sm:[&_button]:w-full', className)}>
    {children}
    <AskAIButton />
  </div>
)
