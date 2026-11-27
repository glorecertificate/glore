# Authentication and sessions

Better Auth setup, cookies, the sign-up guard, hardening, and fresh session reads. Route gates and the proxy: `routes.md`. Render-path session caching: `reference.md`, "Session cache".

## Better Auth instance

- Better Auth stores users, sessions, and accounts in Neon through the Drizzle adapter.
- The `auth` instance lives in `src/lib/auth.ts`, server-only, and serves server components, server actions, and the proxy.
- Import tables there only from `@/db/schema/<table>`, never the schema barrel, because `proxy.ts` calls `auth.api.getSession` on every request.
- Catch-all route: `src/app/api/auth/[...all]/route.ts`.

## Cookies

- Better Auth keeps session tokens in signed HTTP-only cookies, cached for 5 minutes to cut API calls.
- All app cookies use the `gl` prefix, and Better Auth uses it through `advanced.cookiePrefix`.
- `logout` deletes each cookie in `USER_COOKIES` (`src/lib/cookies.ts`): the course list filters, the course languages, and the selected organization. The next account starts from defaults.

## Sign-up guard

- `emailAndPassword.autoSignIn` is `false` and MUST stay `false`.
- Every `signUpEmail` call creates an account for someone else (team invites), never for the actor.
- With auto sign-in on, the invitee's session cookie would be written onto the inviter's response.
- Self-registration does not use `signUpEmail`: it creates a `pending` join request, so `signInEmail` login is unaffected.

## Password rule

- A `hooks.before` middleware in `src/lib/auth.ts` checks `newPassword` against `PASSWORD_REGEX` on `/reset-password`, `/change-password`, and `/admin/set-user-password`, so the server enforces the rule and not only the length.

## Plugins

- `username()`: username and display username.
- `admin()`: admin role management, user creation, and impersonation. Its endpoints stay closed over HTTP.
- `impersonationGuard()`: local plugin in `lib/impersonation-guard.ts` (`admin.md`).
- `nextCookies()`: Next.js cookie integration.
- `team-invitations`: local plugin that exposes `acceptInvitation`.

## Hardening

- `disabledPaths` closes `/sign-up/email`, `/sign-in/email`, `/sign-in/username`, and `/update-user` over HTTP, so accounts only come from invites through `auth.api` and sign-in only goes through the `login` action, which applies the per-identifier limit (`isAuthRateLimited`).
- Rate limits share the `rate_limits` table: Better Auth through `rateLimit.storage: 'database'`, app keys through `src/lib/rate-limit.ts`.
- `rateLimit.customRules` keys are endpoint paths without the `/api/auth` base path (`/request-password-reset`, `/reset-password`, `/change-password`), because Better Auth strips the base path before matching.
- `src/lib/auth.test.ts` fails when a key stops matching a real endpoint.
- `emailAndPassword.revokeSessionsOnPasswordReset` is `true`, so a password reset ends every session.
- `changePassword` passes `revokeOtherSessions: false`, then calls `auth.api.revokeOtherSessions`: every other session ends, and the current one keeps its token. The library flag would rotate the current token inside the action, and the action's refresh render still reads the old token, so `getViewer` sends the browser into a redirect loop (`e2e/password-change.spec.ts`).
- Actions that send mail for a signed-in user have per-user limits through `isRateLimited`: `org-invite:<id>` (10 batches an hour), `email-change:<id>` (3 an hour), and `change-password:<id>` (10 an hour).
- They answer `RATE_LIMITED`, and `useActionError` shows `Common.rateLimited`.

### Role freshness and auth answers

- `requireEditor` (`src/actions/guards.ts`) and `authorizeEditorRequest` (`src/lib/api.ts`) read the session with `disableCookieCache`, so bans and demotions apply at once.
- `getCurrentUser` roles are cached under `userTag`, so every membership write calls `expireUserAccess` (`src/actions/organizations/helpers.ts`).
- A Better Auth `databaseHooks.user.update.after` hook in `src/lib/auth.ts` expires `userTag(id)` with `revalidateTag(tag, { expire: 0 })`, so changes the library makes itself (the email change link, `setRole`, `banUser`, `unbanUser`) reach `getCurrentUser` at once.
- `updateTag` would throw in the verify-email route handler.
- Login and password reset answer unknown users exactly like wrong passwords and real resets, in content and in work: `login` hashes the password for an unknown user, and the recovery mail is sent through `after()` so a real reset does not wait on SMTP.
- `updatePassword` and `changePassword` map library errors (including `PASSWORD_TOO_WEAK`) to `INVALID_TOKEN`, `INVALID_PASSWORD`, `INVALID_INPUT`, or `AUTH_ERROR` with fixed messages, never the library text.
- A reset through the emailed link sends the `account/password-changed` mail from `onPasswordReset`, after the response, like `changePassword` does.
- Email changes go through `auth.api.changeEmail`, which mails a verification link to the new address through `emailVerification.sendVerificationEmail`.

## Stale sessions

- When the cookie cache outlives the user row, `getCurrentUser` redirects to `/api/v1/session`.
- That route re-reads the session without the cache and clears auth cookies only when the session is invalid, so a forged link cannot sign out a live user.
- `deleteAccount` signs out and expires `userTag` itself.

## Fresh session reads

- Actions, guards, and API routes use `getAuthUser()`, which skips the cookie cache (`disableCookieCache`), so a ban or a revoked session blocks writes at once.
- `getAuthUser()` also passes `disableRefresh`, so a read never rewrites the session cookie. A cookie write in an action makes Next.js re-render the page and drop prefetched routes.
- The proxy still extends the session on each request.
- `checkRateLimit`, `getAuthUser()`, `requireAdmin`, `requireEditor`, and the impersonation state await `connection()` before any fresh `auth.api.getSession`.
- On Neon over HTTP, a database read in a prerender rejects with `HANGING_PROMISE_REJECTION`, which Better Auth logs as `INTERNAL_SERVER_ERROR`.
- Without it, a clock read after `headers()` logs "unstable value `Date.now()` while prerendering" under partial prefetching.
