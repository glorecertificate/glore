import { ArrowsMotif } from '@/components/ui/arrows-motif'

const AuthLayout = ({ children }: LayoutProps<'/'>) => (
  <div className="relative isolate overflow-x-clip">
    <ArrowsMotif className="absolute -right-32 -bottom-24 -z-10 hidden w-160 max-w-none lg:block" />
    {children}
  </div>
)

export default AuthLayout
