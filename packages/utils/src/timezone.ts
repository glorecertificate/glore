export type TimezoneOptions = [Intl.LocalesArgument, Intl.DateTimeFormatOptions]

/**
 * Returns the timezone of the user's browser.
 */
export const timezone = (locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions) =>
  Intl.DateTimeFormat(locales, options).resolvedOptions().timeZone
