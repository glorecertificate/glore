import { forwardRef } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FieldProps extends React.ComponentProps<typeof Input> {
  id: string
  label?: React.ReactNode
  message?: React.ReactNode
}

const Field = forwardRef<HTMLInputElement, FieldProps>(({ className, color, id, label, message, ...rest }, ref) => (
  <div className="grid gap-2">
    {label && (
      <Label color={color} htmlFor={id}>
        {label}
      </Label>
    )}
    <Input color={color} id={id} ref={ref} {...rest} />
    {message && <p>{message}</p>}
  </div>
))

export { Field, type FieldProps }
