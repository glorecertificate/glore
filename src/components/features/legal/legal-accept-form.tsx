'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { logout } from '@/actions/auth'
import { acceptLegal } from '@/actions/legal/accept'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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
      <div className="flex items-start gap-3 rounded-lg border p-4">
        <Checkbox
          checked={accepted}
          className="mt-0.5"
          data-testid="legal-accept-checkbox"
          disabled={pending}
          id="legal-accept"
          onCheckedChange={checked => setAccepted(checked === true)}
        />
        <Label className="leading-5" htmlFor="legal-accept">
          {t('accept')}
        </Label>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          data-testid="legal-accept-submit"
          disabled={!accepted}
          loading={pending}
          onClick={handleAccept}
          type="button"
          variant="brand"
        >
          {t('submit')}
        </Button>
        <Button disabled={pending} onClick={handleLogout} type="button" variant="ghost">
          {t('logout')}
        </Button>
      </div>
    </div>
  )
}
