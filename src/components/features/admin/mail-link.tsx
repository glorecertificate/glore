export const MailLink = ({ email }: { email: string }) => (
  <a className="underline-offset-2 hover:underline focus-visible:focus-ring" href={`mailto:${email}`}>
    {email}
  </a>
)
