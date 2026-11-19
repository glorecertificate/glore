'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { startTransition, useState } from 'react'

import { useTranslations } from 'next-intl'

import { logout } from '@/actions/auth'
import {
  acceptOrganizationInvitation,
  acceptOrganizationInvitationAsNewAccount,
  declineOrganizationInvitation,
  requestInvitationProof,
  signInToAcceptInvitation,
} from '@/actions/organizations/invitee'
import { useInvitationError } from '@/components/features/organization/use-invitation-error'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { toast } from '@/components/ui/toast'
import { type OrganizationMembershipRole, timestampMillis } from '@/db/queries/organization'
import { APP_ROOT, AUTH_ROOT } from '@/lib/constants'

import { OrganizationBadge } from './organization-badge'

type InvitationView = 'accept' | 'create_account' | 'mismatch' | 'sign_in'

type Pending = 'accept' | 'create' | 'decline' | 'proof' | 'sign_in' | 'sign_out'

interface InvitationCardProps {
  currentEmail?: string
  email: string
  expiresAt: string
  inviterName: string | null
  message: string | null
  organization: { avatarUrl: string | null; name: string }
  proof?: string
  role: OrganizationMembershipRole
  token: string
  view: InvitationView
}

export const InvitationCard = ({
  currentEmail,
  email,
  expiresAt,
  inviterName,
  message,
  organization,
  proof,
  role,
  token,
  view,
}: InvitationCardProps) => {
  const { locale } = useI18n()
  const router = useRouter()
  const t = useTranslations('Invite')
  const tRoles = useTranslations('Organization')
  const errorMessage = useInvitationError()
  const [pending, setPending] = useState<Pending | null>(null)
  const [password, setPassword] = useState('')
  const [declineOpen, setDeclineOpen] = useState(false)
  const [proofSent, setProofSent] = useState(false)

  const roleLabel = tRoles(`role_${role}`)
  const expires = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(timestampMillis(expiresAt)))
  const busy = pending !== null

  const refresh = () => startTransition(() => router.refresh())

  const handleAccept = async () => {
    setPending('accept')
    try {
      const { error } = await acceptOrganizationInvitation(token)
      if (error) {
        toast.error(errorMessage(error.code))
        setPending(null)
        return
      }
      toast.success(t('accepted', { organization: organization.name }))
      router.push(APP_ROOT)
    } catch {
      toast.error(errorMessage())
      setPending(null)
    }
  }

  const handleCreate = async () => {
    setPending('create')
    try {
      const result = await acceptOrganizationInvitationAsNewAccount({ proof, token })
      if (result?.error) toast.error(errorMessage(result.error.code))
    } catch {
      toast.error(errorMessage())
    } finally {
      setPending(null)
    }
  }

  const handleSendProof = async () => {
    setPending('proof')
    try {
      const { error } = await requestInvitationProof(token)
      if (error) {
        toast.error(errorMessage(error.code))
        return
      }
      setProofSent(true)
    } catch {
      toast.error(errorMessage())
    } finally {
      setPending(null)
    }
  }

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault()
    setPending('sign_in')
    try {
      const { error } = await signInToAcceptInvitation({ password, token })
      if (error) {
        toast.error(errorMessage(error.code))
        return
      }
      setPassword('')
      refresh()
    } catch {
      toast.error(errorMessage())
    } finally {
      setPending(null)
    }
  }

  const handleDecline = async () => {
    setPending('decline')
    try {
      const { error } = await declineOrganizationInvitation(token)
      if (error) {
        toast.error(errorMessage(error.code))
        return
      }
      setDeclineOpen(false)
      toast.success(t('declined'))
      refresh()
    } catch {
      toast.error(errorMessage())
    } finally {
      setPending(null)
    }
  }

  const handleSignOut = async () => {
    setPending('sign_out')
    try {
      await logout()
      refresh()
    } catch {
      toast.error(errorMessage())
    } finally {
      setPending(null)
    }
  }

  return (
    <AlertDialog onOpenChange={setDeclineOpen} open={declineOpen}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <OrganizationBadge avatarUrl={organization.avatarUrl} name={organization.name} />
          <div className="space-y-2">
            <h1 className="type-title text-balance">{t('title', { organization: organization.name })}</h1>
            <p className="text-pretty text-muted-foreground">
              {inviterName
                ? t('invitedBy', { inviter: inviterName, role: roleLabel })
                : t('invitedAnonymous', { role: roleLabel })}
            </p>
          </div>
        </div>

        {message && (
          <blockquote className="rounded-lg border bg-surface-muted p-4 text-sm wrap-break-word whitespace-pre-wrap">
            {message}
          </blockquote>
        )}

        {view === 'mismatch' && (
          <>
            <Banner role="alert" variant="warning">
              <LucideIcon className="mt-0.5 size-4 shrink-0" name="triangle-alert" />
              <div className="space-y-1">
                <p className="font-medium">{t('mismatchTitle')}</p>
                <p>{t('mismatchDescription', { current: currentEmail ?? '', email })}</p>
              </div>
            </Banner>
            <Button disabled={busy} loading={pending === 'sign_out'} onClick={handleSignOut} variant="brand">
              {t('signOut')}
            </Button>
          </>
        )}

        {view === 'accept' && (
          <div className="flex flex-col gap-2">
            <Button disabled={busy} loading={pending === 'accept'} onClick={handleAccept} variant="brand">
              {t('accept')}
            </Button>
            <AlertDialogTrigger asChild>
              <Button disabled={busy} type="button" variant="ghost">
                {t('decline')}
              </Button>
            </AlertDialogTrigger>
          </div>
        )}

        {view === 'sign_in' && (
          <form className="flex flex-col gap-4" onSubmit={handleSignIn}>
            <p className="text-sm text-muted-foreground">{t('signInDescription', { email })}</p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="invitation-password">{t('password')}</Label>
              <PasswordInput
                autoComplete="current-password"
                disabled={busy}
                id="invitation-password"
                onChange={event => setPassword(event.target.value)}
                required
                value={password}
              />
            </div>
            <Button disabled={busy || !password} loading={pending === 'sign_in'} type="submit" variant="brand">
              {t('signIn')}
            </Button>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <Link className="text-action-text underline-offset-4 hover:underline" href={AUTH_ROOT}>
                {t('forgotPassword')}
              </Link>
              <AlertDialogTrigger asChild>
                <Button disabled={busy} size="sm" type="button" variant="ghost">
                  {t('decline')}
                </Button>
              </AlertDialogTrigger>
            </div>
          </form>
        )}

        {view === 'create_account' && (
          <div className="flex flex-col gap-2">
            {proof ? (
              <>
                <p className="text-sm text-muted-foreground">{t('createDescription', { email })}</p>
                <Button disabled={busy} loading={pending === 'create'} onClick={handleCreate} variant="brand">
                  {t('createAccount')}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{t('proofDescription', { email })}</p>
                {proofSent && (
                  <Banner variant="success">
                    <LucideIcon className="mt-0.5 size-4 shrink-0" name="mail-check" />
                    <p>{t('proofSent', { email })}</p>
                  </Banner>
                )}
                <Button disabled={busy} loading={pending === 'proof'} onClick={handleSendProof} variant="brand">
                  {proofSent ? t('sendProofAgain') : t('sendProof')}
                </Button>
              </>
            )}
            <AlertDialogTrigger asChild>
              <Button disabled={busy} type="button" variant="ghost">
                {t('decline')}
              </Button>
            </AlertDialogTrigger>
          </div>
        )}

        <p className="text-center type-caption text-muted-foreground">{t('expires', { date: expires })}</p>
      </div>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('declineTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('declineDescription', { organization: organization.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending === 'decline'}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            loading={pending === 'decline'}
            loadingText={t('declining')}
            onClick={handleDecline}
            variant="destructive"
          >
            {t('decline')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
