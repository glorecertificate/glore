import { useCallback, useState } from 'react'

import { CopyIcon, ExternalLinkIcon, LinkBreak2Icon } from '@radix-ui/react-icons'

import { ToolbarButton } from '@/components/ui/rich-text-editor/components/toolbar-button'
import { Separator } from '@/components/ui/separator'

interface LinkPopoverBlockProps {
  url: string
  onClear: () => void
  onEdit: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export const LinkPopoverBlock: React.FC<LinkPopoverBlockProps> = ({ onClear, onEdit, url }) => {
  const [copyTitle, setCopyTitle] = useState<string>('Copy')

  const handleCopy = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setCopyTitle('Copied!')
          setTimeout(() => setCopyTitle('Copy'), 1000)
        })
        .catch(console.error)
    },
    [url],
  )

  const handleOpenLink = useCallback(() => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [url])

  return (
    <div className="flex h-10 overflow-hidden rounded bg-background p-2 shadow-lg">
      <div className="inline-flex items-center gap-1">
        <ToolbarButton className="w-auto px-2" onClick={onEdit} tooltip="Edit link">
          {'Edit link'}
        </ToolbarButton>
        <Separator orientation="vertical" />
        <ToolbarButton onClick={handleOpenLink} tooltip="Open link in a new tab">
          <ExternalLinkIcon className="size-4" />
        </ToolbarButton>
        <Separator orientation="vertical" />
        <ToolbarButton onClick={onClear} tooltip="Clear link">
          <LinkBreak2Icon className="size-4" />
        </ToolbarButton>
        <Separator orientation="vertical" />
        <ToolbarButton
          onClick={handleCopy}
          tooltip={copyTitle}
          tooltipOptions={{
            onPointerDownOutside: e => {
              if (e.target === e.currentTarget) e.preventDefault()
            },
          }}
        >
          <CopyIcon className="size-4" />
        </ToolbarButton>
      </div>
    </div>
  )
}
