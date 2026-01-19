export const PageMain = ({ children, className, ...props }: React.ComponentProps<'main'>) => (
  <main className="mx-auto flex size-full min-h-[calc(100vh-72px)] max-w-380 flex-col px-8" {...props}>
    {children}
  </main>
)
