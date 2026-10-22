'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { joinOrganizationThroughLink, requestOrganizationAccess } from '@/actions/organizations/join-links'
import { useInvitationError } from '@/components/features/organization/use-invitation-error'
import { LucideIcon } from '@/components/icons/lucide'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { type OrganizationMembershipRole } from '@/db/queries/organization'
import { APP_ROOT, AUTH_ROOT, EMAIL_REGEX } from '@/lib/constants'

import { OrganizationBadge } from './organization-badge'

type Outcome = 'requested' | 'sent'

interface JoinLinkCardProps {
  email?: string
  organization: { avatarUrl: string | null; name: string }
  requiresApproval: boolean
  role: OrganizationMembershipRole
  signedIn: boolean
  token: string
}

export const JoinLinkCard = ({ email, organization, requiresApproval, role, signedIn, token }: JoinLinkCardProps) => {
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations('JoinLink')
  const tRoles = useTranslations('Organization')
  const errorMessage = useInvitationError()
  const [pending, setPending] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  const formSchema = z.object({
    email: z.string().nonempty(t('emailRequired')).regex(EMAIL_REGEX, t('emailInvalid')),
    firstName: z.string().trim().nonempty(t('firstNameRequired')),
    lastName: z.string().optional(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: { email: '', firstName: '', lastName: '' },
    resolver: zodResolver(formSchema),
  })

  const roleLabel = tRoles(`role_${role}`)

  const handleJoin = async () => {
    setPending(true)
    const { data, error } = await joinOrganizationThroughLink(token)
    setPending(false)
    if (error) {
      toast.error(errorMessage(error.code))
      return
    }
    if (data.kind === 'joined') {
      toast.success(t('joined', { organization: organization.name }))
      router.push(APP_ROOT)
      return
    }
    setOutcome('requested')
  }

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setPending(true)
    const { error } = await requestOrganizationAccess({ ...values, locale, token })
    setPending(false)
    if (error) {
      toast.error(errorMessage(error.code))
      return
    }
    setOutcome(requiresApproval ? 'requested' : 'sent')
  }

  if (outcome) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-success/10">
          <LucideIcon className="size-8 text-success" name={outcome === 'sent' ? 'mail-check' : 'circle-check'} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{t(`${outcome}Title`)}</h1>
          <p className="text-muted-foreground">{t(`${outcome}Description`, { organization: organization.name })}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={signedIn ? APP_ROOT : AUTH_ROOT}>{signedIn ? t('goToDashboard') : t('goToLogin')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <OrganizationBadge avatarUrl={organization.avatarUrl} name={organization.name} />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{t('title', { organization: organization.name })}</h1>
          <p className="text-muted-foreground">
            {requiresApproval ? t('descriptionApproval', { role: roleLabel }) : t('description', { role: roleLabel })}
          </p>
        </div>
      </div>

      {signedIn && (
        <div className="flex flex-col gap-3">
          {email && <p className="text-center text-sm text-muted-foreground">{t('signedInAs', { email })}</p>}
          <Button loading={pending} onClick={handleJoin} size="lg" variant="brand">
            {requiresApproval ? t('requestAccess') : t('join')}
          </Button>
        </div>
      )}

      {!signedIn && (
        <Form {...form}>
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <p className="text-sm text-muted-foreground">{t('guestDescription')}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('firstName')}</FormLabel>
                    <FormControl>
                      <Input autoComplete="given-name" disabled={pending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('lastName')}</FormLabel>
                    <FormControl>
                      <Input autoComplete="family-name" disabled={pending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('email')}</FormLabel>
                  <FormControl>
                    <Input autoComplete="email" disabled={pending} type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Banner>
              <LucideIcon className="mt-0.5 size-4 shrink-0" name="info" />
              <p>{requiresApproval ? t('guestNoteApproval') : t('guestNote')}</p>
            </Banner>
            <Button loading={pending} size="lg" type="submit" variant="brand">
              {requiresApproval ? t('requestAccess') : t('continue')}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t('haveAccount')}{' '}
              <Link className="text-brand-text hover:underline" href={AUTH_ROOT}>
                {t('signIn')}
              </Link>
            </p>
          </form>
        </Form>
      )}
    </div>
  )
}
