# Performance

Targets, measurement, and gates for load, navigation, and interaction speed. The goal is a UI that feels instant on a mid-range phone on a slow 4G network.

## Profiles

| Profile   | CPU           | Network                                          | Viewport |
| --------- | ------------- | ------------------------------------------------ | -------- |
| `desktop` | No throttling | No throttling                                    | 1440x900 |
| `mobile`  | 4x slowdown   | 150 ms RTT, 1.6 Mbps down, 750 Kbps up (slow 4G) | 390x844  |

The mobile values match the Lighthouse mobile defaults. CDP applies the latency to each request.

## Metrics and targets

The source of truth for the numbers is `config/performance.json`. Each value is the median of `PERF_RUNS` runs (default 3).

| Kind        | Metric      | Measures                                                          | Desktop | Mobile  |
| ----------- | ----------- | ----------------------------------------------------------------- | ------- | ------- |
| Load        | TTFB        | `responseStart` of the navigation entry                           | 100 ms  | 300 ms  |
| Load        | FCP         | `first-contentful-paint`                                          | 500 ms  | 1200 ms |
| Load        | LCP         | Last `largest-contentful-paint` entry                             | 800 ms  | 1800 ms |
| Load        | CLS         | Sum of `layout-shift` values without recent input                 | 0.01    | 0.01    |
| Load        | TBT         | Sum of `long-animation-frame` `blockingDuration` since navigation | 50 ms   | 200 ms  |
| Load        | Hydration   | First `button` or `input` with React props attached               | 800 ms  | 1800 ms |
| Load        | JS KB       | Transfer size of scripts that start before hydration ends         | budget  | budget  |
| Load        | Prefetch KB | Transfer size of `_rsc` prefetch requests until the page is quiet | budget  | budget  |
| Navigation  | Shell       | Pointer down to the first frame where the clicked item is active  | 100 ms  | 200 ms  |
| Navigation  | Complete    | Pointer down to the last DOM change before 1 s of quiet           | 300 ms  | 800 ms  |
| Navigation  | Shift       | Sum of all `layout-shift` values after the input                  | 0.01    | 0.01    |
| Interaction | Latency     | Longest Event Timing duration per `interactionId` (INP model)     | 50 ms   | 100 ms  |
| Interaction | Blocking    | Sum of `long-animation-frame` `blockingDuration` after the input  | 0 ms    | 50 ms   |

- The script budget is 150 KB for public pages (`publicPaths`) and 300 KB for app pages.
- Hydration must finish by the LCP target, so a page is usable when its main content paints.
- An interaction latency of 16 ms means no Event Timing entry crossed the 16 ms threshold.
- `Shift` also counts the shifts that CLS drops as recent input. A loading state that does not match its content shows there.
- The `field` key holds the p75 targets for Vercel Speed Insights on production traffic.
- With `partialPrefetching`, each dynamic RSC response embeds a runtime-prefetch render of the same route. Every prop a layout can resolve from cookies travels twice, so a layout passes summaries to client contexts, never full records. Measure with a request that sends the `RSC: 1` header.

The targets come from the Core Web Vitals "good" thresholds and the RAIL response budget, tightened to the instant bar.

## Cases

- `e2e/perf/load.perf.ts`: one cold context per run for a public page and the main page of each role.
- `e2e/perf/navigation.perf.ts`: a sidebar link click from a settled page to another main page.
- `e2e/perf/interactions.perf.ts`: the command palette, the notification popover, a settings tab, and the sidebar toggle.
- `e2e/perf/vitals.ts`: the profiles, the in-page observers, and the readers. Each case writes one JSON file to `.playwright/perf/results/`.

Add a case to the file of its kind for each new journey, page, or primary interaction.

## Run locally

Only a production server gives comparable numbers. The report checks no target or baseline when it detects the dev overlay.

1. Run `APP_URL=http://localhost:3100 pnpm run build`. Next 16 builds into `.next` and the dev server keeps `.next/dev`, so both can run at the same time.
2. Run `APP_URL=http://localhost:3100 pnpm exec next start --port 3100`.
3. Run `E2E_BASE_URL=http://localhost:3100 pnpm run test:perf`. Add `-g <case>` for one case and `PERF_RUNS=5` for a stable median.
4. Run `pnpm run qa:perf` for the report, or `pnpm run qa:perf --baseline <dir>` to compare with an earlier results folder.
5. To compare two builds, start the second one on another port and add `PERF_BASE_URL=<url>` to step 3. The base results go to `.playwright/perf/baseline/`.
6. Give the second build its own database and add `PERF_BASE_DATABASE_URL=<url>` to step 3. Without it, both servers share `DATABASE_URL`.

The report goes to `.playwright/perf/report.md`. A ✓ meets the target, a ✗ misses it, and a ▲ is a regression against the baseline.

## CI

