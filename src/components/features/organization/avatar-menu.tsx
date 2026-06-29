'use client'

import { useRef, useState } from 'react'

import { ImageIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ImageCropper, type ImageCropperHandle } from '@/components/ui/image-cropper'
import { cn } from '@/lib/utils'

export const OrganizationAvatarMenu = ({
  className,
  disabled,
  fallback,
  name,
  onAvatarRemove,
  onAvatarUpload,
  overlap,
  value,
  ...props
}: React.ComponentProps<'div'> & {
  disabled?: boolean
  fallback: string
  name: string
  onAvatarRemove: () => Promise<void> | void
  onAvatarUpload: (file: File) => Promise<void>
  overlap?: boolean
  value?: string | null
}) => {
  const t = useTranslations('Organization')

  const pickerRef = useRef<ImageCropperHandle>(null)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removing, setRemoving] = useState(false)

  const handleRemove = async () => {
    try {
      setRemoving(true)
      await onAvatarRemove()
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className={cn('w-fit', className)} {...props}>
      <ImageCropper
        disabled={disabled}
        onChange={onAvatarUpload}
        pickerRef={pickerRef}
        trigger={
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={disabled}>
              <button
                className={cn('group relative size-20 shrink-0 cursor-pointer rounded-2xl', overlap && '-mt-12')}
                type="button"
              >
                <Avatar className="size-20 rounded-2xl border border-border shadow-2xs">
                  {value && <AvatarImage alt={name} className="object-cover" src={value} />}
                  <AvatarFallback className="rounded-2xl bg-muted text-2xl font-semibold">{fallback}</AvatarFallback>
                </Avatar>
                <span className="absolute -right-1.5 -bottom-1.5 flex size-7 items-center justify-center rounded-full border border-border bg-background shadow-2xs transition-colors group-hover:bg-accent">
                  <PencilIcon className="size-3.5 text-muted-foreground" />
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => pickerRef.current?.open()}>
                  <ImageIcon className="text-muted-foreground" />
                  {t('updateAvatar')}
                </DropdownMenuItem>
                {value && (
                  <DropdownMenuItem onSelect={() => setRemoveOpen(true)} variant="destructive">
                    <Trash2Icon />
                    {t('removeAvatar')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        }
        value={value}
      />

      <AlertDialog onOpenChange={setRemoveOpen} open={removeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('removeAvatarTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('removeAvatarDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction loading={removing} onClick={handleRemove} variant="destructive">
              {t('removeAvatar')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
