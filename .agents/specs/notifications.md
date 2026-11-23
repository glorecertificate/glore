# Events, notifications, and email

Activity events, the `notify` pipeline, in-app notifications, mail, and the email templates. Message catalogs: `patterns.md`, "Internationalization".

## Events and notify

- Every state transition writes one `activity_events` row with `recordEvent(tx, event)` (`src/db/mutations/activity-event.ts`) inside its transaction.
- After the commit, the action calls `notify(event)` (`src/actions/notifications/notify.ts`), which never throws.
- Event types and payloads live in `src/db/queries/activity-event.ts`.
- `src/actions/notifications/catalog.ts` holds recipients, mail category, template factory (may be async, receives the absolute deep link), and deep link per type.
- `notify` writes in-app `notifications` rows, skips the actor unless the type sets `notifyActor`, and mails only when the type has a template.
- Optional categories (`learning`, `organization`, `reminders`) honor `users.notification_preferences`. `mandatory` mail always goes.
- Settings show `organization` only to org admins and representatives, and `learning` only when `canHoldCertificates` is true (`notificationCategoriesFor`).
- The bell, popover, and `/notifications` render each row from `type` and `data` with `Notifications.events.<type with dots as underscores>` copy in all catalogs.
- A new in-app event needs that copy (Vitest enforces it). A per-recipient `variant` on the event definition is stored in the notification data.
- Every event type an organization can record needs activity copy in all catalogs (`activity_*` messages), enforced by a Vitest test.

## Mail

- `sendMail` (`src/lib/email.ts`) takes `template`, `category`, and `unsubscribeUrl`.
- `SMTP_SENDER` is the sender. `sendMail` sets `Reply-To` to the contact email of the app settings (`loadSettings`), so replies reach the team inbox.
- Every template forwards the `category` and `settings` base props (`EmailBaseProps`) to `EmailLayout`, which prints the reason and the preference link.
- `EmailLayout` is the shell, `EMAIL_CLASSES` (`src/emails/classes.ts`) holds every class string, and `Notice` is the shared body.
- The header is the page band gradient (`EMAIL_COLORS.band*`, solid `bandFrom` fallback) with the white `public/email/logo.png` centered.
- Mail renders in the RSC layer, which has no `createContext`, so templates never use React context.
- Optional mail carries `List-Unsubscribe` headers. The POST at `/api/v1/mail-preferences` turns that category off for the user named in a signed token (`src/lib/unsubscribe.ts`).
- A GET on that route opens `/settings?tab=notifications`.
- `renderEmail({ template, locale, category })` returns `{ html, subject, text }` and `sendMail` calls it.
- The `/emails` preview (`loadEmailPreview`, `previewTemplate(name)` with `PreviewProps`) cannot drift from what is sent.
- Copy states real expiries: recovery and verify links last 1 hour (`AUTH_LINK_EXPIRY_SECONDS` in `src/lib/constants.ts`, set on both Better Auth options).
- Invitations and team invites use `invitationExpiryDays`.

## Templates

- Templates live in `src/emails/<group>/<name>.tsx` (React Email) and register in `TEMPLATES` in `src/lib/email.ts`.
- Style them with `EMAIL_CLASSES` from `src/emails/classes.ts` (light and `dark:` token classes), never a hex value.
- `account/{email-changed,password-changed,status,welcome}`.
- `auth/{invite (invitation email proof),recovery,verify-email}`.
- `certificate/{assigned,decision,reminder,review}`.
- `learning/eligible`.
- `organization/{application-decision,invitation (invite and reminder),join-request,join-request-received,membership,registration-request}`.
- `team/{invite,role-changed}`.
- Each has `PreviewProps` for `pnpm run email` and `Email.<name>` copy in all catalogs.
