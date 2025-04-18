export const Video = ({ className, ...props }: React.ComponentProps<'video'>) => (
  <video className={`aspect-video w-full object-cover ${className}`} controls {...props} />
)
