import { memo, useCallback, useMemo, useState } from 'react'

import { ClipboardCopyIcon, DotsHorizontalIcon, DownloadIcon, Link2Icon, SizeIcon } from '@radix-ui/react-icons'

import { Button, type ButtonProps } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface ImageActionsProps {
  shouldMerge?: boolean
  isLink?: boolean
  onView?: () => void
  onDownload?: () => void
  onCopy?: () => void
  onCopyLink?: () => void
}

export interface ActionButtonProps extends ButtonProps {
  icon: React.ReactNode
  tooltip: string
}

export const ActionWrapper = memo(({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'absolute top-3 right-3 flex flex-row rounded px-0.5 opacity-0 group-hover/node-image:opacity-100',
      'border-[0.5px] bg-[var(--mt-bg-secondary)] [backdrop-filter:saturate(1.8)_blur(20px)]',
      className,
    )}
    {...props}
  >
    {children}
  </div>
))

export const ActionButton = memo(({ className, icon, tooltip, ...props }: ActionButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        className={cn(
          'relative flex h-7 w-7 flex-row rounded-none p-0 text-muted-foreground hover:text-foreground',
          'bg-transparent hover:bg-transparent',
          className,
        )}
        variant="ghost"
        {...props}
      >
        {icon}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom">{tooltip}</TooltipContent>
  </Tooltip>
))

type ActionKey = 'onView' | 'onDownload' | 'onCopy' | 'onCopyLink'

const ActionItems: Array<{
  key: ActionKey
  icon: React.ReactNode
  tooltip: string
  isLink?: boolean
}> = [
  {
    key: 'onView',
    icon: <SizeIcon className="size-4" />,
    tooltip: 'View image',
  },
  {
    key: 'onDownload',
    icon: <DownloadIcon className="size-4" />,
    tooltip: 'Download image',
  },
  {
    key: 'onCopy',
    icon: <ClipboardCopyIcon className="size-4" />,
    tooltip: 'Copy image to clipboard',
  },
  {
    key: 'onCopyLink',
    icon: <Link2Icon className="size-4" />,
    tooltip: 'Copy image link',
    isLink: true,
  },
]

export const ImageActions: React.FC<ImageActionsProps> = memo(({ isLink = false, shouldMerge = false, ...actions }) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleAction = useCallback((e: React.MouseEvent, action: (() => void) | undefined) => {
    e.preventDefault()
    e.stopPropagation()
    action?.()
  }, [])

  const filteredActions = useMemo(() => ActionItems.filter(item => isLink || !item.isLink), [isLink])

  return (
    <ActionWrapper className={cn({ 'opacity-100': isOpen })}>
      {shouldMerge ? (
        <DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
          <DropdownMenuTrigger asChild>
            <ActionButton
              icon={<DotsHorizontalIcon className="size-4" />}
              onClick={e => e.preventDefault()}
              tooltip="Open menu"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {filteredActions.map(({ icon, key, tooltip }) => (
              <DropdownMenuItem key={key} onClick={e => handleAction(e, actions[key])}>
                <div className="flex flex-row items-center gap-2">
                  {icon}
                  <span>{tooltip}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        filteredActions.map(({ icon, key, tooltip }) => (
          <ActionButton icon={icon} key={key} onClick={e => handleAction(e, actions[key])} tooltip={tooltip} />
        ))
      )}
    </ActionWrapper>
  )
})
