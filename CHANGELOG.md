# Changelog

## [0.6.2](https://github.com/glorecertificate/glore/compare/v0.6.1...v0.6.2) (2026-03-24)

### Bug Fixes

- **security:** Address P0/P1 critical vulnerabilities ([f19b440](https://github.com/glorecertificate/glore/commit/f19b440f2b5d20641b1414b51781585b743a1d0d))

### CI

- Skip CI validation on releases ([fb1babb](https://github.com/glorecertificate/glore/commit/fb1babb84ded444754902f097b3d028c240a146a))

### Docs

- Add implementation design specs ([dc0b2a6](https://github.com/glorecertificate/glore/commit/dc0b2a6cee7065294a65a9c1761c1cf17e68fd95))

## [0.6.1](https://github.com/glorecertificate/glore/compare/v0.6.0...v0.6.1) (2026-03-22)

### Features

- Add PWA support ([ae642d4](https://github.com/glorecertificate/glore/commit/ae642d40a4d11b815ec4ba6a64a31ed8e46cd4f2))
- Add session management to account settings ([6e439b5](https://github.com/glorecertificate/glore/commit/6e439b5223d8f087915067ce17481f0b1d7dc470))

### Docs

- Migrate from ship skill to superpowers workflow ([b6b153c](https://github.com/glorecertificate/glore/commit/b6b153c4774a2e20627687caa4e4854658b1927c))

## [0.6.0](https://github.com/glorecertificate/glore/compare/v0.5.1...v0.6.0) (2026-03-19)

### ⚠ BREAKING CHANGES

- Migrate Supabase to Neon and Drizzle, Biome to Oxlint and Oxfmt

### Features

- Add about page content ([c53620a](https://github.com/glorecertificate/glore/commit/c53620a869fb19f1648ca5e8e392d4c30bf6a190))
- Add account deletion ([c8e6584](https://github.com/glorecertificate/glore/commit/c8e6584a4c377c2b847ccb45727b2978c1054a5f))
- Add certificate approval and PDF generation ([3df5069](https://github.com/glorecertificate/glore/commit/3df5069f36c5f97fab7e8490c30823dca1b557be))
- Add certificate resubmission flow after changes requested ([97905fa](https://github.com/glorecertificate/glore/commit/97905fa852521bf5c6dead49fc1b997b2d2c079a))
- Add certificate view and sharing ([7e5e2f5](https://github.com/glorecertificate/glore/commit/7e5e2f59796ca7e204bc294b00f4f4ddbaf67c78))
- Add course analytics and reporting ([5341a04](https://github.com/glorecertificate/glore/commit/5341a04976aeb1e2c85a6987693c6f74c777ed1d))
- Add course editor ([a929687](https://github.com/glorecertificate/glore/commit/a929687ef9a557a817d32cf660a77cf589b45202))
- Add documentation CRUD and UI ([4937e87](https://github.com/glorecertificate/glore/commit/4937e87872ad94693d0829a65bb6366bcd704ae5))
- Add editable fields and validation to certificate review ([be94f93](https://github.com/glorecertificate/glore/commit/be94f93475628dac0e8f59cd36df2d818d06963d))
- Add global search command palette ([8801188](https://github.com/glorecertificate/glore/commit/880118890535b7317e63bfa213a6d9b0d46a413e))
- Add help page content ([2f06268](https://github.com/glorecertificate/glore/commit/2f06268cc98e649d7a20daf441f752f36eb02946))
- Add in-app notification system ([4234394](https://github.com/glorecertificate/glore/commit/423439480a1ba806d2bbc156c72c68abd55c3906))
- Add manual tutor re-assignment for certificates ([927c4a7](https://github.com/glorecertificate/glore/commit/927c4a7b74eca54ac65bdd0de95059d58b2edd75))
- Add new authentication skills and update password reset method ([a30bff0](https://github.com/glorecertificate/glore/commit/a30bff095bf9437731bd6714a2019730c8f7d45e))
- Add organization panel ([44bb8d4](https://github.com/glorecertificate/glore/commit/44bb8d4f25762dbddbaa59f4b92346288b1c7127))
- Add organization registration flow ([9ad9347](https://github.com/glorecertificate/glore/commit/9ad9347af2e2c83da66fa409f8836d0237a1c232))
- Add organization registration flow and admin panel ([b82c686](https://github.com/glorecertificate/glore/commit/b82c686d8e4bc2d13257659ae2f633d99116ada5))
- Add public certificate page ([2fe21e7](https://github.com/glorecertificate/glore/commit/2fe21e77eef977e48b5cce26c447bd9caee53335))
- Add QR code to public certificate page ([5a98940](https://github.com/glorecertificate/glore/commit/5a98940b0cede3941038191adbe2be1bc6978172))
- Add social sharing meta tags to public certificate page ([464b54f](https://github.com/glorecertificate/glore/commit/464b54ff856b94da861b73438a3560b1f130a655))
- Add status filter and date sort to certificate list ([79423af](https://github.com/glorecertificate/glore/commit/79423af7a573c4f2a8d21f42bb51eacc40d0b92f))
- Add team invitations ([1d06f0b](https://github.com/glorecertificate/glore/commit/1d06f0b25ee65f87a3cb339cda48e1b72877eb61))
- Add universal light/dark logo to email templates ([dc010d0](https://github.com/glorecertificate/glore/commit/dc010d089506947e4de90dac9bea13ae89172e1e))
- Add users panel to admin section ([513ee7e](https://github.com/glorecertificate/glore/commit/513ee7e3263739ffd2d22bf3b4d55b2a954742b2))
- Improve auth flow ([4aa4469](https://github.com/glorecertificate/glore/commit/4aa44694396bc7aadc8ae7c4f4f94803fb4d17ac))
- Remove progress bar ([ba632b2](https://github.com/glorecertificate/glore/commit/ba632b281c12ba81b1cdd26bc920d1169cb1b3f9))
- Render breadcrumbs statically and improve course header ([463b25e](https://github.com/glorecertificate/glore/commit/463b25eea260f5dd83a7d92f917af65f14e941d8))

### Bug Fixes

- Enforce single org admin (owner) pattern ([a2f538c](https://github.com/glorecertificate/glore/commit/a2f538c2a2310c99944831b4d2fb43cbb8f193da))
- Fix auth email hook ([4efef5d](https://github.com/glorecertificate/glore/commit/4efef5d43776cb43ce1a579621de60283c0ab02d))

### Chore

- Add `ai` commit type ([cc81655](https://github.com/glorecertificate/glore/commit/cc8165535cf0f922afb6f7e3574cd005ba1d9f69))
- Add default cookie options ([29d3e8f](https://github.com/glorecertificate/glore/commit/29d3e8f52a9fa7e97b87836fe3bf8f94d87d0b74))
- Enable oxlint auto-fix on save ([4f4c7c8](https://github.com/glorecertificate/glore/commit/4f4c7c8452788bffef957d63ea8440049c526ba5))
- Fix Outlook title in email actions footer ([fa33a23](https://github.com/glorecertificate/glore/commit/fa33a230798a561d386c745ef1e117f465c06b73))
- Migrate AI provider from OpenAI to Google Gemini ([17d6210](https://github.com/glorecertificate/glore/commit/17d62101af675e60b91c7e88ac763c7235e1077c))
- Migrate storage from Vercel Blob to Cloudflare R2 ([a17117c](https://github.com/glorecertificate/glore/commit/a17117c3ff8e1165341586628167bf8e4aeb5f80))
- Migrate Supabase to Neon and Drizzle, Biome to Oxlint and Oxfmt ([be16baa](https://github.com/glorecertificate/glore/commit/be16baad687183eae1ffeafcb5ea7f536bf31773))
- Update commit scopes and release types ([7edef54](https://github.com/glorecertificate/glore/commit/7edef548fbee20aed3b5b4768c0ec6f9cd2528f0))

### Performance

- Enable React Compiler and add Suspense boundaries ([6b9f305](https://github.com/glorecertificate/glore/commit/6b9f3057a8ed53550e616f8cf98b8281d8276000))
- Improve rendering performance by restructuring providers and data handling components ([4c56c7b](https://github.com/glorecertificate/glore/commit/4c56c7b9ed70dee4ff6bbcc68f3db96a31fdd094))
- Optimize bundle size and speed up Vercel builds ([4949a52](https://github.com/glorecertificate/glore/commit/4949a5244b4b7a721bf06c8eb19bbb20b86982fb))
- Optimize client bundle size ([9acc2d9](https://github.com/glorecertificate/glore/commit/9acc2d9bbfaa784cb4728d74db16c1323f41d94f))
- Remove tag revalidation from server action mutations ([fa725cb](https://github.com/glorecertificate/glore/commit/fa725cb9310c511913ad79b327cb217ba36b7afa))
- Speed up Vercel builds with webpack worker and output tracing ([b48d643](https://github.com/glorecertificate/glore/commit/b48d64308d571f560bbf3b29c998cda8f692cb51))

### Build

- Add environment variables validation ([b31a573](https://github.com/glorecertificate/glore/commit/b31a57374e9a741738afff329d18ce4a46c1bdda))

### CI

- Add CI workflow for code quality checks ([a11dca0](https://github.com/glorecertificate/glore/commit/a11dca09a7baf006dfa26c6f1bbcaf08df1cc086))
- Add Knip to detect unused files, exports, and dependencies ([cfab190](https://github.com/glorecertificate/glore/commit/cfab19023a95c2ea0547aab1576e7865adf37c36))
- Add preview deployment to `deployment` workflow ([d423b87](https://github.com/glorecertificate/glore/commit/d423b8706d5b1eae86d0232f49769f3b0bac6e67))
- **dev:** Replace lefthook with husky ([b78e0ec](https://github.com/glorecertificate/glore/commit/b78e0ec3cb9c111971263e20e15e35a9fed76f57))
- Run oxlint and knip on push only ([7a097be](https://github.com/glorecertificate/glore/commit/7a097bedc6d7bc8effeda4ed74199b4467554a27))

### Docs

- Add issue and pull request templates ([70bf164](https://github.com/glorecertificate/glore/commit/70bf16467e22c6d5b7ff189148e3084d8a402aaf))
- Update AGENTS file ([23ee76b](https://github.com/glorecertificate/glore/commit/23ee76bda1294d2afb7a774b985292f448b5ffcd))

### Other

- Add `commit` and `ship` skills ([2740dfe](https://github.com/glorecertificate/glore/commit/2740dfea660cf06069a0cc25cdd1dfb368d5d1d3))
- Add email best practices skills ([0869aad](https://github.com/glorecertificate/glore/commit/0869aadbb990fadd73d6784f59758e9d88d2d809))
- Add project roadmap, spec, and certificate template ([613c4b4](https://github.com/glorecertificate/glore/commit/613c4b4e05eca5cd344a44398313ec82c259563b))
- Clean up global styles and button variants ([4ba4180](https://github.com/glorecertificate/glore/commit/4ba4180133b44d3e3d105c875199dd415015dbea))
- Review release-it configuration and reorganize utilities and types ([a8a1ba5](https://github.com/glorecertificate/glore/commit/a8a1ba51b6b2a51fca6e8102167ca5fdc6f8b92d))
- Update `ship` skill and add spec and roadmap templates ([4a60a3b](https://github.com/glorecertificate/glore/commit/4a60a3b7ca46cb0850836bec8a4de2486793d641))

## [0.5.1](https://github.com/glorecertificate/glore/compare/v0.5.0...v0.5.1) (2026-01-18)

### Features ✨

- Add custom mailer adn review project structure ([6f1950f](https://github.com/glorecertificate/glore/commit/6f1950fa4fe88e32bfac39be4fdca883af2a3d4b))
- Allow editing courses information and settings ([08a28e5](https://github.com/glorecertificate/glore/commit/08a28e5d7e4519366d33073d14b9d272422b77e3))
- Enhance courses ([a320931](https://github.com/glorecertificate/glore/commit/a3209313aa8cc796c46feac981a377af7ae3a010))
- Enhance layout components ([ec7ec6d](https://github.com/glorecertificate/glore/commit/ec7ec6d70791439f043abad54dba620ebd74ce9c))
- Improve course list ([d1cc4c0](https://github.com/glorecertificate/glore/commit/d1cc4c02fb89130e55cd120b1a90e39b36406c73))

### CI 🤖

- Fix release changelog format ([7e08ae7](https://github.com/glorecertificate/glore/commit/7e08ae7c4dc068bdd9879c38aa5d949d634dc6dd))
- Limit deployments in GitHub Actions workflows ([71d650c](https://github.com/glorecertificate/glore/commit/71d650c2dd3d22d1bfb95fe7a4fae5a821b63036))

### Docs 📑

- Update references to repository ([b276e7d](https://github.com/glorecertificate/glore/commit/b276e7d3e65557be03e6a0070d37b69de1e22c4c))

### Other

- Turn monorepo into single-package workspace ([4d81196](https://github.com/glorecertificate/glore/commit/4d8119627d1b7388e33cdfdf3329c46ae6b25628))
- Use server actions ([a34cbcb](https://github.com/glorecertificate/glore/commit/a34cbcbfa7758c387ea99409ff204fd5d8a860b8))

## [0.5.0](https://github.com/glorecertificate/glore/compare/v0.4.14...v0.5.0) (2025-09-29)

### ⚠ BREAKING CHANGES

- env variable names and cookie keys have been updates, update the local `.env` file accordingly.

### Features ✨

- Add course info component and improve course UI ([9a31c69](https://github.com/glorecertificate/glore/commit/9a31c691389ab9025f1a97ebdd700d72cd1d1125))
- Enhance course management with improved UI ([859a2be](https://github.com/glorecertificate/glore/commit/859a2be7add96400072c58d043e27c5e62d9da38))
- Unify i18n and courses with new schema ([0875d62](https://github.com/glorecertificate/glore/commit/0875d62c6fed02dd59059a5f56a0aa7d9ef3e1b9))

### Fixes 🔧

- Update login validation to render inline errors ([5c745cd](https://github.com/glorecertificate/glore/commit/5c745cddc06994db71524228f4d51ae468ebb21a))

### CI 🤖

- **eslint-config:** Optimize ESLint typed rules and simplify restricted imports ([58d87d3](https://github.com/glorecertificate/glore/commit/58d87d317c2273c7165c4cc7aa7a5cfede8784ed))
- Optimize database deployment with conditional checks ([0b33e53](https://github.com/glorecertificate/glore/commit/0b33e53f52a068f53d9a795f3ac904f3f17fe7ad))
- Replace watch script with dev command ([35de654](https://github.com/glorecertificate/glore/commit/35de6543c3d3f1f096d712c4901de387e8961351))

### Other

- Fix deploy workflow ([ff3a0c4](https://github.com/glorecertificate/glore/commit/ff3a0c486c7e4bfac757a80a9151eb6b953d07ef))
- Manage per-course language preference with cookies ([1e9f4ab](https://github.com/glorecertificate/glore/commit/1e9f4aba9b8489c89da97818567841ee113e7be7))
- Refactor auth, env config and use shared UI ([47b4981](https://github.com/glorecertificate/glore/commit/47b4981a3a77f02b17c8dd80275e95de7c639146))
- Replace skills with courses in data model ([ec6a8e1](https://github.com/glorecertificate/glore/commit/ec6a8e1248b637d2d3f0adf368b70a6c217a1a8b))

## [0.4.14](https://github.com/glorecertificate/glore/compare/v0.4.13...v0.4.14) (2025-08-16)

### Build 📦

- **deps:** Bump dependencies to latest patch ([5c597fc](https://github.com/glorecertificate/glore/commit/5c597fcc744b82ecda419611bb5de988190ca723))

### Other

- Add health check API endpoint ([a8d038c](https://github.com/glorecertificate/glore/commit/a8d038c0d25d9be9ab05c907080c439b3b60a78c))
- Enhance course management with improved UI and new utilities ([b167890](https://github.com/glorecertificate/glore/commit/b1678902c208019bec31166cb4624422c5022fbf))
- Reorganize API modules ([c5949a2](https://github.com/glorecertificate/glore/commit/c5949a2ef3abd222a5a9817c13a2f111561e32c4))
- Replace `#rte` path alias with `[@rte](https://github.com/rte)` ([0ffc1db](https://github.com/glorecertificate/glore/commit/0ffc1db5f05b3df9da50738103aac8552e0acce5))

## [0.4.13](https://github.com/glorecertificate/glore/compare/v0.4.12...v0.4.13) (2025-08-09)

### CI 🤖

- Run type checks depending on the enviroment ([15f30a5](https://github.com/glorecertificate/glore/commit/15f30a5a6dd24d4a6ba8a04b8843c95d213c7fb8))

### Other

- Improve database configuration ([ac7f6bd](https://github.com/glorecertificate/glore/commit/ac7f6bd7be059d220edd43ee2890e6f079727ef5))
- Replace Snaplet seeding with custom implementation ([477c7a5](https://github.com/glorecertificate/glore/commit/477c7a5a0863979a528a3461962ad4a275d38dba))

## [0.4.12](https://github.com/glorecertificate/glore/compare/v0.4.11...v0.4.12) (2025-08-06)

### Features ✨

- Add rich text editor ([a5051c7](https://github.com/glorecertificate/glore/commit/a5051c76ef5e2e45cb34cdc6eae26195530acad3))
- Enhance rich text editor and improve AI integration ([d54c7f2](https://github.com/glorecertificate/glore/commit/d54c7f289390b8d156e90f11edc9beed9261ac78))

### CI 🤖

- Add custom editor chatmode ([b8fc9a0](https://github.com/glorecertificate/glore/commit/b8fc9a03e3d95f3dd6c31fd764b2d9d8847ad105))
- Refactor release configuration ([070beac](https://github.com/glorecertificate/glore/commit/070beac75d3adb4b3b8c13c3d8c381b101d3d650))

### Build 📦

- Bump Node.js version to 22.18.0 ([c141dad](https://github.com/glorecertificate/glore/commit/c141dade9d36e0d16c13d063760a9afa72c3680e))
- **deps:** Bump pnpm to 10.14.0 and all dependencies to latest version ([f9a2e2a](https://github.com/glorecertificate/glore/commit/f9a2e2a833f66addbab7e72ead58e0f27e4e1b44))

### Other

- **eslint-config:** Improve relative imports configuration ([bd95a56](https://github.com/glorecertificate/glore/commit/bd95a56d52a6eddd9549eb1df5ec9395b22090b2))
- Remove unused editor page ([0e70ea6](https://github.com/glorecertificate/glore/commit/0e70ea6dd208a214afb91b200b8043e8aecee03b))
- Restructure course components and improve localization ([512efe9](https://github.com/glorecertificate/glore/commit/512efe9413a030c3103094165c9cc08299aedcf3))
- Restructure translator types to allow raw strings ([bc21160](https://github.com/glorecertificate/glore/commit/bc2116092e89054b6c0b36c3f551d236c2065c36))
- Update UI component styling and type definitions ([6d4039a](https://github.com/glorecertificate/glore/commit/6d4039a5e38354d8ce5a9046f484aa31aecc4598))
- **utils:** Add debounce utility function ([dfeff2b](https://github.com/glorecertificate/glore/commit/dfeff2b8a430702655b846536b98714fca116592))

## [0.4.11](https://github.com/glorecertificate/glore/compare/v0.4.10...v0.4.11) (2025-07-17)

### Other

- Improve i18n system and course management ([258d596](https://github.com/glorecertificate/glore/commit/258d5962612711e65b20eb648f2da464a945d08a))
- Improve sidebar navigation and update translations ([a4022fe](https://github.com/glorecertificate/glore/commit/a4022fef2c3c692bbf4b959547e4874cc5c3170f))
- Remove Minimal Tiptap components and extensions ([f1dad16](https://github.com/glorecertificate/glore/commit/f1dad165523484dee77fed0192fee9715d210c21))
- Reorganize storage module and improve cookie handling ([45f7f96](https://github.com/glorecertificate/glore/commit/45f7f965f37f672edcf7abd68d35472c7ead8d0b))
- Standardize changelog format and update release configuration ([fcad2ce](https://github.com/glorecertificate/glore/commit/fcad2ce105133971693641dbd31451b4c830dba0))

## [0.4.10](https://github.com/glorecertificate/glore/compare/v0.4.9...v0.4.10) (2025-07-15)

### Features ✨

- Add multi-language course filtering and improved UI components ([efe0edb](https://github.com/glorecertificate/glore/commit/efe0edb20076b0eedc26ea9adf55e9811951a78a))

### CI 🤖

- Add commitlint fallback on failure ([a0b40aa](https://github.com/glorecertificate/glore/commit/a0b40aa23d6f5c9329a89ce2d5aeeb4a70b0616f))

### Build 📦

- Update pnpm and dependencies to latest versions ([5369192](https://github.com/glorecertificate/glore/commit/536919276276ed57058856e32dd91a79269eee34))

### Docs 📑

- Fix version number in changelog ([49f80db](https://github.com/glorecertificate/glore/commit/49f80db7b839c7b45cc39081fa879f981357f381))

### Other

- Replace next-intl with use-intl library ([8767627](https://github.com/glorecertificate/glore/commit/8767627dad4cdb644fd5bf7e0fe209c60d5967c6))

## [0.4.9](https://github.com/glorecertificate/glore/compare/v0.4.8...v0.4.9) (2025-07-11)

### Features ✨

- Improve auth forms UX and component styling ([b7375c0](https://github.com/glorecertificate/glore/commit/b7375c042f22ecc673003cf11808006a1e2154ee))

### Fixes 🔧

- Fix database user triggers ([2731ee0](https://github.com/glorecertificate/glore/commit/2731ee01a2eecb142b313e1034bdea8561a994dd))

### CI 🤖

- Add automated database migration workflow ([b42b936](https://github.com/glorecertificate/glore/commit/b42b93643b0fbc1ce400115814725f56bb66ab98))
- Add configurable issue tracking support to release config ([f2f83e1](https://github.com/glorecertificate/glore/commit/f2f83e16c086bb50e622ad7407914030e34df741))
- Add GitHub workflow for automated Notion releases ([409119f](https://github.com/glorecertificate/glore/commit/409119f5988462e72d4735d284ac79e4a11195c1))
- Add migration revert functionality and improve environment configuration ([e555c79](https://github.com/glorecertificate/glore/commit/e555c79416ba243123074ce01ec3f5a5089bb2a8))

### Build 📦

- Bump dependencies ([cd39342](https://github.com/glorecertificate/glore/commit/cd39342dabda16c77e78444061de8b836f0e3ddd))

### Other

- Add database and seed type generation to development script ([55be64b](https://github.com/glorecertificate/glore/commit/55be64becb8dfe29050957f2ab31a7ef28fce673))
- Add username trigger and rename assessment trigger ([e1b1c95](https://github.com/glorecertificate/glore/commit/e1b1c95860f0a919f3eab6f04f2ae4b311a3823e))
- Clean up environment variables and deployment configuration ([17edb17](https://github.com/glorecertificate/glore/commit/17edb174332863b3c25294a3bc19d7c0af2ee9c1))
- Consolidate environment configuration ([91fa716](https://github.com/glorecertificate/glore/commit/91fa716f092da2f8096e3d42c6be5d2105dbee09))
- Improve API client architecture for better modularity ([e09a71e](https://github.com/glorecertificate/glore/commit/e09a71e7a6b4f134f47e7daae113ac8cbf1c382b))
- Improve seed cache handling ([290f069](https://github.com/glorecertificate/glore/commit/290f06940eee4332706fd5ee025a2084d0f6fa91))
- Migrate seed data to Snaplet configuration ([856c13c](https://github.com/glorecertificate/glore/commit/856c13c88e79e94cfba64975c6e9072f97743136))
- Remove unnecessary turbo variables ([df3e3e8](https://github.com/glorecertificate/glore/commit/df3e3e8efcfcb1456296c829de8bf8b052982897))
- Simplify configuration and improve metadata handling ([b984359](https://github.com/glorecertificate/glore/commit/b984359458ef6e2755750c6e11344682792d8f68))
- Update database scripts and update docs ([fcf48f6](https://github.com/glorecertificate/glore/commit/fcf48f638faf8b58665c171bf4899d6b9b06e351))
- Update Next.js experimental configuration ([0640930](https://github.com/glorecertificate/glore/commit/0640930bb1b0573ada69281b018e52fd9616fc56))

## [0.4.8](https://github.com/glorecertificate/glore/compare/v0.4.7...v0.4.8) (2025-07-05)

### CI 🤖

- Add skip CI option to release config ([dc9ed0e](https://github.com/glorecertificate/glore/commit/dc9ed0e0cbbcd8306f7f83b93d7c47c3aa40dbf7))

### Other

- Add conditional experimental config based on environment ([493b449](https://github.com/glorecertificate/glore/commit/493b44926e00a9f8d519093da1de0e5a632df2f7))
- Improve changelog formatting and CI workflow ([a5320f3](https://github.com/glorecertificate/glore/commit/a5320f32769e01fa2e14eb5b06285fd3866f7c10))
- Move scripts from bin to scripts directory ([4d4a276](https://github.com/glorecertificate/glore/commit/4d4a2766acce4cf5f66fedcc03880e697c37c46c))

## [0.4.7](https://github.com/glorecertificate/glore/compare/v0.4.6...v0.4.7) (2025-07-05)

### Fixes 🔧

- Use correct typegen path and improve `db:dump` script ([21f9c56](https://github.com/glorecertificate/glore/commit/21f9c5619b9a42a92fd14f0af35cd3df9e8520b2))

### CI 🤖

- Merge workflows and replace release-it with semantic-release ([f0c1d35](https://github.com/glorecertificate/glore/commit/f0c1d35f89d8fed01ea02a6e3fddde494fab1eab))
- Refactor release workflow to use job outputs instead of tag triggers ([f2d14d8](https://github.com/glorecertificate/glore/commit/f2d14d855df01cb4df74da9e9f5ddf20123dfca1))
- Rollback semantic-release to release-it ([32df1ac](https://github.com/glorecertificate/glore/commit/32df1ac746a043654ae3081002b6c4736a409ef0))
- Use `update-version-in-files` plugin to bump versions on release ([5e93699](https://github.com/glorecertificate/glore/commit/5e93699c34761add99a06e501c0e4d40c7d56f00))

### Docs 📑

- Update README with new logo and styling ([0c89d51](https://github.com/glorecertificate/glore/commit/0c89d51dd95eeed9203b0028e36eb4a8d0e839a2))

### Other

- Improve database script configuration and environment handling ([dabbff2](https://github.com/glorecertificate/glore/commit/dabbff295ffe085055c4671eedf12784eb9acefc))
- Inline release-it config and remove internal package ([6c8463c](https://github.com/glorecertificate/glore/commit/6c8463c8fff1183cd39c4d4333a94457380e437d))
- Reorganize config packages structure ([d046ce5](https://github.com/glorecertificate/glore/commit/d046ce55101812bf77af61e136910c74b24fb02a))
