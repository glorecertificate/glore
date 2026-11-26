import { AuthFrame } from '@/components/features/auth/auth-frame'
import { MessagesScope } from '@/components/providers/messages-scope'

const AuthLayout = ({ children }: LayoutProps<'/'>) => (
  <div className="relative isolate overflow-x-clip">
    <MessagesScope scope="auth">
      <AuthFrame>{children}</AuthFrame>
    </MessagesScope>
  </div>
)

export default AuthLayout
