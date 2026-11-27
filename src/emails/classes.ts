export const EMAIL_CLASSES = {
  canvas: 'bg-canvas px-4 py-8 dark:bg-canvas-dark',
  card: 'overflow-hidden rounded-2xl border border-solid border-border-subtle bg-surface-0 dark:border-border-subtle-dark dark:bg-surface-0-dark',
  content: 'px-6 py-8 sm:p-10',
  page: 'm-0 bg-canvas p-0 font-sans dark:bg-canvas-dark',
  reason: 'm-0 mb-3 text-[12px] leading-5 text-fg-2 dark:text-fg-2-dark',
  reasonLink: 'text-fg-2 underline dark:text-fg-2-dark',
  body: 'text-[15px] leading-6 text-fg-1 dark:text-fg-1-dark',
  button:
    'rounded-lg bg-brand px-6 py-3 text-[15px] font-semibold text-on-fill no-underline dark:bg-brand-dark dark:text-on-fill-dark',
  buttonDanger:
    'rounded-lg bg-danger px-6 py-3 text-[15px] font-semibold text-on-danger no-underline dark:bg-danger-dark dark:text-on-danger-dark',
  chip: 'my-4 rounded-lg bg-sunken px-4 py-3 text-center font-mono text-[16px] font-semibold text-fg-1 dark:bg-sunken-dark dark:text-fg-1-dark',
  detail: 'text-[14px] leading-6 text-fg-2 dark:text-fg-2-dark',
  divider: 'mx-0 my-6 border-border-subtle dark:border-border-subtle-dark',
  fine: 'text-[12px] leading-5 text-fg-3 dark:text-fg-3-dark',
  fineLink: 'text-fg-3 underline dark:text-fg-3-dark',
  socialChip: 'mx-1 inline-block rounded-full bg-surface-0 p-2 align-middle dark:bg-sunken-dark',
  link: 'text-link underline dark:text-link-dark',
  manualLink: 'text-[12px] break-all text-link dark:text-link-dark',
  quote: 'my-4 border-0 border-l-[3px] border-solid border-fg-3 pl-3 dark:border-fg-3-dark',
  quoteText: 'm-0 text-[15px] leading-6 whitespace-pre-line text-fg-1 dark:text-fg-1-dark',
} as const
