import { Link } from '@/components/ui/link'
import { Route } from '@/lib/routes'

export default () => (
  <main lang="en">
    <h1>{'Welcomeeee!'}</h1>
    <Link href={Route.Signup}>{'Sign up'}</Link>
  </main>
)