- The `Perf` job in `.github/workflows/perf.yml` runs on each pull request and each push to `main`. It skips the merge queue.
- Four `Measure` jobs run in parallel. Each one builds and starts the app like `E2E / E2E` and runs `test:perf --shard=<n>/4`. The perf project sets `fullyParallel: true`, so Playwright splits the cases by test, and each case runs in exactly one shard. Each shard keeps `workers: 1` and uploads its results as `perf-shard-<n>` for 1 day.
- The last job is named `Perf`. It downloads the four shard artifacts into one folder, runs `qa:perf` once, and uploads `perf-results` for 30 days. Each case writes its own file, so the merge needs no change to `scripts/perf.mts`, and the report is the same as for one runner.
- The `Perf` job fails when a `Measure` job fails or is skipped, and when `qa:perf` fails.
- On a pull request each shard also builds the base commit and starts it on port 3001 on the same runner, so the base and the head of a case always run on one runner. Each server has its own database and its own logins. The head uses `glore` and the base uses `glore_base`, which the job migrates, imports, and seeds with the base code.
- The separate database lets the base run after a destructive migration. The setup project logs each role in on each server and saves one storage state per target, because sessions live in the database.
- Each load and navigation case alternates between the base and the head on each run. Each interaction case runs one block on each server.
- A baseline from another runner is not valid. On two runs of one commit, the CPU-bound metrics moved by 10% to 50%.
- If the base server fails, the report lists the case without a baseline.
- A base seed can differ from the head seed, so a seed change can move a metric.
- On a push to `main` it measures the head only, as a record.
- It runs each case 5 times on each server. A metric regresses when its median grows by more than 10% and by more than the noise floor: 20 ms, 2 KB, or 0.005 CLS.
- The fastest run must also be slower than the baseline median plus the noise floor. This rule ignores a bimodal metric that lands in its slow mode by chance.
- On four A/A comparisons of about 420 cells, on one machine and on one CI runner, this rule flagged no regression.
- Each shard then re-measures its flagged cases with `PERF_PASS=confirm PERF_RUNS=10` into `.playwright/perf/confirm/`. A ▲ stands only when the same case and metric flag again in that pass. A case the pass did not measure keeps its ▲. `qa:perf --flagged` prints the grep of the flagged cases, and `qa:perf --confirm <dir>` applies the pass.
- TBT starts at navigation, not at FCP, so a faster FCP moves no hydration work into the window. JS KB counts only scripts that start before hydration ends, so route prefetches after hydration stay in the Prefetch KB column.
- The job fails on a regression.
- It reports target misses in the step summary. `qa:perf --strict` also fails on a miss.
- `Perf` is not a required check.

## Limits

- CI Chromium runs without WebGL, because SwiftShader draws the cobe globe on the CPU and starves the runner. Measure globe changes locally.
- From Chromium 158 (Playwright 1.65), the emulated RTT lands before the first byte, so mobile TTFB includes it.
- A Playwright update can move the mobile timings. The first `main` run after the update sets the new baseline.
- Local and CI numbers differ, for example in client navigations. Compare local runs only with local runs, and CI runs only with CI runs.

## Rules for UI work

- Prefetch policy: sidebar items prefetch in full. The course card title link prefetches in full, because the course open must show no fallback. Other content links use the default prefetch. The `Prefetch KB` budget is 400 KB for app pages.
- Chunk preload (`EditorPreload`, editors and managers): a device with a fine pointer, no `saveData`, and `effectiveType` `4g` loads the chart renderer and both editors 2 s after mount. A constrained device (coarse pointer, `saveData`, or `effectiveType` other than `4g`) loads nothing in that window. It loads the editors on `pointerdown`, `touchstart`, or `focusin` on a link to `/courses/<slug>`, and the chart on a link to `/admin`, `/dashboard`, or `/organization`. A chart that the current page renders loads when the page renders it.
- Prefetch hold: a press on a sidebar item, and each path change, set the sidebar links to the default prefetch for 4 s. After that they return to the full prefetch. A full re-prefetch of every item after a navigation (about 250 KB for an admin) otherwise competes with the navigation's own chunks. On the mobile profile it added about 600 ms to `/admin` to `/admin/users`.
- Prefetch limit: at 1.6 Mbit/s the full prefetch of the course cards in view takes about 5 s, so a click in the first seconds can still show a fallback (measured 1.0 s with no hover and 0.3 s after a 300 ms hover, 1 s into the prefetch). A hover or a focus already raises that link to intent priority in the Next router. After the queue ends, the open shows no fallback. This is a network limit, not an eviction.
- Shell decision (owner, 2026-11-18): a full prefetch makes the click wait one round trip for the dynamic part. So Shell ends at the first frame where the clicked sidebar item shows active (`data-active` or `aria-current`). The sidebar item turns active on `pointerdown`, before the round trip. Base and head use the same script. Complete is unchanged: pointer down to the last DOM change before 1 s of quiet.
- A warm sidebar click must commit no fallback. Measure with a production build: `LoadingFallback` appears only after 300 ms (100 ms for a route fallback), so a fallback in the DOM is a data wait to fix, not a style choice.

