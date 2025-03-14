import { Link } from '@/components/ui/link'

export default () => (
  <div>
    <div>
      <small>
        <strong>{' Note:'}</strong> {'Emails are rate limited. Enable Custom SMTP to'}
        {'increase the rate limit.'}
      </small>
      <div>
        <Link href="https://supabase.com/docs/guides/auth/auth-smtp" target="_blank">
          {'Learn more '}
        </Link>
      </div>
    </div>
  </div>
)
