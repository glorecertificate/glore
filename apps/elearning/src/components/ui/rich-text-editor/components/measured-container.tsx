import { useMemo, useRef } from 'react'

import { useContainerSize } from '@/hooks/use-container-size'

export type MeasuredContainerProps<T extends React.ElementType> = React.HTMLAttributes<T> & {
  as: React.ComponentPropsWithRef<T>
  name: string
  ref?: React.Ref<HTMLElement>
}

export const MeasuredContainer = <T extends React.ElementType>({
  as: Component,
  children,
  name,
  ref,
  style = {},
  ...props
}: MeasuredContainerProps<T>) => {
  const innerRef = useRef<HTMLElement>(null)
  const rect = useContainerSize(innerRef.current)

  const customStyle = useMemo(
    () => ({
      [`--${name}-width`]: `${rect.width}px`,
      [`--${name}-height`]: `${rect.height}px`,
    }),
    [name, rect.width, rect.height],
  )

  return (
    <Component {...props} ref={innerRef} style={{ ...customStyle, ...style }} {...props}>
      {children}
    </Component>
  )
}
