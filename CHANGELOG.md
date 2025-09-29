# Changelog

## [0.5.0](https://github.com/gabrielecanepa/glore/compare/v0.4.14...v0.5.0) (2025-09-29)

### ⚠ BREAKING CHANGES

- env variable names and cookie keys have been updates, update the local `.env` file accordingly.

### Features ✨

- Add course info component and improve course UI ([9a31c69](https://github.com/gabrielecanepa/glore/commit/9a31c691389ab9025f1a97ebdd700d72cd1d1125))
- Enhance course management with improved UI ([859a2be](https://github.com/gabrielecanepa/glore/commit/859a2be7add96400072c58d043e27c5e62d9da38))
- Unify i18n and courses with new schema ([0875d62](https://github.com/gabrielecanepa/glore/commit/0875d62c6fed02dd59059a5f56a0aa7d9ef3e1b9))

### Fixes 🔧

- Update login validation to render inline errors ([5c745cd](https://github.com/gabrielecanepa/glore/commit/5c745cddc06994db71524228f4d51ae468ebb21a))

### CI 🤖

- **eslint-config:** Optimize ESLint typed rules and simplify restricted imports ([58d87d3](https://github.com/gabrielecanepa/glore/commit/58d87d317c2273c7165c4cc7aa7a5cfede8784ed))
- Optimize database deployment with conditional checks ([0b33e53](https://github.com/gabrielecanepa/glore/commit/0b33e53f52a068f53d9a795f3ac904f3f17fe7ad))
- Replace watch script with dev command ([35de654](https://github.com/gabrielecanepa/glore/commit/35de6543c3d3f1f096d712c4901de387e8961351))

### Other

- Fix deploy workflow ([ff3a0c4](https://github.com/gabrielecanepa/glore/commit/ff3a0c486c7e4bfac757a80a9151eb6b953d07ef))
- Manage per-course language preference with cookies ([1e9f4ab](https://github.com/gabrielecanepa/glore/commit/1e9f4aba9b8489c89da97818567841ee113e7be7))
- Refactor auth, env config and use shared UI ([47b4981](https://github.com/gabrielecanepa/glore/commit/47b4981a3a77f02b17c8dd80275e95de7c639146))
- Replace skills with courses in data model ([ec6a8e1](https://github.com/gabrielecanepa/glore/commit/ec6a8e1248b637d2d3f0adf368b70a6c217a1a8b))

## [0.4.14](https://github.com/gabrielecanepa/glore/compare/v0.4.13...v0.4.14) (2025-08-16)

### Build 📦

- **deps:** Bump dependencies to latest patch ([5c597fc](https://github.com/gabrielecanepa/glore/commit/5c597fcc744b82ecda419611bb5de988190ca723))

### Other

- Add health check API endpoint ([a8d038c](https://github.com/gabrielecanepa/glore/commit/a8d038c0d25d9be9ab05c907080c439b3b60a78c))
- Enhance course management with improved UI and new utilities ([b167890](https://github.com/gabrielecanepa/glore/commit/b1678902c208019bec31166cb4624422c5022fbf))
- Reorganize API modules ([c5949a2](https://github.com/gabrielecanepa/glore/commit/c5949a2ef3abd222a5a9817c13a2f111561e32c4))
- Replace `#rte` path alias with `[@rte](https://github.com/rte)` ([0ffc1db](https://github.com/gabrielecanepa/glore/commit/0ffc1db5f05b3df9da50738103aac8552e0acce5))

## [0.4.13](https://github.com/gabrielecanepa/glore/compare/v0.4.12...v0.4.13) (2025-08-09)

### CI 🤖

- Run type checks depending on the enviroment ([15f30a5](https://github.com/gabrielecanepa/glore/commit/15f30a5a6dd24d4a6ba8a04b8843c95d213c7fb8))

### Other

- Improve database configuration ([ac7f6bd](https://github.com/gabrielecanepa/glore/commit/ac7f6bd7be059d220edd43ee2890e6f079727ef5))
- Replace Snaplet seeding with custom implementation ([477c7a5](https://github.com/gabrielecanepa/glore/commit/477c7a5a0863979a528a3461962ad4a275d38dba))

## [0.4.12](https://github.com/gabrielecanepa/glore/compare/v0.4.11...v0.4.12) (2025-08-06)

### Features ✨

- Add rich text editor ([a5051c7](https://github.com/gabrielecanepa/glore/commit/a5051c76ef5e2e45cb34cdc6eae26195530acad3))
- Enhance rich text editor and improve AI integration ([d54c7f2](https://github.com/gabrielecanepa/glore/commit/d54c7f289390b8d156e90f11edc9beed9261ac78))

### CI 🤖

- Add custom editor chatmode ([b8fc9a0](https://github.com/gabrielecanepa/glore/commit/b8fc9a03e3d95f3dd6c31fd764b2d9d8847ad105))
- Refactor release configuration ([070beac](https://github.com/gabrielecanepa/glore/commit/070beac75d3adb4b3b8c13c3d8c381b101d3d650))

### Build 📦

- Bump Node.js version to 22.18.0 ([c141dad](https://github.com/gabrielecanepa/glore/commit/c141dade9d36e0d16c13d063760a9afa72c3680e))
- **deps:** Bump pnpm to 10.14.0 and all dependencies to latest version ([f9a2e2a](https://github.com/gabrielecanepa/glore/commit/f9a2e2a833f66addbab7e72ead58e0f27e4e1b44))

### Other

- **eslint-config:** Improve relative imports configuration ([bd95a56](https://github.com/gabrielecanepa/glore/commit/bd95a56d52a6eddd9549eb1df5ec9395b22090b2))
- Remove unused editor page ([0e70ea6](https://github.com/gabrielecanepa/glore/commit/0e70ea6dd208a214afb91b200b8043e8aecee03b))
- Restructure course components and improve localization ([512efe9](https://github.com/gabrielecanepa/glore/commit/512efe9413a030c3103094165c9cc08299aedcf3))
- Restructure translator types to allow raw strings ([bc21160](https://github.com/gabrielecanepa/glore/commit/bc2116092e89054b6c0b36c3f551d236c2065c36))
- Update UI component styling and type definitions ([6d4039a](https://github.com/gabrielecanepa/glore/commit/6d4039a5e38354d8ce5a9046f484aa31aecc4598))
- **utils:** Add debounce utility function ([dfeff2b](https://github.com/gabrielecanepa/glore/commit/dfeff2b8a430702655b846536b98714fca116592))

## [0.4.11](https://github.com/gabrielecanepa/glore/compare/v0.4.10...v0.4.11) (2025-07-17)

### Other

- Improve i18n system and course management ([258d596](https://github.com/gabrielecanepa/glore/commit/258d5962612711e65b20eb648f2da464a945d08a))
- Improve sidebar navigation and update translations ([a4022fe](https://github.com/gabrielecanepa/glore/commit/a4022fef2c3c692bbf4b959547e4874cc5c3170f))
- Remove Minimal Tiptap components and extensions ([f1dad16](https://github.com/gabrielecanepa/glore/commit/f1dad165523484dee77fed0192fee9715d210c21))
- Reorganize storage module and improve cookie handling ([45f7f96](https://github.com/gabrielecanepa/glore/commit/45f7f965f37f672edcf7abd68d35472c7ead8d0b))
- Standardize changelog format and update release configuration ([fcad2ce](https://github.com/gabrielecanepa/glore/commit/fcad2ce105133971693641dbd31451b4c830dba0))

## [0.4.10](https://github.com/gabrielecanepa/glore/compare/v0.4.9...v0.4.10) (2025-07-15)

### Features ✨

- Add multi-language course filtering and improved UI components ([efe0edb](https://github.com/gabrielecanepa/glore/commit/efe0edb20076b0eedc26ea9adf55e9811951a78a))

### CI 🤖

- Add commitlint fallback on failure ([a0b40aa](https://github.com/gabrielecanepa/glore/commit/a0b40aa23d6f5c9329a89ce2d5aeeb4a70b0616f))

### Build 📦

- Update pnpm and dependencies to latest versions ([5369192](https://github.com/gabrielecanepa/glore/commit/536919276276ed57058856e32dd91a79269eee34))

### Docs 📑

- Fix version number in changelog ([49f80db](https://github.com/gabrielecanepa/glore/commit/49f80db7b839c7b45cc39081fa879f981357f381))

### Other

- Replace next-intl with use-intl library ([8767627](https://github.com/gabrielecanepa/glore/commit/8767627dad4cdb644fd5bf7e0fe209c60d5967c6))

## [0.4.9](https://github.com/gabrielecanepa/glore/compare/v0.4.8...v0.4.9) (2025-07-11)

### Features ✨

- Improve auth forms UX and component styling ([b7375c0](https://github.com/gabrielecanepa/glore/commit/b7375c042f22ecc673003cf11808006a1e2154ee))

### Fixes 🔧

- Fix database user triggers ([2731ee0](https://github.com/gabrielecanepa/glore/commit/2731ee01a2eecb142b313e1034bdea8561a994dd))

### CI 🤖

- Add automated database migration workflow ([b42b936](https://github.com/gabrielecanepa/glore/commit/b42b93643b0fbc1ce400115814725f56bb66ab98))
- Add configurable issue tracking support to release config ([f2f83e1](https://github.com/gabrielecanepa/glore/commit/f2f83e16c086bb50e622ad7407914030e34df741))
- Add GitHub workflow for automated Notion releases ([409119f](https://github.com/gabrielecanepa/glore/commit/409119f5988462e72d4735d284ac79e4a11195c1))
- Add migration revert functionality and improve environment configuration ([e555c79](https://github.com/gabrielecanepa/glore/commit/e555c79416ba243123074ce01ec3f5a5089bb2a8))

### Build 📦

- Bump dependencies ([cd39342](https://github.com/gabrielecanepa/glore/commit/cd39342dabda16c77e78444061de8b836f0e3ddd))

### Other

- Add database and seed type generation to development script ([55be64b](https://github.com/gabrielecanepa/glore/commit/55be64becb8dfe29050957f2ab31a7ef28fce673))
- Add username trigger and rename assessment trigger ([e1b1c95](https://github.com/gabrielecanepa/glore/commit/e1b1c95860f0a919f3eab6f04f2ae4b311a3823e))
- Clean up environment variables and deployment configuration ([17edb17](https://github.com/gabrielecanepa/glore/commit/17edb174332863b3c25294a3bc19d7c0af2ee9c1))
- Consolidate environment configuration ([91fa716](https://github.com/gabrielecanepa/glore/commit/91fa716f092da2f8096e3d42c6be5d2105dbee09))
- Improve API client architecture for better modularity ([e09a71e](https://github.com/gabrielecanepa/glore/commit/e09a71e7a6b4f134f47e7daae113ac8cbf1c382b))
- Improve seed cache handling ([290f069](https://github.com/gabrielecanepa/glore/commit/290f06940eee4332706fd5ee025a2084d0f6fa91))
- Migrate seed data to Snaplet configuration ([856c13c](https://github.com/gabrielecanepa/glore/commit/856c13c88e79e94cfba64975c6e9072f97743136))
- Remove unnecessary turbo variables ([df3e3e8](https://github.com/gabrielecanepa/glore/commit/df3e3e8efcfcb1456296c829de8bf8b052982897))
- Simplify configuration and improve metadata handling ([b984359](https://github.com/gabrielecanepa/glore/commit/b984359458ef6e2755750c6e11344682792d8f68))
- Update database scripts and update docs ([fcf48f6](https://github.com/gabrielecanepa/glore/commit/fcf48f638faf8b58665c171bf4899d6b9b06e351))
- Update Next.js experimental configuration ([0640930](https://github.com/gabrielecanepa/glore/commit/0640930bb1b0573ada69281b018e52fd9616fc56))

## [0.4.8](https://github.com/gabrielecanepa/glore/compare/v0.4.7...v0.4.8) (2025-07-05)

### CI 🤖

- Add skip CI option to release config ([dc9ed0e](https://github.com/gabrielecanepa/glore/commit/dc9ed0e0cbbcd8306f7f83b93d7c47c3aa40dbf7))

### Other

- Add conditional experimental config based on environment ([493b449](https://github.com/gabrielecanepa/glore/commit/493b44926e00a9f8d519093da1de0e5a632df2f7))
- Improve changelog formatting and CI workflow ([a5320f3](https://github.com/gabrielecanepa/glore/commit/a5320f32769e01fa2e14eb5b06285fd3866f7c10))
- Move scripts from bin to scripts directory ([4d4a276](https://github.com/gabrielecanepa/glore/commit/4d4a2766acce4cf5f66fedcc03880e697c37c46c))

## [0.4.7](https://github.com/gabrielecanepa/glore/compare/v0.4.6...v0.4.7) (2025-07-05)

### Fixes 🔧

- Use correct typegen path and improve `db:dump` script ([21f9c56](https://github.com/gabrielecanepa/glore/commit/21f9c5619b9a42a92fd14f0af35cd3df9e8520b2))

### CI 🤖

- Merge workflows and replace release-it with semantic-release ([f0c1d35](https://github.com/gabrielecanepa/glore/commit/f0c1d35f89d8fed01ea02a6e3fddde494fab1eab))
- Refactor release workflow to use job outputs instead of tag triggers ([f2d14d8](https://github.com/gabrielecanepa/glore/commit/f2d14d855df01cb4df74da9e9f5ddf20123dfca1))
- Rollback semantic-release to release-it ([32df1ac](https://github.com/gabrielecanepa/glore/commit/32df1ac746a043654ae3081002b6c4736a409ef0))
- Use `update-version-in-files` plugin to bump versions on release ([5e93699](https://github.com/gabrielecanepa/glore/commit/5e93699c34761add99a06e501c0e4d40c7d56f00))

### Docs 📑

- Update README with new logo and styling ([0c89d51](https://github.com/gabrielecanepa/glore/commit/0c89d51dd95eeed9203b0028e36eb4a8d0e839a2))

### Other

- Improve database script configuration and environment handling ([dabbff2](https://github.com/gabrielecanepa/glore/commit/dabbff295ffe085055c4671eedf12784eb9acefc))
- Inline release-it config and remove internal package ([6c8463c](https://github.com/gabrielecanepa/glore/commit/6c8463c8fff1183cd39c4d4333a94457380e437d))
- Reorganize config packages structure ([d046ce5](https://github.com/gabrielecanepa/glore/commit/d046ce55101812bf77af61e136910c74b24fb02a))
