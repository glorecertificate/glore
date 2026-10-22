import { ArrowsMotif } from '@/components/ui/arrows-motif'

const AuthLayout = ({ children }: LayoutProps<'/'>) => (
  <div className="relative isolate overflow-x-clip">
    <ArrowsMotif className="absolute -top-20 -left-48 -z-10 w-136 rotate-180 md:w-176" />
    <ArrowsMotif className="absolute -right-48 -bottom-24 -z-10 w-144 md:w-184" />
    {children}
  </div>
)

export default AuthLayout
