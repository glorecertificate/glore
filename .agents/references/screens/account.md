# Account screens

- Auth pages (login, password reset, register, invitation, join, onboarding) use a split screen: a navy panel (`bg-band-from`) with the logo, plus the form column. `AuthFlow` shows the large globe on login and a 120 px globe below `lg`. `AuthSplit` (`features/auth/auth-split.tsx`) serves the other auth pages. Public verify, 404, offline, legal and legal acceptance keep `BrandShell`.
- Account settings use the kit `SectionNav` (query param `tab`) and `StickySaveBar` with no band tab strip. `SettingsSection` stacks a muted title above its fields.
- Docs index is a search-first hub: search, start tiles, a role tutorial row, topic columns and a contact card. `/help` redirects to `/docs`. An article has a back link, a 720 px reading column, a feedback row (the No answer opens an email to the team) and related questions for FAQ articles.
- Legal documents use document tabs and one versions table. Translations use the kit `FilterRail`. The sidebar `content` group holds translations, email previews and legal documents.
