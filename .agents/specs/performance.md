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

| Kind        | Metric      | Measures                                                              | Desktop | Mobile  |
| ----------- | ----------- | --------------------------------------------------------------------- | ------- | ------- |
| Load        | TTFB        | `responseStart` of the navigation entry                               | 100 ms  | 300 ms  |
| Load        | FCP         | `first-contentful-paint`                                              | 500 ms  | 1200 ms |
| Load        | LCP         | Last `largest-contentful-paint` entry                                 | 800 ms  | 1800 ms |
| Load        | CLS         | Sum of `layout-shift` values without recent input                     | 0.01    | 0.01    |
| Load        | TBT         | Sum of `long-animation-frame` `blockingDuration` after FCP            | 50 ms   | 200 ms  |
| Load        | Hydration   | First `button` or `input` with React props attached                   | 800 ms  | 1800 ms |
| Load        | JS KB       | Transfer size of scripts that start before the first prefetch         | budget  | budget  |
| Load        | Prefetch KB | Transfer size of `_rsc` prefetch requests and scripts after the first | budget  | budget  |
| Navigation  | Shell       | Pointer down to the first frame after `history.pushState`             | 100 ms  | 200 ms  |
| Navigation  | Complete    | Pointer down to the last DOM change before 1 s of quiet               | 300 ms  | 800 ms  |
| Navigation  | Shift       | Sum of all `layout-shift` values after the input                      | 0.01    | 0.01    |
| Interaction | Latency     | Longest Event Timing duration per `interactionId` (INP model)         | 50 ms   | 100 ms  |
| Interaction | Blocking    | Sum of `long-animation-frame` `blockingDuration` after the input      | 0 ms    | 50 ms   |

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
- The job fails on a regression.
- It reports target misses in the step summary. `qa:perf --strict` also fails on a miss.
- `Perf` is not a required check.

## Limits

- CI Chromium runs without WebGL, because SwiftShader draws the cobe globe on the CPU and starves the runner. Measure globe changes locally.
- From Chromium 158 (Playwright 1.65), the emulated RTT lands before the first byte, so mobile TTFB includes it.
- A Playwright update can move the mobile timings. The first `main` run after the update sets the new baseline.
- Local and CI numbers differ, for example in client navigations. Compare local runs only with local runs, and CI runs only with CI runs.

## Rules for UI work

- Prefetch policy: the sidebar items and the logo-free header prefetch, and so do the content links that lead to a detail page. Measured on a production build at 1440 px (dashboard landing, all roles): 16 to 20 prefetch requests, 313 to 1069 KB decoded and 119 to 300 KB transferred. Admin on `/admin` is the largest case at 36 requests and 347 KB transferred. The `Prefetch KB` budget is 400 KB for app pages. Limiting prefetch to the current section would leave every other sidebar item cold, so it is not the policy.
- A warm sidebar click must commit no fallback. Measure with a production build: `LoadingFallback` appears only after 300 ms, so a fallback in the DOM is a data wait to fix, not a style choice.

- Measure the affected cases before and after each change with `PERF_RUNS=5`, and put both tables in the pull request.
- A block is done when its cases meet the targets on both profiles. If not, the pull request names the blocker.
- Never trade a metric for another without a reason in the pull request.
- Prefer a static shell, streamed data behind `Suspense`, and `useOptimistic` for mutations.
- Keep `InstantReveal` in `AppLayoutContent` of the root layout. Without it, a boundary that streams after the first frame waits for the React reveal throttle. In CI that adds about 300 ms to FCP and LCP.
- Never add `InstantReveal` to `AppLayoutFallback`. The client renders that fallback during navigations, and React warns about a script that the client renders. The copy in `AppLayoutContent` runs before each reveal, so the fallback does not need one.
- When a React update fails `instant-reveal.test.ts`, read the new reveal runtime in `react-dom-server` and update the script or remove it.
- A loading state follows "Loading states" in `ui.md`. Its navigation cases keep `Shift` at 0.