- A provider above the shell never sets state after mount, from an effect, `requestAnimationFrame`, or a timer. Each `useSidebar` consumer re-renders on the change, and on the mobile profile that was one 150 ms task right after hydration (TBT 4x on `/courses`). Flip a DOM attribute from a callback ref instead (`settle` in `ui/sidebar.tsx`).
- A sidebar link press closes the phone drawer, which costs about 20 ms of Shell and 40 ms of Complete at 4x CPU. The owner accepted this cost on 2026-11-19, so the mobile navigation cases flag it. Issue #207 tracks a close with no cost.
- The invitation poll of the menu indicator starts on mount. A deferred start lands a state change inside a later navigation and the router queues the click behind the server action.
- `settle` in `e2e/perf/vitals.ts` also waits for requests still in flight. A resource entry exists only after the download ends, so a streaming prefetch looked quiet and the click raced it.

- Measure the affected cases before and after each change with `PERF_RUNS=5`, and put both tables in the pull request.
- A block is done when its cases meet the targets on both profiles. If not, the pull request names the blocker.
- Never trade a metric for another without a reason in the pull request.
- Prefer a static shell, streamed data behind `Suspense`, and `useOptimistic` for mutations.
- Keep `InstantReveal` in `AppLayoutContent` of the root layout. Without it, a boundary that streams after the first frame waits for the React reveal throttle. In CI that adds about 300 ms to FCP and LCP.
- Never add `InstantReveal` to `AppLayoutFallback`. The client renders that fallback during navigations, and React warns about a script that the client renders. The copy in `AppLayoutContent` runs before each reveal, so the fallback does not need one.
- When a React update fails `instant-reveal.test.ts`, read the new reveal runtime in `react-dom-server` and update the script or remove it.
- A loading state follows "Loading states" in `ui.md`. Its navigation cases keep `Shift` at 0.

## Navigation freshness

- A prefetched route goes stale 30 s after its fetch (`staleTimes.dynamic` and the 30 s `stale` of `getSessionUser`). `Link` never refetches on a timer, so a click after 30 s on a page fetched the route dynamically behind the route fallback.
- `PrefetchKeeper` (`components/layout/prefetch-keeper.tsx`, mounted in the dashboard layout) calls `router.prefetch(href, { kind: 'full' })` for the registered links every 2 s. Fresh entries cost no request, so a route refetches within 2 s after it goes stale.
- Eager refresh runs only on a device with a fine pointer, a viewport of 1024 px or more, and no `saveData`, and only after the `load` event and an idle callback (3 s at most). Any other device refreshes only the hrefs that an intent prefetch (hover, focus, touch start) already fetched, never a new one. A `nav` link that is hidden or not rendered, such as one in a closed drawer, never counts. Without this rule, a phone fetched about 350 KB of routes that its closed drawer hid (measured 36 `_rsc` requests in 6 s on the mobile profile for an admin, against 2 before the keeper).
- It pauses while the tab is hidden, for 4 s after a press on a link (the navigation holds the network), and after 5 minutes without input. The first input after that refreshes at once.
- `keepFresh` on the kit `Link` registers a href. A sidebar link registers as `nav`. `keepFresh="list"` registers a list or detail link, and only the 6 on screen nearest the top refresh.
- The kit `Link` also upgrades to a full prefetch on hover (60 ms), focus, and touch start.
- Cost: each registered link refetches once per 30 s while the user is active, about 13 requests per 30 s for an admin. Keep the registered set small.
- A detail page whose `generateMetadata` reads the request (`connection()`, cookies, uncached session) cannot prefetch its head. Read `getSessionUser()` there, as `getAdminOrganizationName` does.
- A `dynamic()` tab chunk loads on first visit and shows a fallback. Preload it from the list (`preloadAdminOrganizationDetail`), and on mount of the detail and `/organization` pages once on idle, so a tab switch never waits for a chunk. The `/organization` page loads its tabs one per idle slot, because loading them together evaluates every chunk in one long frame and adds to mobile TBT.
- Route fallbacks use `DashboardLoading`: the header shows in the first frame, and the content area stays empty. `NavigationProgress` (dashboard layout) shows a 3px brand bar at the top after 150 ms. The owner chose the bar over the spinner on 2026-11-28: a wait under 150 ms reads as instant.
- The bar runs while a `RouteLoading` fallback is mounted, or from a link click to another path until the URL commits. It starts at 25%, trickles toward 90%, completes at 100%, and fades out. It stays at least 300 ms. A back navigation to a page in memory shows no bar.
