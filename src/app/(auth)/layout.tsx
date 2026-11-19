import { AuthFrame } from '@/components/features/auth/auth-frame'

const AuthLayout = ({ children }: LayoutProps<'/'>) => (
  <div className="relative isolate overflow-x-clip">
    <AuthFrame>{children}</AuthFrame>
  </div>
)

export default AuthLayout
