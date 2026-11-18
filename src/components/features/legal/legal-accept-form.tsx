'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { useTranslations } from 'next-intl'

import { logout } from '@/actions/auth'
import { acceptLegal } from '@/actions/legal/accept'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import { useActionError } from '@/hooks/use-action-error'
import { APP_ROOT, AUTH_ROOT } from '@/lib/constants'

export const LegalAcceptForm = () => {
  const t = useTranslations('LegalAccept')
  const router = useRouter()
  const actionError = useActionError()
  const [accepted, setAccepted] = useState(false)
  const [pending, startTransition] = useTransition()

  const handleAccept = () => {
    startTransition(async () => {
      const { error } = await acceptLegal()
      if (error) {
        toast.error(actionError(error, t('error')))
        return
      }
      router.replace(APP_ROOT)
    })
  }

  const handleLogout = () => {
    startTransition(async () => {
      await logout()
      router.replace(AUTH_ROOT)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors has-[:focus-visible]:border-border-strong">
        <Checkbox
          checked={accepted}
          className="mt-0.5"
          data-testid="legal-accept-checkbox"
          disabled={pending}
          id="legal-accept"
          onCheckedChange={checked => setAccepted(checked === true)}
        />
        <Label className="cursor-pointer text-sm/6 text-fg-1" htmlFor="legal-accept">
          {t('accept')}
        </Label>
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          data-testid="legal-accept-submit"
          className="sm:min-w-40"
          disabled={!accepted}
          loading={pending}
          onClick={handleAccept}
          type="button"
          variant="brand"
        >
          {t('submit')}
        </Button>
        <Button className="sm:min-w-28" disabled={pending} onClick={handleLogout} type="button" variant="ghost">
          {t('logout')}
        </Button>
      </div>
    </div>
  )
}
