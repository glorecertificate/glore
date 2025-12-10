import { Img, type ImgProps } from '@react-email/components'

import { assetUrl } from '@/lib/assets'

export const EmailLogo = ({ src, width = 60, ...props }: ImgProps) => (
  <Img src={src ?? assetUrl('email/logo.png')} width={width} {...props} />
)
