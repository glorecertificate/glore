'use client'

import { useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Link } from '@/components/ui/link'
import { REGISTER_ROOT } from '@/lib/constants'
import { WEBSITE_URL } from '@/lib/metadata'
import { cn } from '@/lib/utils'

export const SignupDialog = ({ loading }: { loading: boolean }) => {
  const t = useTranslations('Auth')
  const [open, setOpen] = useState(false)

  useEffect(() => () => setOpen(false), [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="mt-2 text-center text-sm text-muted-foreground">
        {t.rich('signupMessage', {
          link: content => (
            <DialogTrigger asChild>
              <Button
                className={cn('text-foreground/95', loading && 'pointer-events-none')}
                disabled={loading}
                size="text"
                type="button"
                variant="link"
              >
                {content}
              </Button>
            </DialogTrigger>
          ),
        })}
      </div>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle className="text-left text-xl">{t('signupDialogTitle')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {t.rich('signupDialogMessage', {
            link: content => (
              <Link className="font-medium" href={WEBSITE_URL} variant="underlined">
                {content}
              </Link>
            ),
            p: content => <p>{content}</p>,
          })}
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Link className="flex-1 text-sm text-muted-foreground" href={REGISTER_ROOT}>
            {t('signupDialogRegister')}
          </Link>
          <DialogClose asChild>
            <Button variant="outline">{t('close')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
