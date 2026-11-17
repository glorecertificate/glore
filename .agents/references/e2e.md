# End-to-end tests

Playwright projects, auth state, fixtures, personas, pinned browsers, and visual baselines. `workflow.md` keeps the commands.

## Suite

- `pnpm run test:e2e` runs Playwright (`e2e/`) against the dev server at `E2E_BASE_URL` (default `https://glore.localhost`).
- The `legal` project runs last. Target it with `--project=setup --project=legal --no-deps`.
- The `setup` project logs in every `AUTH_ROLES` seed user and stores their state in `.playwright/.auth/`. Specs pick one with `test.use({ storageState: authFile(role) })`.
- Better Auth limits sign-ins, so add a role to `AUTH_ROLES` instead of logging in inside specs. Setup clears local `rate_limits` first.
- `*.perf.ts` files run only with `playwright.perf.config.ts` (`pnpm run test:perf`). `performance.md` has the targets and the procedure.
- `e2e/mail.ts` reads Mailpit (`MAILPIT_URL`). `recovery.spec.ts` resets the `recovery` seed user's password through the emailed link, and `db:seed` restores it.
- Run Playwright with `--workers=2`: 4 workers make the dev server answer 502.
- Import `test` from `e2e/fixtures.ts`. Its `makeAxeBuilder` applies `AXE_TAGS` (`scripts/axe.ts`), which `qa:atlas` shares.
- The setup project also logs in the `db:seed:demo` personas of `e2e/personas.ts`. Persona specs skip when the seed did not run.
- CI seeds the personas on `TEST_EMAIL=demo@demo.glore.test`. Its domain keeps each persona address from containing a fixture address such as `admin@glore.test`.
- Specs read a download with `readDownload` from `e2e/helpers.ts`, which also works in a remote browser.
- Chromium paints no element area below the viewport, so `visual-desktop` uses a 1600 px tall viewport. The catalog test fails when a section is taller.

## Pinned browsers and visual baselines

- `PLAYWRIGHT_IMAGE` in `scripts/playwright-image.ts` pins the Playwright image by digest. A unit test fails when it does not match the installed Playwright.
- `test:browsers` runs `playwright run-server` in that image. With `PLAYWRIGHT_PINNED_ENDPOINT` set, as in CI, the run adds four projects that connect to it.
- The pinned projects are the `firefox` and `mobile-webkit` smoke projects, and the `visual-desktop` and `visual-mobile` (WebKit at 390) projects.
- The `setup`, `chromium`, and `legal` projects use the installed Chromium. Through the remote browser, each action took 1 to 4 s and the tenant hooks timed out.
- Never name it `PW_TEST_CONNECT_WS_ENDPOINT`: Playwright reads that variable itself and connects every project.
- `*.visual.ts` specs use `visualTest`, which fixes the browser clock. Screenshots use reduced motion, no animations, no caret, and `e2e/visual.css`.
- Baselines in `e2e/__screenshots__/` come only from CI, and `updateSnapshots` is `none`. A failed E2E job writes the changed ones to the `visual-baselines` artifact.
- Run `pnpm run test:baselines`, review each image diff, then commit. Local pinned runs compare only, since arm64 can differ.
